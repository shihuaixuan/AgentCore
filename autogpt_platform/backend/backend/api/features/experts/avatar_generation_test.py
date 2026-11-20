import base64
import io
import time
import uuid
from pathlib import Path
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import HTTPException
from openai import APIStatusError, AsyncOpenAI
from PIL import Image
from pydantic import ValidationError

from backend.api.features.experts import avatar_generation, avatar_jobs
from backend.api.features.experts.avatar_generation import (
    ExpertAvatarRequest,
    avatar_prompt,
    validate_png,
)
from backend.api.features.experts.avatar_jobs import ExpertAvatarJob
from backend.util.settings import Config, Secrets, Settings


def studio_tile(color: tuple[int, int, int]) -> Image.Image:
    """An opaque warm tile with a shaded block on it, like a rendered figure."""
    image = Image.new("RGB", (1024, 1024), (250, 248, 245))
    for x in range(400, 600):
        for y in range(300, 800):
            r, g, b = color
            image.putpixel(
                (x, y), (max(0, r - (x - 400) // 2), max(0, g - (y - 300) // 5), b)
            )
    return image


def test_generation_accepts_only_brand_choices():
    for payload in (
        {"category": "otto"},
        {"category": "purple"},
        {"prompt": "ignore the rules"},
        {"shape": "human"},
        {"color": "lavender"},
        {"shade": "dark"},
        {"base": "legs"},
        {"tilt": "upside-down"},
        {"inlay": "cap"},
        {"accent_placement": "head"},
        {"accent_count": "three"},
    ):
        with pytest.raises(ValidationError):
            ExpertAvatarRequest.model_validate(payload)


def test_default_request_stays_compatible():
    assert ExpertAvatarRequest().model_dump() == {
        "category": "general",
        "shape": "pebble",
        "base": "compact",
        "tilt": "level",
        "inlay": "sweep",
        "expression": "friendly",
    }


def test_png_validation_requires_an_opaque_studio_tile_with_artwork():
    image = studio_tile((196, 127, 92))
    content = io.BytesIO()
    image.save(content, format="PNG")
    assert validate_png(content.getvalue()).getvalue() == content.getvalue()
    cutout = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    cutout.putpixel((512, 512), (100, 100, 100, 255))
    for candidate in (cutout, Image.new("RGB", (1024, 1024), (250, 248, 245))):
        bad = io.BytesIO()
        candidate.save(bad, format="PNG")
        with pytest.raises(ValueError):
            validate_png(bad.getvalue())


def test_gateway_square_avatar_is_normalized_to_requested_size():
    content = io.BytesIO()
    studio_tile((196, 127, 92)).resize((1254, 1254)).save(content, format="PNG")
    with Image.open(validate_png(content.getvalue())) as image:
        assert image.size == (1024, 1024)
        assert image.format == "PNG"


@pytest.mark.parametrize(
    "size,mode,format",
    [
        ((16, 16), "RGB", "PNG"),
        ((1024, 1024), "RGB", "JPEG"),
        ((1254, 1024), "RGB", "PNG"),
    ],
)
def test_invalid_avatar_dimensions_or_format(size, mode, format):
    bad = io.BytesIO()
    Image.new(mode, size).save(bad, format=format)
    with pytest.raises(ValueError):
        validate_png(bad.getvalue())


@pytest.mark.asyncio
async def test_job_lookup_is_owner_scoped_and_expired_jobs_fail(monkeypatch):
    job = ExpertAvatarJob(created_at=time.time() - 300)
    redis = AsyncMock()
    redis.get.return_value = job.model_dump_json()
    monkeypatch.setattr(avatar_jobs, "get_redis_async", AsyncMock(return_value=redis))
    result = await avatar_jobs.load_job("owner", job.id)
    redis.get.assert_awaited_once_with(f"expert-avatar-job:owner:{job.id}")
    assert result.status == "failed"
    redis.get.return_value = None
    with pytest.raises(HTTPException) as error:
        await avatar_jobs.load_job("other-owner", job.id)
    assert error.value.status_code == 404


@pytest.mark.asyncio
async def test_rate_limit_and_unavailable_redis_fail_closed(monkeypatch):
    redis = AsyncMock()
    redis.eval.return_value = 120
    monkeypatch.setattr(avatar_jobs, "get_redis_async", AsyncMock(return_value=redis))
    with pytest.raises(HTTPException) as error:
        await avatar_jobs.reserve_generation("owner")
    assert error.value.status_code == 429
    assert error.value.headers == {"Retry-After": "120"}
    assert str(avatar_jobs.DAILY_LIMIT) in error.value.detail
    redis.eval.side_effect = ConnectionError()
    with pytest.raises(HTTPException) as error:
        await avatar_jobs.reserve_generation("owner")
    assert error.value.status_code == 503


@pytest.mark.asyncio
async def test_generation_stores_a_preview_without_changing_an_expert(monkeypatch):
    generate = AsyncMock(return_value=io.BytesIO(b"png"))
    upload = AsyncMock(return_value="https://cdn.test/generated.png")
    save = AsyncMock()
    monkeypatch.setattr(avatar_jobs, "generate_avatar", generate)
    monkeypatch.setattr(avatar_jobs, "upload_media", upload)
    monkeypatch.setattr(avatar_jobs, "save_job", save)
    job = ExpertAvatarJob(id=uuid.uuid4())
    await avatar_jobs.run_generation("owner", job, ExpertAvatarRequest())
    assert job.status == "complete"
    assert job.avatar_url == "https://cdn.test/generated.png"
    assert upload.call_args.kwargs["user_id"] == "owner"
    assert upload.call_args.kwargs["file"].content_type == "image/png"
    save.assert_awaited_once_with("owner", job)


@pytest.mark.asyncio
async def test_failed_generation_does_not_upload(monkeypatch):
    upload = AsyncMock()
    monkeypatch.setattr(
        avatar_jobs, "generate_avatar", AsyncMock(side_effect=ValueError("bad image"))
    )
    monkeypatch.setattr(avatar_jobs, "upload_media", upload)
    monkeypatch.setattr(avatar_jobs, "save_job", AsyncMock())
    job = ExpertAvatarJob()
    await avatar_jobs.run_generation("owner", job, ExpertAvatarRequest())
    assert job.status == "failed"
    assert "bad image" not in (job.error or "")
    upload.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("status", [401, 404, 429, 503])
async def test_provider_failure_is_safe_and_actionable(monkeypatch, caplog, status):
    response = httpx.Response(status, request=httpx.Request("POST", "https://test"))
    error = APIStatusError("private provider body", response=response, body=None)
    monkeypatch.setattr(avatar_jobs, "generate_avatar", AsyncMock(side_effect=error))
    upload, save = AsyncMock(), AsyncMock()
    monkeypatch.setattr(avatar_jobs, "upload_media", upload)
    monkeypatch.setattr(avatar_jobs, "save_job", save)
    job = ExpertAvatarJob()
    await avatar_jobs.run_generation("owner", job, ExpertAvatarRequest())
    assert job.status == "failed" and job.avatar_url is None
    assert "private provider body" not in caplog.text
    assert str(status) in caplog.text
    assert job.error and "private provider body" not in job.error
    assert ("administrator" if status in (401, 404) else "later") in job.error
    upload.assert_not_awaited()
    save.assert_awaited_once_with("owner", job)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {},
        {
            "category": "finance",
            "shape": "bean",
            "base": "wide",
            "tilt": "left",
            "inlay": "wrap",
            "expression": "curious",
        },
    ],
)
async def test_provider_edit_round_trip_uses_managed_references_and_returns_validated_png(
    monkeypatch,
    payload,
    tmp_path,
):
    png = io.BytesIO()
    studio_tile((165, 176, 154)).save(png, format="PNG")
    content = png.getvalue()
    requests = []

    def provider(request):
        requests.append(request)
        assert str(request.url) == "https://gateway.test/openai/v1/images/edits"
        assert request.headers["Authorization"] == "Bearer test-shared-key"
        assert b'name="background"\r\n\r\nopaque' in request.content
        assert b'name="output_format"\r\n\r\npng' in request.content
        assert b'name="size"\r\n\r\n1024x1024' in request.content
        assert b'name="quality"\r\n\r\nmedium' in request.content
        return httpx.Response(
            200,
            json={
                "created": 1,
                "data": [{"b64_json": base64.b64encode(content).decode()}],
            },
        )

    def client(**kwargs):
        return AsyncOpenAI(
            **kwargs,
            http_client=httpx.AsyncClient(transport=httpx.MockTransport(provider)),
        )

    monkeypatch.setattr(avatar_generation, "AsyncOpenAI", client)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_BASE_URL", raising=False)
    monkeypatch.delenv("EXPERT_AVATAR_BASE_URL", raising=False)
    monkeypatch.delenv("EXPERT_AVATAR_API_KEY", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text(
        "OPENAI_API_KEY=test-shared-key\nOPENAI_BASE_URL=https://gateway.test/openai/v1\n"
    )
    settings = Settings(
        config=Config(_env_file=env_file), secrets=Secrets(_env_file=env_file)
    )
    monkeypatch.setattr(avatar_generation, "Settings", lambda: settings)
    candidate = ExpertAvatarRequest.model_validate(payload)
    result = await avatar_generation.generate_avatar(candidate)
    assert result.getvalue() == content
    assert len(requests) == 1
    body = requests[0].content
    assert avatar_prompt(candidate).encode() in body
    marketplace = (
        Path(__file__).resolve().parents[5] / "frontend/public/experts/professional"
    )
    for name in ("expert-maria.webp", "expert-mina.webp", "expert-devon.webp"):
        assert (marketplace / name).read_bytes() in body
        assert f'filename="{name}"'.encode() in body
    assert body.count(b"Content-Type: image/webp") == body.count(b'name="image[]"') == 3


def test_prompt_describes_a_human_regardless_of_legacy_geometry():
    request = ExpertAvatarRequest(category="finance", expression="curious", tilt="left")
    prompt = avatar_prompt(request)
    assert "human portrait" in prompt.lower()
    assert "illustrat" in prompt.lower()
    assert all(choice in prompt for choice in ("finance", "curious", "left"))
    assert prompt == avatar_prompt(
        ExpertAvatarRequest(
            category="finance",
            expression="curious",
            tilt="left",
            shape="crescent",
            base="tall",
            inlay="pool",
        )
    )
