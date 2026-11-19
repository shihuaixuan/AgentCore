from hashlib import sha256

from prisma import Base64, Json, Prisma, get_client
from prisma.models import ImportedChatAttachment
from prisma.types import (
    ImportedChatAttachmentCreateWithoutRelationsInput,
    ImportedChatConversationCreateWithoutRelationsInput,
)
from pydantic import BaseModel

from backend.data.db import query_raw_with_schema, transaction

from .import_archive_models import (
    MAX_ATTACHMENTS,
    MAX_ATTACHMENTS_BYTES,
    AttachmentUpload,
    ConversationToImport,
    ImportedAttachment,
)


class ArchiveAttachmentLimitExceeded(Exception):
    pass


class _ArchiveID(BaseModel):
    id: str


class _StoredAttachment(ImportedAttachment):
    sha256: str


async def save_conversations(
    user_id: str, conversations: list[ConversationToImport]
) -> tuple[int, int]:
    added = await get_client().importedchatconversation.create_many(
        data=[_conversation_row(user_id, chat) for chat in conversations],
        skip_duplicates=True,
    )
    return added, len(conversations) - added


async def save_conversation_with_attachments(
    user_id: str,
    conversation: ConversationToImport,
    attachments: list[AttachmentUpload],
) -> tuple[int, int]:
    unique = {
        (item.name, sha256(item.content).hexdigest()): item for item in attachments
    }
    chat_row = _conversation_row(user_id, conversation)
    async with transaction() as tx:
        added = await tx.importedchatconversation.create_many(
            data=[chat_row], skip_duplicates=True
        )
        archives = await query_raw_with_schema(
            'SELECT "id" FROM {schema_prefix}"ImportedChatConversation" '
            'WHERE "userId" = $1 AND "source" = $2 AND "fingerprint" = $3 '
            "FOR NO KEY UPDATE",
            user_id,
            conversation.source,
            conversation.fingerprint(),
            model=_ArchiveID,
            client=tx,
        )
        if not archives:
            raise ArchiveDeletedDuringImport()
        await _append_attachments(tx, archives[0].id, unique)
    return added, 1 - added


class ArchiveDeletedDuringImport(Exception):
    pass


async def list_attachments(chat_id: str, user_id: str) -> list[ImportedAttachment]:
    return await query_raw_with_schema(
        'SELECT a."id", a."name", a."size" '
        'FROM {schema_prefix}"ImportedChatAttachment" a '
        'JOIN {schema_prefix}"ImportedChatConversation" c ON c."id" = a."conversationId" '
        'WHERE a."conversationId" = $1 AND c."userId" = $2 '
        'ORDER BY a."name", a."id"',
        chat_id,
        user_id,
        model=ImportedAttachment,
    )


async def get_attachment(
    chat_id: str, attachment_id: str, user_id: str
) -> ImportedChatAttachment | None:
    return await get_client().importedchatattachment.find_first(
        where={
            "id": attachment_id,
            "conversationId": chat_id,
            "Conversation": {"is": {"userId": user_id}},
        }
    )


async def _append_attachments(
    tx: Prisma, chat_id: str, unique: dict[tuple[str, str], AttachmentUpload]
) -> None:
    """Read quota and append while holding the parent row lock."""
    existing = await query_raw_with_schema(
        'SELECT "id", "name", "size", "sha256" '
        'FROM {schema_prefix}"ImportedChatAttachment" WHERE "conversationId" = $1',
        chat_id,
        model=_StoredAttachment,
        client=tx,
    )
    new_keys = unique.keys() - {(item.name, item.sha256) for item in existing}
    if not new_keys:
        return
    if (
        len(existing) + len(new_keys) > MAX_ATTACHMENTS
        or sum(item.size for item in existing)
        + sum(len(unique[key].content) for key in new_keys)
        > MAX_ATTACHMENTS_BYTES
    ):
        raise ArchiveAttachmentLimitExceeded()
    rows: list[ImportedChatAttachmentCreateWithoutRelationsInput] = [
        {
            "conversationId": chat_id,
            "name": name,
            "sha256": digest,
            "size": len(unique[name, digest].content),
            "content": Base64.encode(unique[name, digest].content),
        }
        for name, digest in new_keys
    ]
    await tx.importedchatattachment.create_many(data=rows)


def _conversation_row(
    user_id: str, conversation: ConversationToImport
) -> ImportedChatConversationCreateWithoutRelationsInput:
    return {
        "userId": user_id,
        "source": conversation.source,
        "fingerprint": conversation.fingerprint(),
        "title": conversation.title,
        "messages": Json(
            [message.model_dump(mode="json") for message in conversation.messages]
        ),
        "messageCount": len(conversation.messages),
        "createdAt": next(
            (
                message.timestamp
                for message in conversation.messages
                if message.timestamp is not None
            ),
            None,
        ),
    }
