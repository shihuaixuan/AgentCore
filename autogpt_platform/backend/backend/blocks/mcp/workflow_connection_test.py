from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import SecretStr

from backend.blocks.mcp.block import MCPToolBlock
from backend.data.execution import ExecutionContext
from backend.data.model import OAuth2Credentials

URL = "https://mcp.example.com/mcp"
ROW = {
    "id": "saved-1",
    "userId": "user-1",
    "serverUrl": URL,
    "credentialId": "cred-1",
    "enabled": True,
    "revision": 3,
}


def credential() -> OAuth2Credentials:
    return OAuth2Credentials(
        id="cred-1",
        provider="mcp",
        access_token=SecretStr("leased-token"),
        scopes=[],
        metadata={"mcp_server_url": URL},
    )


@pytest.mark.asyncio
async def test_selected_connection_is_re_resolved_before_call():
    block = MCPToolBlock()
    client = MagicMock()
    client.initialize = AsyncMock()
    client.call_tool = AsyncMock()
    client.close = AsyncMock()
    client.call_tool.return_value = MagicMock(is_error=False, content=[], structured_content={"ok": True})
    resolution = MagicMock(state="ready", connection=ROW)
    with (
        patch("backend.blocks.mcp.block.resolve_saved_connection", AsyncMock(return_value=resolution)) as resolve,
        patch("backend.blocks.mcp.block.open_connection_client", AsyncMock(return_value=client)) as opened,
    ):
        output = [
            item
            async for item in block.run(
                MCPToolBlock.Input(connection_id="saved-1", server_url=URL, selected_tool="read"),
                user_id="user-1",
                credentials=credential(),
                execution_context=ExecutionContext(organization_id="org-1"),
            )
        ]
    assert output == [("result", {"ok": True})]
    resolve.assert_awaited_once_with(
        "user-1", "saved-1", expert_id=None, organization_id="org-1"
    )
    opened.assert_awaited_once_with("user-1", ROW, credential=resolve.call_args and credential())


@pytest.mark.asyncio
async def test_selected_connection_never_falls_back_when_resolution_is_not_ready():
    block = MCPToolBlock()
    resolution = MagicMock(state="needs_grant", connection=None)
    with (
        patch("backend.blocks.mcp.block.resolve_saved_connection", AsyncMock(return_value=resolution)),
        patch("backend.blocks.mcp.block.open_connection_client", new_callable=AsyncMock) as opened,
    ):
        output = [
            item
            async for item in block.run(
                MCPToolBlock.Input(connection_id="saved-1", server_url=URL, selected_tool="read"),
                user_id="user-1",
                execution_context=ExecutionContext(expert_id="expert-1"),
            )
        ]
    assert output == [("error", "This connection is unavailable. Select its tool again.")]
    opened.assert_not_awaited()
