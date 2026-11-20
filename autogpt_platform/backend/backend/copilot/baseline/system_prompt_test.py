"""The system message the baseline engine sends carries the shared workflow notes."""

import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.copilot.baseline import service
from backend.copilot.baseline.service_cancellation_test import baseline_io
from backend.copilot.model import ChatMessage, ChatSession
from backend.copilot.permissions import CopilotPermissions

__all__ = ["baseline_io"]


@pytest.mark.asyncio
async def test_system_message_tells_the_model_formulas_render(
    monkeypatch: pytest.MonkeyPatch, baseline_io: list[ChatSession]
) -> None:
    session = ChatSession.new("user-1", dry_run=False)
    session.title = "Math"
    session.messages.append(ChatMessage(role="user", content="Derive it"))
    stream = MagicMock()
    stream.__aiter__.return_value = []
    stream.close = AsyncMock()
    provider = AsyncMock(return_value=stream)
    monkeypatch.setattr(service, "call_provider_stream", provider)

    async with asyncio.timeout(5):
        async for _ in service.stream_chat_completion_baseline(
            session.session_id, user_id="user-1", session=session, is_user_message=False
        ):
            pass

    assert provider.await_args is not None
    [system] = [
        m for m in provider.await_args.kwargs["messages"] if m["role"] == "system"
    ]
    assert "`$…$` inline, `$$…$$` for display" in str(system["content"])


@pytest.mark.parametrize("openai_allowed", [True, False])
@pytest.mark.parametrize("expert_id", ["expert-1", pytest.param(None, id="office")])
async def test_baseline_routes_plain_image_requests_in_both_chat_roles(
    monkeypatch: pytest.MonkeyPatch,
    baseline_io: list[ChatSession],
    openai_allowed: bool,
    expert_id: str | None,
) -> None:
    request = "生成一个橘猫的图片"
    session = ChatSession.new("user-1", dry_run=False, expert_id=expert_id)
    session.title = "Image request"
    session.messages.append(ChatMessage(role="user", content=request))
    monkeypatch.setattr(
        service, "build_expert_identity_suffix", AsyncMock(return_value="")
    )
    stream = MagicMock()
    stream.__aiter__.return_value = []
    stream.close = AsyncMock()
    provider = AsyncMock(return_value=stream)
    monkeypatch.setattr(service, "call_provider_stream", provider)

    async with asyncio.timeout(10):
        async for _ in service.stream_chat_completion_baseline(
            session.session_id,
            user_id="user-1",
            session=session,
            is_user_message=False,
            permissions=(
                None if openai_allowed else CopilotPermissions(providers=["openai"])
            ),
        ):
            pass

    assert provider.await_args is not None
    messages = provider.await_args.kwargs["messages"]
    assert any(
        request in str(msg["content"]) for msg in messages if msg["role"] == "user"
    )
    prompt = str(messages[0]["content"])
    assert (
        'run_capability(id="tool:generate_openai_image"' in prompt
    ) is openai_allowed
    assert "do not switch providers" in prompt
