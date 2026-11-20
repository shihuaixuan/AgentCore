import logging
from hashlib import sha256
from typing import Annotated, Any, Literal

from pydantic import Field, ValidationError

from backend.copilot.context import (
    get_current_permissions,
    get_workspace_manager,
    is_unattended_turn,
)
from backend.copilot.credential_selection import selected_credentials
from backend.copilot.model import ChatSession
from backend.copilot.permissions import GENERATE_OPENAI_IMAGE_TOOL
from backend.data.model import (
    APIKeyCredentials,
    Credentials,
    CredentialsFieldInfo,
    is_sdk_default,
)
from backend.integrations.credentials_store import is_system_credential
from backend.integrations.openai_image import (
    MAX_REFERENCE_BYTES,
    RASTER_FORMATS,
    ImageUpload,
    OpenAIImageError,
    OpenAIImageRequest,
    is_raster_image,
    request_openai_image,
)
from backend.integrations.providers import ProviderName
from backend.util.file import check_total_file_size, parse_workspace_uri
from backend.util.type import MediaFileType
from backend.util.workspace import WorkspaceManager

from .base import BaseTool
from .capability_gates import gate_denied
from .expert_scope import (
    CredentialScopeSnapshot,
    annotate_expert_grants,
    resolve_credential_scope,
)
from .models import (
    ErrorResponse,
    SetupInfo,
    SetupRequirementsResponse,
    ToolResponseBase,
    UserReadiness,
)
from .utils import build_missing_credentials_from_field_info, find_matching_credential
from .workspace_files import AGENT_CREATED_METADATA, WorkspaceWriteResponse

logger = logging.getLogger(__name__)

_EXPERT_ONLY = "OpenAI image generation is only available in an expert chat."
_OPENAI_KEY = CredentialsFieldInfo[Literal[ProviderName.OPENAI], Literal["api_key"]](
    credentials_provider=frozenset([ProviderName.OPENAI]),
    credentials_types=frozenset(["api_key"]),
    credentials_scopes=None,
)


class _GenerateOpenAIImageInput(OpenAIImageRequest):
    reference_images: list[
        Annotated[
            MediaFileType,
            Field(
                max_length=2048,
                pattern=r"^(?:@@agptfile:)?workspace://[^#\[\]\r\n]+(?:#[^\[\]\r\n]+)?$",
            ),
        ]
    ] = Field(
        default_factory=list,
        max_length=16,
        description="Workspace file references for PNG, JPEG, or WebP images to edit.",
    )


class GenerateOpenAIImageTool(BaseTool):
    writes_files = True

    @property
    def name(self) -> str:
        return GENERATE_OPENAI_IMAGE_TOOL

    @property
    def description(self) -> str:
        return (
            "Generate or edit images with OpenAI GPT-Image-2.6 in an expert chat. "
            "Requires an OpenAI API key granted to the expert. Show the returned Markdown image."
        )

    @property
    def parameters(self) -> dict[str, Any]:
        schema = _GenerateOpenAIImageInput.model_json_schema()
        schema.pop("title", None)
        for parameter in schema["properties"].values():
            parameter.pop("title", None)
        return schema

    @property
    def search_keywords(self) -> tuple[str, ...]:
        return (
            "image generation",
            "text to image",
            "image editing",
            "gpt-image-2.6-sunburst",
            "gpt-image-2.6-flare",
        )

    @property
    def requires_auth(self) -> bool:
        return True

    async def _execute(
        self, user_id: str | None, session: ChatSession, **kwargs: Any
    ) -> ToolResponseBase:
        session_id = session.session_id
        expert_id = session.expert_id
        if not user_id or user_id != session.user_id or not expert_id:
            return ErrorResponse(session_id=session_id, message=_EXPERT_ONLY)
        if error := _image_turn_error(session):
            return ErrorResponse(session_id=session_id, message=error)
        try:
            request = _GenerateOpenAIImageInput.model_validate(kwargs)
        except ValidationError as error:
            problem = error.errors(include_input=False)[0]
            field = ".".join(str(part) for part in problem["loc"])
            prefix = f"{field}: " if field else ""
            return ErrorResponse(
                session_id=session_id,
                message=f"Invalid image settings. {prefix}{problem['msg']}",
            )

        scope = await resolve_credential_scope(user_id, expert_id)
        personal = CredentialScopeSnapshot(
            [
                credential
                for credential in scope.owned
                if _is_personal_openai_key(credential)
            ],
            scope.allowed_ids,
        )
        key = find_matching_credential(
            personal.available,
            _OPENAI_KEY,
            await selected_credentials(session_id),
            ask_when_ambiguous=True,
        )
        if key is None or key.type != "api_key":
            return await _setup_response(user_id, expert_id, session_id, personal)
        return await _generate_image(user_id, session_id, request, key)


def openai_image_is_visible(session: ChatSession) -> bool:
    return (
        bool(session.expert_id)
        and not gate_denied(GENERATE_OPENAI_IMAGE_TOOL)
        and _image_turn_error(session) is None
    )


