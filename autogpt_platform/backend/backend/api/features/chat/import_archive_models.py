import hashlib
import json
from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import (
    AfterValidator,
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)

from backend.api.middleware.body_limit import MiB

ChatImportSource = Literal["workbuddy", "qianwen"]
MAX_ATTACHMENT_BYTES = 5 * MiB
MAX_ATTACHMENTS_BYTES = 10 * MiB
MAX_ATTACHMENTS = 10
CONVERSATION_BODY_LIMIT = 4 * MiB
MULTIPART_BODY_LIMIT = 16 * MiB


def require_database_text(value: str) -> str:
    if "\x00" in value:
        raise ValueError("Text cannot contain null characters.")
    try:
        value.encode("utf-8")
    except UnicodeEncodeError:
        raise ValueError("Text must be valid Unicode.") from None
    return value


def require_utc_convertible(value: datetime) -> datetime:
    try:
        value.astimezone(UTC)
    except (OverflowError, ValueError):
        raise ValueError("Timestamp falls outside the supported UTC range.") from None
    return value


Title = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
    AfterValidator(require_database_text),
]
SourceID = Annotated[
    str, StringConstraints(min_length=64, max_length=64, pattern=r"^[0-9a-f]{64}$")
]
MessageText = Annotated[
    str,
    StringConstraints(min_length=1, max_length=100_000, pattern=r"\S"),
    AfterValidator(require_database_text),
]
MessageTimestamp = Annotated[AwareDatetime, AfterValidator(require_utc_convertible)]


class ImportedMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    text: MessageText
    timestamp: MessageTimestamp | None = None


class ConversationToImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: ChatImportSource
    source_id: SourceID | None = None
    title: Title
    messages: list[ImportedMessage] = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def validate_source(self) -> "ConversationToImport":
        if (self.source == "workbuddy") != (self.source_id is not None):
            raise ValueError(
                "WorkBuddy requires a source ID; Qianwen does not use one."
            )
        return self

    def fingerprint(self) -> str:
        if self.source_id is not None:
            return self.source_id
        serialized = json.dumps(
            [
                (message.role, message.text.strip().replace("\r\n", "\n"))
                for message in self.messages
            ],
            ensure_ascii=True,
            separators=(",", ":"),
        )
        return hashlib.sha256(serialized.encode()).hexdigest()


class ImportConversationsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    conversations: list[ConversationToImport] = Field(min_length=1, max_length=25)


class ImportConversationsResult(BaseModel):
    added: int
    duplicates: int


class ImportedChatSummary(BaseModel):
    id: str
    source: ChatImportSource
    title: str
    created_at: datetime | None
    imported_at: datetime
    message_count: int


class ImportedChatList(BaseModel):
    items: list[ImportedChatSummary]
    has_more: bool


class ImportedAttachment(BaseModel):
    id: str
    name: str
    size: int


class ImportedChatDetail(ImportedChatSummary):
    messages: list[ImportedMessage]
    attachments: list[ImportedAttachment] = Field(default_factory=list)


class AttachmentUpload(BaseModel):
    name: str
    content: bytes = Field(repr=False)
