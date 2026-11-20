from prisma import Json
from prisma.models import ImportedChatConversation
from prisma.types import ChatMessageCreateWithoutRelationsInput
from pydantic import BaseModel, TypeAdapter

from backend.copilot.model import ChatSessionMetadata
from backend.copilot.service import strip_server_injected_tags
from backend.data.db import query_raw_with_schema, transaction

from .import_archive_models import ImportedMessage

_messages_adapter = TypeAdapter(list[ImportedMessage])


class _ArchiveID(BaseModel):
    id: str


async def sync_imported_chat(
    chat_id: str, user_id: str, organization_id: str
) -> str | None:
    """Copy an owned archive once per organization, without rewriting live history."""
    async with transaction() as tx:
        archives = await query_raw_with_schema(
            'SELECT "id" FROM {schema_prefix}"ImportedChatConversation" '
            'WHERE "id" = $1 AND "userId" = $2 FOR NO KEY UPDATE',
            chat_id,
            user_id,
            model=_ArchiveID,
            client=tx,
        )
        if not archives:
            return None
        existing = await tx.chatsession.find_first(
            where={
                "userId": user_id,
                "importedChatId": chat_id,
                "organizationId": organization_id,
            }
        )
        if existing is not None:
            return existing.id
        archive = await tx.importedchatconversation.find_unique_or_raise(
            where={"id": chat_id}
        )
        session = await tx.chatsession.create(
            data={
                "userId": user_id,
                "organizationId": organization_id,
                "importedChatId": chat_id,
                "title": archive.title,
                "createdAt": archive.createdAt or archive.importedAt,
                "metadata": Json(
                    ChatSessionMetadata(
                        origin="interactive", managed_models_only=True
                    ).model_dump()
                ),
                "Messages": {"create": _history_rows(archive)},
            }
        )
        return session.id


def _history_rows(
    archive: ImportedChatConversation,
) -> list[ChatMessageCreateWithoutRelationsInput]:
    return [
        {
            "role": message.role,
            "content": strip_server_injected_tags(message.text),
            "sequence": sequence,
            "createdAt": message.timestamp or archive.createdAt or archive.importedAt,
            "metadata": Json({"kind": "imported_archive_message"}),
        }
        for sequence, message in enumerate(
            _messages_adapter.validate_python(archive.messages)
        )
    ]