def _image_turn_error(session: ChatSession) -> str | None:
    if session.external_caller or session.metadata.builder_graph_id:
        return _EXPERT_ONLY
    if (
        session.dry_run
        or session.metadata.origin != "interactive"
        or is_unattended_turn()
    ):
        return "OpenAI image generation requires a live expert chat. No image was generated."
    permissions = get_current_permissions()
    if permissions is not None and not permissions.is_provider_allowed("openai"):
        return "This session's permissions do not allow using the OpenAI connection."
    return None


def _is_personal_openai_key(credential: Credentials) -> bool:
    return (
        credential.type == "api_key"
        and credential.provider == ProviderName.OPENAI
        and not is_system_credential(credential.id)
        and not is_sdk_default(credential.id)
        and bool(credential.api_key.get_secret_value().strip())
    )


async def _setup_response(
    user_id: str, expert_id: str, session_id: str, scope: CredentialScopeSnapshot
) -> SetupRequirementsResponse:
    missing = await annotate_expert_grants(
        user_id,
        expert_id,
        build_missing_credentials_from_field_info(
            {"openai_credentials": _OPENAI_KEY}, set()
        ),
        scope,
    )
    missing["openai_credentials"]["provider_name"] = "OpenAI"
    return SetupRequirementsResponse(
        message="Connect or grant an OpenAI project API key with access to GPT Image models.",
        session_id=session_id,
        setup_info=SetupInfo(
            agent_id=f"tool:{GENERATE_OPENAI_IMAGE_TOOL}",
            agent_name="OpenAI Image Generation",
            requirements={
                "credentials": list(missing.values()),
                "inputs": [],
                "execution_modes": ["immediate"],
            },
            user_readiness=UserReadiness(missing_credentials=missing),
        ),
    )


async def _generate_image(
    user_id: str,
    session_id: str,
    request: _GenerateOpenAIImageInput,
    key: APIKeyCredentials,
) -> ToolResponseBase:
    manager = await get_workspace_manager(user_id, session_id)
    try:
        references = await _load_references(manager, request.reference_images)
        content = await request_openai_image(
            request,
            key.api_key.get_secret_value().strip(),
            references,
            sha256(f"autogpt:{user_id}".encode()).hexdigest(),
        )
    except (ValueError, OpenAIImageError) as error:
        return ErrorResponse(session_id=session_id, message=str(error))
    return await _save_generated_image(manager, session_id, request, content)


async def _save_generated_image(
    manager: WorkspaceManager,
    session_id: str,
    request: OpenAIImageRequest,
    content: bytes,
) -> ToolResponseBase:
    mime_type = f"image/{request.output_format}"
    try:
        file = await manager.write_file(
            content=content,
            filename=f"generated-image.{request.output_format}",
            mime_type=mime_type,
            metadata=AGENT_CREATED_METADATA,
            rename_on_conflict=True,
        )
    except Exception:
        logger.warning(
            "Could not save generated OpenAI image to workspace", exc_info=True
        )
        return ErrorResponse(
            session_id=session_id,
            message=(
                "OpenAI generated the image, but it could not be saved to the workspace. "
                "The request may have been billed; do not automatically retry."
            ),
        )

    url = f"workspace://{file.id}#{mime_type}"
    return WorkspaceWriteResponse(
        message=f"Generated with {request.model}. Show this image in chat: ![Generated image]({url})",
        session_id=session_id,
        file_id=file.id,
        name=file.name,
        path=file.path,
        mime_type=mime_type,
        size_bytes=file.size_bytes,
        download_url=url,
        source=request.model,
    )


async def _load_references(
    manager: WorkspaceManager, references: list[MediaFileType]
) -> list[ImageUpload]:
    images: list[ImageUpload] = []
    total_size = 0
    for number, reference in enumerate(references, 1):
        image = await _load_reference(manager, reference, number)
        total_size += len(image[1])
        check_total_file_size(total_size)
        images.append(image)
    return images


async def _load_reference(
    manager: WorkspaceManager, reference: MediaFileType, number: int
) -> ImageUpload:
    workspace = parse_workspace_uri(reference.removeprefix("@@agptfile:"))
    try:
        file = await (
            manager.get_file_info_by_path(workspace.file_ref)
            if workspace.is_path
            else manager.get_file_info(workspace.file_ref)
        )
        if file is None:
            raise FileNotFoundError
        mime_type = file.mime_type.split(";", 1)[0].strip().lower()
        image_format = RASTER_FORMATS.get(mime_type)
        if image_format is None:
            raise ValueError(f"Reference image {number} must be PNG, JPEG, or WebP.")
        if not 0 < file.size_bytes <= MAX_REFERENCE_BYTES:
            raise ValueError(
                f"Reference image {number} exceeds the image size limit or is empty."
            )
        content = await manager.read_file_by_id(file.id)
    except OSError:
        raise ValueError(
            f"Reference image {number} is not available in this expert's workspace."
        ) from None
    if not 0 < len(content) <= MAX_REFERENCE_BYTES or not is_raster_image(
        content, image_format
    ):
        raise ValueError(
            f"Reference image {number} is invalid or exceeds the image size limit."
        )
    return (f"reference-{number}.{image_format}", content, mime_type)
