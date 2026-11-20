import logging
from datetime import datetime
from typing import Annotated
from urllib.parse import quote

from aioclamd import ClamdError
from autogpt_libs import auth
from fastapi import APIRouter, HTTPException, Query, Request, Response, Security
from httpx import HTTPError
from prisma import get_client
from prisma.errors import PrismaError
from prisma.models import ImportedChatConversation
from pydantic import BaseModel, TypeAdapter

from backend.api.middleware.body_limit import request_body_limit
from backend.data.db import query_raw_with_schema
from backend.util.virus_scanner import get_virus_scanner

from .import_archive_db import (
    ArchiveAttachmentLimitExceeded,
    ArchiveDeletedDuringImport,
    get_attachment,
    list_attachments,
    save_conversation_with_attachments,
    save_conversations,
)
from .import_archive_models import (
    CONVERSATION_BODY_LIMIT,
    DIRECTORY_IMPORT_SOURCES,
    MULTIPART_BODY_LIMIT,
    AttachmentUpload,
    ChatImportSource,
    ImportConversationsRequest,
    ImportConversationsResult,
    ImportedChatDetail,
    ImportedChatList,
    ImportedChatSummary,
    ImportedChatSyncResult,
    ImportedMessage,
)
from .import_archive_multipart import MULTIPART_OPENAPI_BODY, read_attachment_import
from .import_archive_sync import sync_imported_chat, sync_native_chats

router = APIRouter(prefix="/imports")
logger = logging.getLogger(__name__)
Owner = Annotated[str, Security(auth.get_user_id)]
_source_adapter = TypeAdapter(ChatImportSource)
_messages_adapter = TypeAdapter(list[ImportedMessage])
_ARCHIVE_ERRORS = (PrismaError, HTTPError, OSError, RuntimeError, TypeError, ValueError)


@router.post("")
@request_body_limit(CONVERSATION_BODY_LIMIT)
async def import_conversations(
    request: ImportConversationsRequest, user_id: Owner
) -> ImportConversationsResult:
    try:
        added, duplicates = await save_conversations(user_id, request.conversations)
    except _ARCHIVE_ERRORS as error:
        raise archive_unavailable(error) from None
    return ImportConversationsResult(added=added, duplicates=duplicates)


@router.post("/with-attachments", openapi_extra=MULTIPART_OPENAPI_BODY)
@request_body_limit(MULTIPART_BODY_LIMIT)
async def import_conversation_with_attachments(
    request: Request, user_id: Owner
) -> ImportConversationsResult:
    conversation, attachments = await read_attachment_import(request)
    await scan_attachments(attachments)
    try:
        added, duplicates = await save_conversation_with_attachments(
            user_id, conversation, attachments
        )
    except ArchiveAttachmentLimitExceeded:
        raise HTTPException(
            status_code=413, detail="Archive attachment limit exceeded"
        ) from None
    except ArchiveDeletedDuringImport:
        raise HTTPException(
            status_code=409, detail="Archive was deleted during import; retry"
        ) from None
    except _ARCHIVE_ERRORS as error:
        raise archive_unavailable(error) from None
    return ImportConversationsResult(added=added, duplicates=duplicates)


@router.post("/sync")
@request_body_limit(CONVERSATION_BODY_LIMIT)
async def sync_native_conversations(
    request: ImportConversationsRequest,
    ctx: Annotated[auth.RequestContext, Security(auth.get_request_context)],
) -> ImportConversationsResult:
    """Import local WorkBuddy and QwenWork text directly as private sessions."""
    if any(
        chat.source not in DIRECTORY_IMPORT_SOURCES for chat in request.conversations
    ):
        raise HTTPException(status_code=422, detail="Unsupported native chat source")
    try:
        added, duplicates = await sync_native_chats(
            ctx.user_id, ctx.org_id, request.conversations
        )
    except _ARCHIVE_ERRORS as error:
        raise archive_unavailable(error) from None
    return ImportConversationsResult(added=added, duplicates=duplicates)


