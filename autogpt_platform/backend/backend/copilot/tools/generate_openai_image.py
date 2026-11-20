import logging
from hashlib import sha256
from typing import Annotated, Any

from pydantic import Field, ValidationError

from backend.copilot.context import get_workspace_manager
from backend.copilot.managed_model_client import managed_model_client
from backend.copilot.managed_models import (
    ModelRuntime,
    ModelUnavailable,
    resolve_image_model,
)
from backend.copilot.model import ChatSession
from backend.copilot.permissions import GENERATE_OPENAI_IMAGE_TOOL
from backend.integrations.openai_image import (
    MAX_REFERENCE_BYTES,
    RASTER_FORMATS,
    ImageUpload,
    OpenAIImageError,
    OpenAIImageRequest,
    is_raster_image,
    request_openai_image,
)
from backend.util.file import check_total_file_size, parse_workspace_uri
from backend.util.type import MediaFileType
from backend.util.workspace import WorkspaceManager

from .base import BaseTool
from .expert_image_policy import image_turn_error
from .models import ErrorResponse, ToolResponseBase
from .workspace_files import AGENT_CREATED_METADATA, WorkspaceWriteResponse

logger = logging.getLogger(__name__)


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
            "Generate or edit images using the administrator's OpenAI-compatible image model. "
            "Show the returned Markdown image."
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
        if not user_id or user_id != session.user_id:
            return ErrorResponse(
                session_id=session_id, message="Chat owner authentication required."
            )
        if error := image_turn_error(session):
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

        try:
            route = await resolve_image_model(request.model)
        except ModelUnavailable as error:
            return ErrorResponse(session_id=session_id, message=str(error))
        except Exception:
            logger.warning("Could not load the managed image model configuration")
            return ErrorResponse(
                session_id=session_id,
                message="Image model settings are unavailable. Contact your administrator.",
            )
        return await _generate_image(user_id, session_id, request, route)


async def _generate_image(
    user_id: str,
    session_id: str,
    request: _GenerateOpenAIImageInput,
    route: ModelRuntime,
) -> ToolResponseBase:
    manager = await get_workspace_manager(user_id, session_id)
    try:
        references = await _load_references(manager, request.reference_images)
        async with managed_model_client(route) as client:
            content = await request_openai_image(
                request,
                client,
                route.model,
                references,
                sha256(f"autogpt:{user_id}".encode()).hexdigest(),
            )
    except (ValueError, OpenAIImageError, ModelUnavailable) as error:
        return ErrorResponse(session_id=session_id, message=str(error))
    return await _save_generated_image(
        manager, session_id, request, content, route.model
    )


async def _save_generated_image(
    manager: WorkspaceManager,
    session_id: str,
    request: OpenAIImageRequest,
    content: bytes,
    model: str,
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
        message=f"Generated with {model}. Show this image in chat: ![Generated image]({url})",
        session_id=session_id,
        file_id=file.id,
        name=file.name,
        path=file.path,
        mime_type=mime_type,
        size_bytes=file.size_bytes,
        download_url=url,
        source=model,
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
            f"Reference image {number} is not available in this chat's workspace."
        ) from None
    if not 0 < len(content) <= MAX_REFERENCE_BYTES or not is_raster_image(
        content, image_format
    ):
        raise ValueError(
            f"Reference image {number} is invalid or exceeds the image size limit."
        )
    return (f"reference-{number}.{image_format}", content, mime_type)
