from datetime import UTC, datetime
from uuid import uuid4

from prisma import Json, Prisma
from prisma.types import (
    ChatMessageCreateWithoutRelationsInput,
    ChatSessionCreateWithoutRelationsInput,
    ChatSessionWhereInput,
)
from pydantic import BaseModel, TypeAdapter

from backend.copilot.model import ChatSessionMetadata
from backend.copilot.service import strip_server_injected_tags
from backend.data.db import query_raw_with_schema, transaction

from .import_archive_models import (
    DIRECTORY_IMPORT_SOURCES,
    ConversationToImport,
    ImportedMessage,
)

_messages_adapter = TypeAdapter(list[ImportedMessage])
SessionImport = tuple[ChatSessionCreateWithoutRelationsInput, list[ImportedMessage]]


class _ArchiveID(BaseModel):
    id: str


async def sync_native_chats(
    user_id: str, organization_id: str, conversations: list[ConversationToImport]
) -> tuple[int, int]:
    """Create a batch of native sessions without modifying existing copies."""
    unique: dict[str, ConversationToImport] = {}
    for chat in conversations:
        source_key = _source_key(chat.source, chat.fingerprint())
        if source_key is None:
            raise ValueError("Unsupported native chat source")
        unique.setdefault(source_key, chat)

    now = datetime.now(UTC)
    imports = [
        (
            _session_row(
                user_id,
                organization_id,
                chat.title,
                next(
                    (
                        message.timestamp
                        for message in chat.messages
                        if message.timestamp
                    ),
                    now,
                ),
                source_key,
            ),
            chat.messages,
        )
        for source_key, chat in sorted(unique.items())
    ]
    async with transaction() as tx:
        inserted = await _insert_sessions(tx, imports)
    added = len(inserted)
    return added, len(conversations) - added


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
        archive = await tx.importedchatconversation.find_unique_or_raise(
            where={"id": chat_id}
        )
        source_key = _source_key(archive.source, archive.fingerprint)
        matches: list[ChatSessionWhereInput] = [{"importedChatId": chat_id}]
        if source_key is not None:
            matches.append({"importedSourceKey": source_key})
        where: ChatSessionWhereInput = {
            "userId": user_id,
            "organizationId": organization_id,
            "OR": matches,
        }
        existing = await tx.chatsession.find_first(where=where)
        if existing is not None:
            return existing.id
        row = _session_row(
            user_id,
            organization_id,
            archive.title,
            archive.createdAt or archive.importedAt,
            source_key,
            archive_id=chat_id,
        )
        inserted = await _insert_sessions(
            tx, [(row, _messages_adapter.validate_python(archive.messages))]
        )
        if inserted:
            return row["id"]
        return (await tx.chatsession.find_first_or_raise(where=where)).id


def _source_key(source: str, fingerprint: str) -> str | None:
    return f"{source}:{fingerprint}" if source in DIRECTORY_IMPORT_SOURCES else None


def _session_row(
    user_id: str,
    organization_id: str,
    title: str,
    created_at: datetime,
    source_key: str | None,
    *,
    archive_id: str | None = None,
) -> ChatSessionCreateWithoutRelationsInput:
    return {
        "id": str(uuid4()),
        "userId": user_id,
        "organizationId": organization_id,
        "importedChatId": archive_id,
        "importedSourceKey": source_key,
        "title": title,
        "createdAt": created_at,
        "metadata": Json(
            ChatSessionMetadata(
                origin="interactive", managed_models_only=True
            ).model_dump()
        ),
    }


async def _insert_sessions(tx: Prisma, imports: list[SessionImport]) -> set[str]:
    rows = [row for row, _ in imports]
    ids = [row["id"] for row in rows]
    added = await tx.chatsession.create_many(data=rows, skip_duplicates=True)
    if not added:
        return set()
    inserted = (
        set(ids)
        if added == len(ids)
        else {
            session.id
            for session in await tx.chatsession.find_many(where={"id": {"in": ids}})
        }
    )
    history = [
        message_row
        for row, messages in imports
        if row["id"] in inserted
        for message_row in _history_rows(row["id"], messages, row["createdAt"])
    ]
    await tx.chatmessage.create_many(data=history)
    return inserted


def _history_rows(
    session_id: str, messages: list[ImportedMessage], created_at: datetime
) -> list[ChatMessageCreateWithoutRelationsInput]:
    return [
        {
            "sessionId": session_id,
            "role": message.role,
            "content": strip_server_injected_tags(message.text),
            "sequence": sequence,
            "createdAt": message.timestamp or created_at,
            "metadata": Json({"kind": "imported_archive_message"}),
        }
        for sequence, message in enumerate(messages)
    ]
