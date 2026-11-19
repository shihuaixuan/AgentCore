from unicodedata import category

from fastapi import HTTPException, Request
from pydantic import ValidationError
from python_multipart.exceptions import MultipartParseError
from python_multipart.multipart import parse_options_header
from starlette.datastructures import FormData, UploadFile
from starlette.formparsers import MultiPartException, MultiPartParser
from starlette.requests import ClientDisconnect

from backend.util.filename import sanitize_filename

from .import_archive_models import (
    CONVERSATION_BODY_LIMIT,
    MAX_ATTACHMENT_BYTES,
    MAX_ATTACHMENTS,
    MAX_ATTACHMENTS_BYTES,
    MULTIPART_BODY_LIMIT,
    AttachmentUpload,
    ConversationToImport,
)

MULTIPART_OPENAPI_BODY = {
    "requestBody": {
        "required": True,
        "content": {
            "multipart/form-data": {
                "schema": {
                    "type": "object",
                    "required": ["conversation", "files"],
                    "properties": {
                        "conversation": {
                            "type": "string",
                            "description": "One WorkBuddy ConversationToImport as JSON.",
                        },
                        "files": {
                            "type": "array",
                            "minItems": 1,
                            "maxItems": MAX_ATTACHMENTS,
                            "items": {"type": "string", "format": "binary"},
                        },
                    },
                },
            }
        },
    }
}


async def read_attachment_import(
    request: Request,
) -> tuple[ConversationToImport, list[AttachmentUpload]]:
    media_type, _ = parse_options_header(request.headers.get("content-type"))
    if media_type.lower() != b"multipart/form-data":
        raise HTTPException(status_code=415, detail="Expected multipart/form-data")

    parser = _InMemoryMultipartParser(
        request.headers,
        request.stream(),
        max_fields=1,
        max_files=MAX_ATTACHMENTS,
        max_part_size=CONVERSATION_BODY_LIMIT,
    )
    try:
        form = await parser.parse()
    except _TextPartTooLarge:
        raise HTTPException(
            status_code=413, detail="Conversation exceeds 4 MiB"
        ) from None
    except (MultiPartException, MultipartParseError, ClientDisconnect, LookupError):
        raise HTTPException(
            status_code=400, detail="Invalid archive multipart body"
        ) from None
    try:
        if not parser.complete:
            raise HTTPException(
                status_code=400, detail="Incomplete archive multipart body"
            )
        return _read_conversation(form), await _read_files(form)
    finally:
        await form.close()


class _InMemoryMultipartParser(MultiPartParser):
    """Keep spools in RAM under the route's body ceiling and require a final boundary."""

    spool_max_size = MULTIPART_BODY_LIMIT
    complete = False

    def on_part_data(self, data: bytes, start: int, end: int) -> None:
        try:
            super().on_part_data(data, start, end)
        except MultiPartException:
            raise _TextPartTooLarge("Multipart text part exceeds the limit") from None

    def on_end(self) -> None:
        self.complete = True


class _TextPartTooLarge(MultiPartException):
    pass


def _read_conversation(form: FormData) -> ConversationToImport:
    parts = form.getlist("conversation")
    if len(parts) != 1 or not isinstance(parts[0], str):
        raise HTTPException(
            status_code=422, detail="Expected one WorkBuddy conversation"
        )
    try:
        conversation = ConversationToImport.model_validate_json(parts[0])
    except ValidationError:
        raise HTTPException(
            status_code=422, detail="Invalid archive conversation"
        ) from None
    if conversation.source != "workbuddy":
        raise HTTPException(
            status_code=422, detail="Expected one WorkBuddy conversation"
        )
    return conversation


async def _read_files(form: FormData) -> list[AttachmentUpload]:
    files: list[UploadFile] = []
    for field, value in form.multi_items():
        if field == "conversation":
            continue
        if field != "files" or not isinstance(value, UploadFile) or value.size is None:
            raise HTTPException(status_code=422, detail="Expected uploaded files")
        if value.size > MAX_ATTACHMENT_BYTES:
            raise HTTPException(status_code=413, detail="An attachment exceeds 5 MiB")
        if not value.size:
            raise HTTPException(status_code=422, detail="Attachments cannot be empty")
        files.append(value)
    if not files:
        raise HTTPException(
            status_code=422, detail="At least one attachment is required"
        )
    if sum(part.size or 0 for part in files) > MAX_ATTACHMENTS_BYTES:
        raise HTTPException(
            status_code=413, detail="Attachments exceed 10 MiB combined"
        )
    return [
        AttachmentUpload(name=_display_name(part.filename), content=await part.read())
        for part in files
    ]


def _display_name(filename: str | None) -> str:
    basename = (filename or "").replace("\\", "/").rsplit("/", 1)[-1]
    if (
        len(basename) >= 2
        and basename[1] == ":"
        and basename[0].isascii()
        and basename[0].isalpha()
    ):
        basename = basename[2:]
    name = "".join(char for char in basename if not category(char).startswith("C"))
    return sanitize_filename(name.lstrip(". ").rstrip(". ") or "attachment").rstrip(
        ". "
    )
