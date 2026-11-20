import base64
import io
import json
from datetime import UTC, datetime
from typing import get_args
from unittest.mock import Mock
from urllib.parse import urlsplit

import httpx
import pytest
from PIL import Image
from pydantic import SecretStr

from backend.copilot import managed_model_client
from backend.copilot.context import set_execution_context
from backend.copilot.managed_models import ModelRuntime, ModelUnavailable
from backend.copilot.model import ChatSession, ChatSessionMetadata
from backend.copilot.permissions import (
    ALL_TOOL_NAMES,
    GENERATE_OPENAI_IMAGE_TOOL,
    CopilotPermissions,
    ToolName,
)
from backend.copilot.tools import (
    execute_tool,
    expert_tool_disabled_groups,
    get_tool,
    reachable_tool_names,
)
from backend.data.workspace import WorkspaceFile
from backend.data.workspace_scope import WorkspaceAccessDeniedError
from backend.util.workspace import WorkspaceManager

from . import generate_openai_image as image_tool

_TOOL_NAME = GENERATE_OPENAI_IMAGE_TOOL
_GATEWAY = "https://gateway.example.test/custom/v1"


def _session(**overrides) -> ChatSession:
    now = datetime.now(UTC)
    return ChatSession.model_validate(
        {
            "session_id": "session-1",
            "user_id": "user-1",
            "expert_id": "expert-1",
            "metadata": ChatSessionMetadata(origin="interactive"),
            "messages": [],
            "usage": [],
            "started_at": now,
            "updated_at": now,
            **overrides,
        }
    )


def test_openai_image_generation_is_reachable_in_both_chat_roles():
    assert get_tool(_TOOL_NAME) is not None
    for expert_id in ("expert-1", None):
        groups = expert_tool_disabled_groups(experts_enabled=True, expert_id=expert_id)
        assert _TOOL_NAME in reachable_tool_names(disabled_groups=groups)


def test_openai_image_generation_is_not_a_workflow_tool_option():
    assert _TOOL_NAME in ALL_TOOL_NAMES
    assert _TOOL_NAME not in get_args(ToolName)


@pytest.mark.parametrize(
    "overrides",
    [
        {"user_id": "another-user"},
        pytest.param(
            {"expert_id": None, "metadata": ChatSessionMetadata(origin="automation")},
            id="office-workflow",
        ),
        pytest.param(
            {
                "expert_id": None,
                "metadata": ChatSessionMetadata(
                    origin="interactive", delegated_by_session_id="parent"
                ),
            },
            id="office-delegation",
        ),
        {"external_caller": True},
        {"metadata": ChatSessionMetadata(origin="interactive", dry_run=True)},
        {"metadata": ChatSessionMetadata(origin="automation")},
        {
            "metadata": ChatSessionMetadata(
                origin="interactive", builder_graph_id="workflow-1"
            )
        },
        {"metadata": ChatSessionMetadata()},
    ],
)
async def test_openai_image_generation_is_refused_without_running_it(mocker, overrides):
    tool = get_tool(_TOOL_NAME)
    assert tool is not None
    resolve = mocker.patch.object(image_tool, "resolve_image_model")

    result = await tool._execute("user-1", _session(**overrides), prompt="An otter")

    assert result.type == "error"
    resolve.assert_not_awaited()


async def test_openai_provider_denial_prevents_a_managed_model_lookup(mocker):
    session = _session()
    set_execution_context(
        "user-1", session, permissions=CopilotPermissions(providers=["openai"])
    )
    resolve = mocker.patch.object(image_tool, "resolve_image_model")

    result = await image_tool.GenerateOpenAIImageTool()._execute(
        "user-1", session, prompt="An otter"
    )

    assert result.type == "error"
    assert "permission" in result.message
    resolve.assert_not_awaited()


@pytest.mark.parametrize("expert_id", ["expert-1", pytest.param(None, id="office")])
async def test_missing_managed_image_model_never_offers_a_connector(mocker, expert_id):
    mocker.patch.object(
        image_tool,
        "resolve_image_model",
        side_effect=ModelUnavailable("Ask your administrator to enable an image model."),
    )
    generate = mocker.patch.object(image_tool, "request_openai_image")
    mocker.patch("backend.copilot.tools.track_tool_called")
    mocker.patch("backend.copilot.gate.gate_active", return_value=False)
    session = _session(expert_id=expert_id)
    set_execution_context("user-1", session)

    event = await execute_tool(
        "run_capability",
        {"id": f"tool:{_TOOL_NAME}", "input": {"prompt": "一只坐在窗边的橘猫"}},
        "user-1",
        session,
        "image-call",
        disabled_groups=expert_tool_disabled_groups(
            experts_enabled=True, expert_id=expert_id
        ),
        disabled_tools=(),
    )

    assert event.toolName == _TOOL_NAME
    assert isinstance(event.output, str)
    result = image_tool.ErrorResponse.model_validate_json(event.output)
    assert result.type == "error" and "administrator" in result.message
    assert "setup_info" not in json.loads(event.output)
    generate.assert_not_awaited()


