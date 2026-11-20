import base64
import io
from typing import Annotated, Literal, Self, TypedDict

from openai import APIError, APIStatusError, APITimeoutError, AsyncOpenAI, Omit, omit
from openai.types import ImagesResponse
from PIL import Image
from pydantic import (
    BaseModel,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

from backend.util.file import MAX_FILE_SIZE_BYTES

RASTER_FORMATS = {"image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp"}
MAX_REFERENCE_BYTES = min(MAX_FILE_SIZE_BYTES, 50_000_000 - 1)
_API_STATUS_MESSAGES = {
    400: "OpenAI rejected the image request. Check the inputs and content policy.",
    401: "The OpenAI-compatible gateway rejected the configured key. Contact your administrator.",
    403: "The OpenAI-compatible gateway denied access to the configured image model.",
    404: "The OpenAI-compatible image endpoint or configured model was not found.",
    422: "OpenAI rejected the image inputs. Check the request parameters.",
    429: "The configured OpenAI-compatible gateway reached its rate limit or quota.",
}
RasterFormat = Literal["png", "jpeg", "webp"]
ImageBackground = Literal["auto", "opaque", "transparent"]
ImageUpload = tuple[str, bytes, str]


class OpenAIImageRequest(BaseModel):
    prompt: Annotated[str, StringConstraints(strip_whitespace=True)] = Field(
        min_length=1, max_length=32_000, description="Describe the image or edit."
    )
    model: str | None = Field(
        default=None,
        min_length=1,
        max_length=240,
        description="Omit for the configured image model; set only if the user specifies a model.",
    )
    size: str = Field(
        default="1024x1024",
        pattern=r"^(auto|[1-9][0-9]{0,3}x[1-9][0-9]{0,3})$",
        description="Image dimensions (multiples of 16, e.g. 1536x864), or auto.",
    )
    quality: Literal["auto", "low", "medium", "high", "xhigh", "max"] = Field(
        default="auto", description="Rendering quality; use low for quick drafts."
    )
    complexity: Literal["low", "medium", "high"] = Field(
        default="high", description="How much the image model plans before rendering."
    )
    output_format: RasterFormat = Field(default="png", description="Image file format.")
    background: ImageBackground = Field(
        default="auto", description="Transparent backgrounds require PNG or WebP."
    )

    @field_validator("size")
    @classmethod
    def _validate_dimensions(cls, value: str) -> str:
        if value == "auto":
            return value
        width, height = map(int, value.split("x"))
        if (
            width % 16
            or height % 16
            or max(width, height) > 3840
            or max(width, height) > 3 * min(width, height)
            or not 655_360 <= width * height <= 8_294_400
        ):
            raise ValueError(
                "Use dimensions divisible by 16, up to 3840 per side, with an "
                "aspect ratio between 1:3 and 3:1 and 655,360 to 8,294,400 pixels."
            )
        return value

    @model_validator(mode="after")
    def _validate_background(self) -> Self:
        if self.background == "transparent" and self.output_format == "jpeg":
            raise ValueError("Transparent backgrounds require PNG or WebP output.")
        return self


class OpenAIImageError(Exception):
    """An image request failure that is safe to display in chat."""


async def request_openai_image(
    request: OpenAIImageRequest,
    client: AsyncOpenAI,
    model: str,
    images: list[ImageUpload],
    safety_identifier: str,
) -> bytes:
    options: _ImageOptions = {
        "model": model,
        "prompt": request.prompt,
        "n": 1,
        "output_format": request.output_format,
        "background": request.background,
        "extra_headers": {"OpenAI-Organization": omit, "OpenAI-Project": omit},
        "extra_body": {
            "size": request.size,
            "quality": request.quality,
        },
    }
    if model.rsplit("/", 1)[-1].lower().startswith("gpt-image-2.6"):
        options["extra_body"]["complexity"] = request.complexity
        options["extra_body"]["safety_identifier"] = safety_identifier
    try:
        images_api = client.with_options(timeout=240.0, max_retries=0).images
        response = (
            await images_api.edit(image=images, **options)
            if images
            else await images_api.generate(**options)
        )
    except APITimeoutError:
        raise OpenAIImageError(
            "OpenAI did not return an image in time. The request may have been billed; "
            "do not automatically retry."
        ) from None
    except APIStatusError as error:
        raise OpenAIImageError(
            _API_STATUS_MESSAGES.get(
                error.status_code,
                f"OpenAI image request failed (HTTP {error.status_code}).",
            )
        ) from None
    except APIError:
        raise OpenAIImageError(
            "The OpenAI image request could not be completed."
        ) from None
    return _decode_image(response, request.output_format)


class _ImageOptions(TypedDict):
    model: str
    prompt: str
    n: int
    output_format: RasterFormat
    background: ImageBackground
    extra_headers: dict[str, str | Omit]
    extra_body: dict[str, str]


def is_raster_image(content: bytes, image_format: str) -> bool:
    try:
        with Image.open(io.BytesIO(content), formats=[image_format.upper()]) as image:
            image.verify()
    except (ValueError, OSError, SyntaxError, Image.DecompressionBombError):
        return False
    return True


def _decode_image(response: ImagesResponse, output_format: RasterFormat) -> bytes:
    encoded = response.data[0].b64_json if response.data else None
    if not encoded:
        raise OpenAIImageError("OpenAI returned no image data.")
    if len(encoded) > 4 * ((MAX_FILE_SIZE_BYTES + 2) // 3):
        raise OpenAIImageError(
            "The generated image exceeds the workspace file size limit."
        )
    try:
        content = base64.b64decode(encoded, validate=True)
    except ValueError:
        raise OpenAIImageError("OpenAI returned invalid image data.") from None
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise OpenAIImageError(
            "The generated image exceeds the workspace file size limit."
        )
    if not is_raster_image(content, output_format):
        raise OpenAIImageError("OpenAI returned invalid image data.")
    return content
