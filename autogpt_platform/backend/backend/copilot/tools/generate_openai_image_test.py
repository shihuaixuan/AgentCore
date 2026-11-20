import base64
import io
import json
from datetime import UTC, datetime
from typing import get_args
from unittest.mock import Mock

import httpx
import pytest
from openai import AsyncOpenAI
from PIL import Image
from pydantic import SecretStr

from backend.copilot.context import set_execution_context
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
from backend.copilot.tools.expert_scope import CredentialScopeSnapshot
from backend.data.model import APIKeyCredentials
from backend.data.workspace import WorkspaceFile
from backend.data.workspace_scope import WorkspaceAccessDeniedError
from backend.integrations import openai_image
from backend.integrations.credentials_store import openai_credentials
from backend.util.workspace import WorkspaceManager

from . import generate_openai_image as image_tool

_TOOL_NAME = GENERATE_OPENAI_IMAGE_TOOL
_KEY = APIKeyCredentials(
    id="image-test-key",
    title="Image project",
    provider="openai",
    api_key=SecretStr("mock-openai-image-key"),
)


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


def test_openai_image_generation_is_reachable_only_by_experts():
    assert get_tool(_TOOL_NAME) is not None
    for expert_id, expected in (("expert-1", True), (None, False)):
        groups = expert_tool_disabled_groups(experts_enabled=True, expert_id=expert_id)
        assert (_TOOL_NAME in reachable_tool_names(disabled_groups=groups)) is expected


def test_openai_image_generation_is_not_a_workflow_tool_option():
    assert _TOOL_NAME in ALL_TOOL_NAMES
    assert _TOOL_NAME not in get_args(ToolName)


@pytest.mark.parametrize(
    "overrides",
    [
        {"expert_id": None},
        {"user_id": "another-user"},
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
    resolve = mocker.patch(
        "backend.copilot.tools.generate_openai_image.resolve_credential_scope",
        return_value=CredentialScopeSnapshot([], set()),
    )
    mocker.patch.object(image_tool, "selected_credentials", return_value={})

    result = await tool._execute("user-1", _session(**overrides), prompt="An otter")

    assert result.type == "error"
    resolve.assert_not_awaited()


async def test_openai_provider_denial_prevents_a_credential_lookup(mocker):
    session = _session()
    set_execution_context(
        "user-1", session, permissions=CopilotPermissions(providers=["openai"])
    )
    resolve = mocker.patch.object(
        image_tool,
        "resolve_credential_scope",
        return_value=CredentialScopeSnapshot([], set()),
    )
    mocker.patch.object(image_tool, "selected_credentials", return_value={})

    result = await image_tool.GenerateOpenAIImageTool()._execute(
        "user-1", session, prompt="An otter"
    )

    assert result.type == "error"
    assert "permission" in result.message
    resolve.assert_not_awaited()


async def test_only_eligible_personal_keys_are_offered_to_the_expert(mocker):
    scope = CredentialScopeSnapshot(
        owned=[
            openai_credentials,
            _KEY.model_copy(update={"id": "openai-default"}),
            _KEY.model_copy(update={"id": "replicate-key", "provider": "replicate"}),
            _KEY.model_copy(update={"id": "empty-key", "api_key": SecretStr(" ")}),
            _KEY,
        ],
        allowed_ids={
            openai_credentials.id,
            "openai-default",
            "replicate-key",
            "empty-key",
        },
    )
    mocker.patch.object(image_tool, "resolve_credential_scope", return_value=scope)
    mocker.patch.object(
        image_tool,
        "selected_credentials",
        return_value={"openai": openai_credentials.id},
    )
    workspace = mocker.patch.object(image_tool, "get_workspace_manager")

    result = await image_tool.GenerateOpenAIImageTool()._execute(
        "user-1", _session(), prompt="An otter"
    )

    assert isinstance(result, image_tool.SetupRequirementsResponse)
    requirement = result.setup_info.user_readiness.missing_credentials[
        "openai_credentials"
    ]
    assert requirement["provider"] == "openai"
    assert requirement["types"] == ["api_key"]
    assert requirement["expert_grant"] == {
        "expert_id": "expert-1",
        "credentials": [{"id": _KEY.id, "title": _KEY.title, "type": "api_key"}],
    }
    assert "mock-openai-image-key" not in result.model_dump_json()
    workspace.assert_not_awaited()


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
    other_key = _KEY.model_copy(
        update={"id": "other-key", "api_key": SecretStr("other-key")}
    )
    scope = CredentialScopeSnapshot(
        owned=[openai_credentials, other_key, _KEY], allowed_ids={other_key.id, _KEY.id}
    )
    mocker.patch.object(image_tool, "resolve_credential_scope", return_value=scope)
    mocker.patch.object(
        image_tool, "selected_credentials", return_value={"openai": _KEY.id}
    )
    manager = Mock(spec=WorkspaceManager)
    mocker.patch.object(image_tool, "get_workspace_manager", return_value=manager)
    return manager


@pytest.fixture
def mock_openai(mocker, monkeypatch):
    monkeypatch.setenv("OPENAI_ORG_ID", "deployment-org")
    monkeypatch.setenv("OPENAI_PROJECT_ID", "deployment-project")

    def install(response: httpx.Response):
        handler = Mock(return_value=response)

        def client(**kwargs):
            return AsyncOpenAI(
                **kwargs,
                http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
            )

        mocker.patch.object(openai_image, "AsyncOpenAI", side_effect=client)
        return handler

    return install


def _provider_image(content: bytes) -> httpx.Response:
    return httpx.Response(
        200,
        json={"created": 1, "data": [{"b64_json": base64.b64encode(content).decode()}]},
    )


@pytest.mark.parametrize("model", ["gpt-image-2.6-sunburst", "gpt-image-2.6-flare"])
async def test_generation_calls_openai_and_returns_a_chat_image(
    workspace, mock_openai, mocker, model
):
    content = _image_bytes("JPEG")
    handler = mock_openai(_provider_image(content))
    workspace.write_file.return_value = _workspace_file(
        "generated", "image/jpeg", len(content)
    )

    mocker.patch("backend.copilot.tools.track_tool_called")
    mocker.patch("backend.copilot.gate.gate_active", return_value=False)
    session = _session()
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
                **({"model": model} if model.endswith("flare") else {}),
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
    assert outgoing.url == "https://api.openai.com/v1/images/generations"
    assert outgoing.headers["Authorization"] == "Bearer mock-openai-image-key"
    assert "OpenAI-Organization" not in outgoing.headers
    assert "OpenAI-Project" not in outgoing.headers
    payload = json.loads(outgoing.content)
    safety_identifier = payload.pop("safety_identifier")
    assert len(safety_identifier) == 64 and "user-1" not in safety_identifier
    assert payload == {
        "model": model,
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
    assert outgoing.url.path == "/v1/images/edits"
    assert outgoing.headers["Content-Type"].startswith("multipart/form-data;")
    assert outgoing.content.count(b'name="image[]"') == 2
    assert png in outgoing.content and webp in outgoing.content
    for field, value in {
        "model": "gpt-image-2.6-flare",
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