def _image_bytes(image_format: str) -> bytes:
    with io.BytesIO() as buffer, Image.new("RGB", (1, 1), "blue") as image:
        image.save(buffer, image_format)
        return buffer.getvalue()


def _workspace_file(file_id: str, mime_type: str, size_bytes: int) -> WorkspaceFile:
    now = datetime.now(UTC)
    return WorkspaceFile(
        id=file_id,
        workspace_id="workspace-1",
        created_at=now,
        updated_at=now,
        name="image.png",
        path="/sessions/session-1/image.png",
        storage_path="test/image.png",
        mime_type=mime_type,
        size_bytes=size_bytes,
    )


@pytest.fixture
def workspace(mocker):
    mocker.patch.object(
        image_tool,
        "resolve_image_model",
        side_effect=lambda preferred: ModelRuntime(
            model=f"gateway/{preferred or 'gpt-image-2.6-flare'}",
            base_url=_GATEWAY,
            key=SecretStr("mock-gateway-key"),
        ),
    )
    manager = Mock(spec=WorkspaceManager)
    mocker.patch.object(image_tool, "get_workspace_manager", return_value=manager)
    return manager


@pytest.fixture
def mock_openai(mocker, monkeypatch):
    monkeypatch.setenv("OPENAI_ORG_ID", "deployment-org")
    monkeypatch.setenv("OPENAI_PROJECT_ID", "deployment-project")
    mocker.patch.object(
        managed_model_client,
        "validate_url_host",
        return_value=(urlsplit(_GATEWAY), None, ["93.184.216.34"]),
    )

    def install(response: httpx.Response):
        handler = Mock(return_value=response)

        mocker.patch.object(
            managed_model_client,
            "_PinnedTransport",
            return_value=httpx.MockTransport(handler),
        )
        return handler

    return install


def _provider_image(content: bytes) -> httpx.Response:
    return httpx.Response(
        200,
        json={"created": 1, "data": [{"b64_json": base64.b64encode(content).decode()}]},
    )


@pytest.mark.parametrize("model", [None, "gpt-image-2.6-sunburst"])
@pytest.mark.parametrize("expert_id", ["expert-1", pytest.param(None, id="office")])
async def test_generation_calls_openai_and_returns_a_chat_image(
    workspace, mock_openai, mocker, model, expert_id
):
    content = _image_bytes("JPEG")
    handler = mock_openai(_provider_image(content))
    workspace.write_file.return_value = _workspace_file(
        "generated", "image/jpeg", len(content)
    )

    mocker.patch("backend.copilot.tools.track_tool_called")
    mocker.patch("backend.copilot.gate.gate_active", return_value=False)
    session = _session(expert_id=expert_id)
    set_execution_context("user-1", session)
    event = await execute_tool(
        "run_capability",
        {
            "id": f"tool:{_TOOL_NAME}",
            "input": {
                "prompt": "An otter",
                "size": "1536x864",
                "quality": "xhigh",
                "complexity": "low",
                "output_format": "jpeg",
                **({"model": model} if model else {}),
            },
        },
        "user-1",
        session,
        "image-call",
        disabled_groups=expert_tool_disabled_groups(
            experts_enabled=True, expert_id=session.expert_id
        ),
        disabled_tools=(),
    )

    handler.assert_called_once()
    outgoing = handler.call_args.args[0]
    assert outgoing.method == "POST"
    assert outgoing.url == f"{_GATEWAY}/images/generations"
    assert outgoing.headers["Authorization"] == "Bearer mock-gateway-key"
    assert "OpenAI-Organization" not in outgoing.headers
    assert "OpenAI-Project" not in outgoing.headers
    payload = json.loads(outgoing.content)
    safety_identifier = payload.pop("safety_identifier")
    assert len(safety_identifier) == 64 and "user-1" not in safety_identifier
    assert payload == {
        "model": f"gateway/{model or 'gpt-image-2.6-flare'}",
        "prompt": "An otter",
        "size": "1536x864",
        "quality": "xhigh",
        "complexity": "low",
        "background": "auto",
        "output_format": "jpeg",
        "n": 1,
    }
    workspace.write_file.assert_awaited_once_with(
        content=content,
        filename="generated-image.jpeg",
        mime_type="image/jpeg",
        metadata={"origin": "agent-created"},
        rename_on_conflict=True,
    )
    assert event.toolName == _TOOL_NAME
    assert isinstance(event.output, str)
    result = image_tool.WorkspaceWriteResponse.model_validate_json(event.output)
    assert result.source == payload["model"]
    assert result.download_url == "workspace://generated#image/jpeg"
    assert f"![Generated image]({result.download_url})" in result.message


