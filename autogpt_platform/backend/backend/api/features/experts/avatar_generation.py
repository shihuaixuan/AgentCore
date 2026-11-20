import asyncio
import base64
import io
from pathlib import Path
from typing import Literal

from openai import AsyncOpenAI
from PIL import Image
from pydantic import BaseModel, ConfigDict

from backend.util.settings import Settings

GenerationCategory = Literal[
    "marketing",
    "sales",
    "finance",
    "support",
    "operations",
    "research",
    "content",
    "development",
    "general",
]


class ExpertAvatarRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    category: GenerationCategory = "general"
    shape: Literal[
        "pebble",
        "slab",
        "wedge",
        "dome",
        "capsule",
        "bean",
        "saddle",
        "kite",
        "fan",
        "arch",
        "shield",
        "crescent",
    ] = "pebble"
    base: Literal["compact", "wide", "tall"] = "compact"
    tilt: Literal["level", "left", "right"] = "level"
    inlay: Literal["sweep", "field", "cloud", "bank", "pool", "inlet", "wrap"] = "sweep"
    expression: Literal["friendly", "curious", "focused", "pleased"] = "friendly"


REFERENCE_FOLDER = Path(__file__).parent / "avatar_references"
PORTRAIT_REFERENCES = ("expert-maria.webp", "expert-mina.webp", "expert-devon.webp")


def avatar_provider(settings: Settings) -> tuple[str, str, str]:
    url = settings.config.expert_avatar_base_url.strip()
    key = settings.secrets.expert_avatar_api_key.strip()
    if not (url or key):
        url = settings.config.openai_base_url.strip()
        key = settings.secrets.openai_api_key.strip()
    return url, key, settings.config.expert_avatar_model.strip()


async def generate_avatar(request: ExpertAvatarRequest) -> io.BytesIO:
    url, key, model = avatar_provider(Settings())
    async with AsyncOpenAI(
        api_key=key,
        base_url=url,
        timeout=180,
        max_retries=0,
    ) as client:
        result = await client.images.edit(
            model=model,
            image=[
                (name, (REFERENCE_FOLDER / name).read_bytes(), "image/webp")
                for name in PORTRAIT_REFERENCES
            ],
            prompt=avatar_prompt(request),
            size="1024x1024",
            quality="medium",
            background="opaque",
            output_format="png",
            n=1,
        )
    if not result.data or not result.data[0].b64_json:
        raise ValueError("Image provider returned no image")
    content = base64.b64decode(result.data[0].b64_json, validate=True)
    return await asyncio.to_thread(validate_png, content)


def avatar_prompt(request: ExpertAvatarRequest) -> str:
    pose = (
        "head upright"
        if request.tilt == "level"
        else f"head tilted slightly {request.tilt}"
    )
    return (
        "Illustrate one original human portrait for the professional Expert marketplace. "
        "Use the attached portraits for style and framing only; invent a distinct adult "
        "with their own face, hairstyle and outfit rather than copying a reference person. "
        "Match the fine linework, softly painted skin and hair, natural proportions and "
        "simple pastel background. Frame the head and shoulders closely in a square, "
        "with a clear face that reads at thumbnail size. "
        f"Work category: {request.category}. Choose contemporary clothing and at most "
        "one understated work-related prop below the face. "
        f"Give the person a {request.expression} expression, {pose}. "
        "No lettering, logos, photography or 3D mascots."
    )


def validate_png(content: bytes) -> io.BytesIO:
    if len(content) > 5 * 1024 * 1024:
        raise ValueError("Generated image is too large")
    with Image.open(io.BytesIO(content)) as image:
        if (
            image.format != "PNG"
            or image.width != image.height
            or not 1024 <= image.width <= 2048
        ):
            raise ValueError("Expected a square PNG between 1024 and 2048 pixels")
        image.load()
        if image.mode not in ("RGB", "RGBA"):
            raise ValueError("Expected an opaque color PNG")
        if image.mode == "RGBA" and image.getchannel("A").getextrema() != (255, 255):
            raise ValueError("Expected an opaque studio tile, not a cut-out")
        # getcolors() gives up (None) past its limit; a short list means a
        # flat or near-flat tile with no rendered figure on it.
        if image.convert("RGB").getcolors(256) is not None:
            raise ValueError("Expected visible artwork")
        if image.width != 1024:
            output = io.BytesIO()
            image.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(
                output, format="PNG"
            )
            output.seek(0)
            return output
    return io.BytesIO(content)