@router.get("")
async def list_imported_chats(
    user_id: Owner,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
    limit: Annotated[int, Query(ge=1, le=50)] = 25,
) -> ImportedChatList:
    rows = await query_raw_with_schema(
        'SELECT "id", "source", "title", "createdAt", "importedAt", "messageCount" '
        'FROM {schema_prefix}"ImportedChatConversation" WHERE "userId" = $1 '
        'ORDER BY "importedAt" DESC, "id" DESC OFFSET $2 LIMIT $3',
        user_id,
        offset,
        limit + 1,
        model=ImportedChatSummaryRow,
    )
    return ImportedChatList(
        items=[summary(row) for row in rows[:limit]], has_more=len(rows) > limit
    )


@router.get("/{chat_id}")
async def get_imported_chat(chat_id: str, user_id: Owner) -> ImportedChatDetail:
    try:
        row = await get_client().importedchatconversation.find_first(
            where={"id": chat_id, "userId": user_id}
        )
        if row is not None:
            return ImportedChatDetail(
                **summary(row).model_dump(),
                messages=_messages_adapter.validate_python(row.messages),
                attachments=await list_attachments(chat_id, user_id),
            )
    except _ARCHIVE_ERRORS as error:
        raise archive_unavailable(error) from None
    raise HTTPException(status_code=404, detail="Imported chat not found")


@router.post("/{chat_id}/sync")
async def sync_imported_conversation(
    chat_id: str,
    ctx: Annotated[auth.RequestContext, Security(auth.get_request_context)],
) -> ImportedChatSyncResult:
    """Open a private, continuable copy of a saved conversation in the active organization."""
    try:
        session_id = await sync_imported_chat(chat_id, ctx.user_id, ctx.org_id)
    except _ARCHIVE_ERRORS as error:
        raise archive_unavailable(error) from None
    if session_id is None:
        raise HTTPException(status_code=404, detail="Imported chat not found")
    return ImportedChatSyncResult(session_id=session_id)


@router.get(
    "/{chat_id}/attachments/{attachment_id}",
    response_class=Response,
    responses={
        200: {
            "content": {
                "application/octet-stream": {
                    "schema": {"type": "string", "format": "binary"}
                }
            }
        }
    },
)
async def download_attachment(
    chat_id: str, attachment_id: str, user_id: Owner
) -> Response:
    try:
        attachment = await get_attachment(chat_id, attachment_id, user_id)
        if attachment is not None:
            return Response(
                attachment.content.decode(),
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": f"attachment; filename*=UTF-8''{quote(attachment.name, safe='')}",
                    "X-Content-Type-Options": "nosniff",
                    "Cache-Control": "private, no-store",
                },
            )
    except _ARCHIVE_ERRORS as error:
        raise archive_unavailable(error) from None
    raise HTTPException(status_code=404, detail="Archive attachment not found")


@router.delete("/{chat_id}", status_code=204)
async def delete_imported_chat(chat_id: str, user_id: Owner) -> None:
    deleted = await get_client().importedchatconversation.delete_many(
        where={"id": chat_id, "userId": user_id}
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Imported chat not found")


class ImportedChatSummaryRow(BaseModel):
    id: str
    source: str
    title: str
    createdAt: datetime | None
    importedAt: datetime
    messageCount: int


def summary(
    row: ImportedChatSummaryRow | ImportedChatConversation,
) -> ImportedChatSummary:
    return ImportedChatSummary(
        id=row.id,
        source=_source_adapter.validate_python(row.source),
        title=row.title,
        created_at=row.createdAt,
        imported_at=row.importedAt,
        message_count=row.messageCount,
    )


async def scan_attachments(attachments: list[AttachmentUpload]) -> None:
    try:
        scanner = get_virus_scanner()
        if (
            not scanner.settings.clamav_service_enabled
            or scanner.settings.mark_failed_scans_as_clean
        ):
            raise RuntimeError("Archive attachments require fail-closed scanning")
        for attachment in attachments:
            result = await scanner.scan_file(attachment.content)
            if not result.is_clean:
                break
        else:
            return
    except (ClamdError, OSError, RuntimeError, ValueError):
        raise HTTPException(
            status_code=503, detail="Attachment scanner unavailable"
        ) from None
    raise HTTPException(status_code=422, detail="An attachment failed the safety scan")


def archive_unavailable(error: Exception) -> HTTPException:
    logger.warning("Chat archive operation failed (%s)", type(error).__name__)
    return HTTPException(status_code=503, detail="Chat archive unavailable")