async def test_edits_send_only_the_selected_workspace_images(workspace, mock_openai):
    png = _image_bytes("PNG")
    webp = _image_bytes("WEBP")
    workspace.get_file_info.side_effect = [
        _workspace_file("reference-1", "image/png", len(png)),
        _workspace_file("reference-2", "image/webp", len(webp)),
    ]
    workspace.read_file_by_id.side_effect = [png, webp]
    workspace.write_file.return_value = _workspace_file(
        "generated", "image/png", len(png)
    )
    handler = mock_openai(_provider_image(png))

    result = await image_tool.GenerateOpenAIImageTool()._execute(
        "user-1",
        _session(),
        prompt="Blend these pictures",
        model="gpt-image-2.6-flare",
        reference_images=[
            "@@agptfile:workspace://reference-1#image/png",
            "workspace://reference-2",
        ],
        background="transparent",
        quality="max",
        complexity="medium",
    )

    assert isinstance(result, image_tool.WorkspaceWriteResponse)
    outgoing = handler.call_args.args[0]
    assert outgoing.url == f"{_GATEWAY}/images/edits"
    assert outgoing.headers["Authorization"] == "Bearer mock-gateway-key"
    assert outgoing.headers["Content-Type"].startswith("multipart/form-data;")
    assert outgoing.content.count(b'name="image[]"') == 2
    assert png in outgoing.content and webp in outgoing.content
    for field, value in {
        "model": "gateway/gpt-image-2.6-flare",
        "quality": "max",
        "complexity": "medium",
        "background": "transparent",
    }.items():
        assert f'name="{field}"\r\n\r\n{value}\r\n'.encode() in outgoing.content
    assert b'name="input_fidelity"' not in outgoing.content
    assert [call.args[0] for call in workspace.read_file_by_id.await_args_list] == [
        "reference-1",
        "reference-2",
    ]


async def test_older_image_model_omits_unsupported_extensions(workspace, mock_openai):
    png = _image_bytes("PNG")
    handler = mock_openai(_provider_image(png))
    workspace.write_file.return_value = _workspace_file(
        "generated", "image/png", len(png)
    )
    result = await image_tool.GenerateOpenAIImageTool()._execute(
        "user-1", _session(), prompt="An otter", model="gpt-image-1"
    )
    assert result.type != "error"
    payload = json.loads(handler.call_args.args[0].content)
    assert payload["model"] == "gateway/gpt-image-1"
    assert "complexity" not in payload and "safety_identifier" not in payload


@pytest.mark.parametrize(
    ("arguments", "message"),
    [
        ({"size": "1000x1024"}, "dimensions divisible by 16"),
        ({"background": "transparent", "output_format": "jpeg"}, "PNG or WebP"),
        (
            {"reference_images": ["https://example.com/image.png"]},
            "Invalid image settings",
        ),
        ({"reference_images": ["workspace://not-granted"]}, "not available"),
    ],
)
async def test_bad_settings_and_ungranted_files_never_reach_openai(
    workspace, mock_openai, arguments, message
):
    workspace.get_file_info.side_effect = WorkspaceAccessDeniedError("protected file")
    handler = mock_openai(httpx.Response(500))
    result = await image_tool.GenerateOpenAIImageTool()._execute(
        "user-1", _session(), prompt="Edit a picture", **arguments
    )

    assert result.type == "error"
    assert message in result.message
    handler.assert_not_called()
    workspace.write_file.assert_not_awaited()


@pytest.mark.parametrize("status", [200, 403, 429])
async def test_openai_failures_are_sanitized_and_not_retried(
    workspace, mock_openai, status
):
    response = (
        _provider_image(b"this is not an image")
        if status == 200
        else httpx.Response(
            status, json={"error": {"message": "private upstream body"}}
        )
    )
    handler = mock_openai(response)
    result = await image_tool.GenerateOpenAIImageTool()._execute(
        "user-1", _session(), prompt="An otter"
    )

    assert result.type == "error"
    assert "OpenAI" in result.message
    assert "private upstream body" not in result.message
    handler.assert_called_once()
    workspace.write_file.assert_not_awaited()
