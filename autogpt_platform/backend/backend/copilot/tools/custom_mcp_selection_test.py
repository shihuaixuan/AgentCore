from unittest.mock import AsyncMock, patch

import pytest

from backend.blocks.mcp.client import MCPCallResult
from backend.copilot.capabilities.index import CapabilityIndex
from backend.copilot.capabilities.models import CapabilityEntry, Implementation
from backend.copilot.capabilities.ranking import ConnectionState, resolve_connected
from backend.copilot.model import ChatMessage, ChatSession
from backend.copilot.tools.describe_capability import _describe_mcp
from backend.copilot.tools.find_capability import FindCapabilityTool
from backend.copilot.tools.models import ErrorResponse, MCPToolsDiscoveredResponse
from backend.copilot.tools.run_capability import RunCapabilityTool
from backend.copilot.tools.run_mcp_tool import RunMCPToolTool
from backend.copilot.tools.session_registry import session_custom_mcp_entries
from backend.util.request import HTTPClientError

ID = "64f37e61-dbbc-4057-8df1-f2fd8612e309"


@pytest.mark.asyncio
async def test_custom_connection_auth_failure_points_to_its_saved_settings():
    session = ChatSession.new("alice", dry_run=False)
    row = {
        "id": ID,
        "serverUrl": "https://mcp.example.com",
        "credentialId": None,
        "enabled": True,
    }
    client = AsyncMock()
    client.initialize.side_effect = HTTPClientError("Unauthorized", status_code=401)
    with (
        patch("backend.data.db.is_connected", return_value=True),
        patch(
            "backend.data.custom_mcp.get_custom_mcp_connection",
            new_callable=AsyncMock,
            return_value=row,
        ),
        patch(
            "backend.copilot.tools.run_mcp_tool.validate_url_host",
            new_callable=AsyncMock,
        ),
        patch("backend.copilot.tools.run_mcp_tool.MCPClient", return_value=client),
    ):
        result = await RunMCPToolTool()._execute(
            "alice", session, server_url=row["serverUrl"], custom_connection_id=ID
        )
    assert isinstance(result, ErrorResponse)
    assert "Integrations" in result.message


def test_custom_service_is_not_hidden_by_catalog_service_search():
    entries = [
        CapabilityEntry(
            id="mcp:linear",
            kind="mcp_server",
            name="Linear",
            purpose="Create issues",
            tags=["mcp", "linear"],
        ),
        CapabilityEntry(
            id=f"custom_mcp:{ID}",
            kind="mcp_server",
            name="Company Linear",
            purpose="Search and create issues in Linear",
            custom_mcp=True,
        ),
        *[
            CapabilityEntry(
                id=f"tool:{i}",
                kind="tool",
                name=f"Unrelated {i}",
                purpose="Read calendar events",
            )
            for i in range(8)
        ],
    ]
    result = CapabilityIndex(entries).search("Linear create issue")
    assert f"custom_mcp:{ID}" in [hit.entry.id for hit in result.hits]


@pytest.mark.asyncio
async def test_custom_connection_search_to_execution_without_selection_e2e():
    session = ChatSession.new("alice", dry_run=False)
    session.messages = [ChatMessage(role="user", content="Weather for London")]
    row = {
        "id": ID,
        "name": "Weather",
        "description": "Find weather forecasts",
        "serverUrl": "https://mcp.example.com",
        "credentialId": None,
        "enabled": True,
    }
    client = AsyncMock()
    client.call_tool.return_value = MCPCallResult(
        content=[{"type": "text", "text": "Sunny in London"}], is_error=False
    )
    with (
        patch("backend.data.db.is_connected", return_value=True),
        patch(
            "backend.copilot.tools.session_registry.list_custom_mcp_connections",
            new_callable=AsyncMock,
            return_value=[row],
        ),
        patch(
            "backend.data.custom_mcp.get_custom_mcp_connection",
            new_callable=AsyncMock,
            return_value=row,
        ),
        patch(
            "backend.copilot.tools.session_registry.session_skill_entries",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "backend.copilot.tools.session_registry.session_expert_entries",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "backend.copilot.tools.session_registry.get_registry",
            return_value=CapabilityIndex([]),
        ),
        patch(
            "backend.copilot.tools.find_capability.load_connection_state",
            new_callable=AsyncMock,
            return_value=ConnectionState(),
        ),
        patch(
            "backend.copilot.tools.run_mcp_tool.validate_url_host",
            new_callable=AsyncMock,
        ),
        patch("backend.copilot.tools.run_mcp_tool.MCPClient", return_value=client),
    ):
        found = await FindCapabilityTool()._execute("alice", session, query="Weather")
        assert found.capabilities[0]["id"] == f"custom_mcp:{ID}"
        assert found.capabilities[0]["connected"] is True
        result = await RunCapabilityTool()._execute(
            "alice",
            session,
            id=found.capabilities[0]["id"],
            input={"tool": "get_weather", "arguments": {"city": "London"}},
        )
        assert result.success is True
        assert "Sunny in London" in result.result
        row["enabled"] = False
        blocked = await RunCapabilityTool()._execute(
            "alice",
            session,
            id=f"custom_mcp:{ID}",
            input={"tool": "get_weather", "arguments": {"city": "London"}},
        )
        assert "Unknown capability" in blocked.message


@pytest.mark.asyncio
@pytest.mark.parametrize("origin", ["interactive", "automation"])
async def test_discovery_uses_enabled_connections_for_each_turn_origin(origin):
    session = ChatSession.new("alice", dry_run=False, origin=origin)
    row = {
        "id": ID,
        "name": "Weather",
        "description": "Find weather",
        "serverUrl": "https://mcp.example.com",
        "credentialId": "weather-account",
        "enabled": True,
    }
    with (
        patch(
            "backend.copilot.tools.session_registry.list_custom_mcp_connections",
            new_callable=AsyncMock,
            return_value=[row],
        ),
        patch("backend.data.db.is_connected", return_value=True),
    ):
        entries = await session_custom_mcp_entries("alice", session)
    assert [entry.id for entry in entries] == [f"custom_mcp:{ID}"]
    assert resolve_connected(entries[0], ConnectionState()) is True
    assert entries[0].custom_mcp_credential_id == "weather-account"


@pytest.mark.asyncio
async def test_expert_discovers_only_public_or_granted_connections():
    session = ChatSession.new("alice", dry_run=False)
    session.expert_id = "expert-1"
    row = {
        "name": "Weather",
        "description": "Find weather",
        "serverUrl": "https://mcp.example.com",
        "enabled": True,
    }
    rows = [
        {**row, "id": "public", "credentialId": None},
        {**row, "id": "granted", "credentialId": "allowed"},
        {**row, "id": "ungranted", "credentialId": "private"},
    ]
    with (
        patch("backend.data.db.is_connected", return_value=True),
        patch(
            "backend.copilot.tools.session_registry.list_custom_mcp_connections",
            new_callable=AsyncMock,
            return_value=rows,
        ),
        patch("backend.copilot.tools.session_registry.experts_db") as experts,
    ):
        experts.return_value.expert_allowed_credential_ids = AsyncMock(
            return_value=["allowed"]
        )
        entries = await session_custom_mcp_entries("alice", session)
    assert [entry.id for entry in entries] == [
        "custom_mcp:public",
        "custom_mcp:granted",
    ]


@pytest.mark.asyncio
async def test_enabled_connections_are_discovered_without_message_selection():
    session = ChatSession.new("alice", dry_run=False)
    session.messages = [
        ChatMessage(role="user", content=f"Use this [custom_mcp:{ID}]"),
        ChatMessage(role="assistant", content="Done"),
        ChatMessage(role="user", content="Now do something else"),
    ]
    row = {
        "id": ID,
        "name": "Weather",
        "description": "Find weather",
        "serverUrl": "https://mcp.example.com",
        "credentialId": None,
        "enabled": True,
    }
    with (
        patch("backend.data.db.is_connected", return_value=True),
        patch(
            "backend.data.db.query_raw_with_schema",
            new_callable=AsyncMock,
            return_value=[row],
        ) as query,
    ):
        entries = await session_custom_mcp_entries("alice", session)
    assert [entry.id for entry in entries] == [f"custom_mcp:{ID}"]
    assert query.await_args.args[1:] == ("alice",)
    assert '"userId"=$1' in query.await_args.args[0]


@pytest.mark.asyncio
async def test_disabled_connections_are_not_discovered():
    session = ChatSession.new("alice", dry_run=False)
    session.messages = [ChatMessage(role="user", content=f"Weather [custom_mcp:{ID}]")]
    row = {
        "id": ID,
        "name": "Weather",
        "description": "Find weather",
        "serverUrl": "https://mcp.example.com",
        "credentialId": None,
        "enabled": True,
    }
    with (
        patch(
            "backend.data.db.query_raw_with_schema",
            new_callable=AsyncMock,
            return_value=[row, {**row, "id": "disabled", "enabled": False}],
        ) as query,
        patch("backend.data.db.is_connected", return_value=True),
    ):
        entries = await session_custom_mcp_entries("alice", session)
    assert [entry.id for entry in entries] == [f"custom_mcp:{ID}"]
    assert entries[0].custom_mcp
    assert query.await_args.args[1:] == ("alice",)


@pytest.mark.asyncio
@pytest.mark.parametrize("enabled,allowed_ids", [(True, []), (False, ["saved-key"])])
async def test_expert_cannot_execute_stale_custom_tool_after_revoke_or_disable(
    enabled, allowed_ids
):
    session = ChatSession.new("alice", dry_run=False)
    session.expert_id = "expert-1"
    row = {
        "id": ID,
        "serverUrl": "https://mcp.example.com",
        "credentialId": "saved-key",
        "enabled": enabled,
    }
    with (
        patch("backend.data.db.is_connected", return_value=True),
        patch(
            "backend.data.custom_mcp.get_custom_mcp_connection",
            new_callable=AsyncMock,
            return_value=row,
        ),
        patch(
            "backend.copilot.tools.run_mcp_tool.validate_url_host",
            new_callable=AsyncMock,
        ),
        patch("backend.copilot.tools.run_mcp_tool.experts_db") as experts,
        patch("backend.copilot.tools.run_mcp_tool.MCPClient") as client,
    ):
        experts.return_value.expert_allowed_credential_ids = AsyncMock(
            return_value=allowed_ids
        )
        result = await RunMCPToolTool()._execute(
            "alice",
            session,
            server_url="https://mcp.example.com",
            tool_name="search",
            custom_connection_id=ID,
            custom_credential_id="saved-key",
        )
    assert isinstance(result, ErrorResponse)
    assert "unavailable" in result.message
    client.assert_not_called()


@pytest.mark.asyncio
async def test_removed_connection_cannot_be_executed():
    session = ChatSession.new("alice", dry_run=False)
    with (
        patch(
            "backend.data.custom_mcp.get_custom_mcp_connection",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch("backend.data.db.is_connected", return_value=True),
        patch(
            "backend.copilot.tools.run_mcp_tool.validate_url_host",
            new_callable=AsyncMock,
        ),
        patch("backend.copilot.tools.run_mcp_tool.MCPClient") as client,
    ):
        result = await RunMCPToolTool()._execute(
            "alice",
            session,
            server_url="https://mcp.example.com",
            tool_name="delete",
            custom_connection_id=ID,
        )
    assert "unavailable" in result.message
    client.assert_not_called()


@pytest.mark.asyncio
async def test_unavailable_connections_do_not_break_capability_search():
    session = ChatSession.new("alice", dry_run=False, origin="automation")
    session.messages = [ChatMessage(role="user", content=f"Weather [custom_mcp:{ID}]")]
    with (
        patch(
            "backend.copilot.tools.session_registry.db.is_connected", return_value=True
        ),
        patch(
            "backend.copilot.tools.session_registry.list_custom_mcp_connections",
            new_callable=AsyncMock,
            side_effect=RuntimeError("database unavailable"),
        ),
    ):
        assert await session_custom_mcp_entries("alice", session) == []


@pytest.mark.asyncio
async def test_prisma_less_worker_uses_database_manager():
    session = ChatSession.new("alice", dry_run=False)
    session.messages = [ChatMessage(role="user", content=f"Weather [custom_mcp:{ID}]")]
    row = {
        "id": ID,
        "name": "Weather",
        "description": "Forecast",
        "serverUrl": "https://mcp.example.com",
        "credentialId": None,
        "enabled": True,
    }
    manager = AsyncMock()
    manager.list_custom_mcp_connections.return_value = [row]
    with (
        patch("backend.data.db.is_connected", return_value=False),
        patch(
            "backend.copilot.tools.session_registry.get_database_manager_async_client",
            return_value=manager,
        ),
    ):
        entries = await session_custom_mcp_entries("alice", session)
    assert [entry.id for entry in entries] == [f"custom_mcp:{ID}"]
    manager.list_custom_mcp_connections.assert_awaited_once_with("alice")


@pytest.mark.asyncio
async def test_gate_answer_rows_do_not_hide_enabled_connections():
    session = ChatSession.new("alice", dry_run=False)
    session.messages = [
        ChatMessage(role="user", content=f"Weather [custom_mcp:{ID}]"),
        ChatMessage(
            role="user", content="Approved", metadata={"held_calls_answered": True}
        ),
    ]
    row = {
        "id": ID,
        "name": "Weather",
        "description": "",
        "serverUrl": "https://mcp.example.com",
        "credentialId": None,
        "enabled": True,
    }
    with (
        patch("backend.data.db.is_connected", return_value=True),
        patch(
            "backend.data.db.query_raw_with_schema",
            new_callable=AsyncMock,
            return_value=[row],
        ),
    ):
        entries = await session_custom_mcp_entries("alice", session)
    assert [entry.id for entry in entries] == [f"custom_mcp:{ID}"]


@pytest.mark.asyncio
async def test_describe_uses_the_selected_connection_credential():
    session = ChatSession.new("alice", dry_run=False)
    entry = CapabilityEntry(
        id=f"custom_mcp:{ID}",
        kind="mcp_server",
        name="Weather",
        purpose="Weather",
        implementations=[
            Implementation(kind="mcp_server", ref="https://mcp.example.com")
        ],
        custom_mcp=True,
        custom_mcp_credential_id="account-2",
    )
    response = MCPToolsDiscoveredResponse(
        message="found",
        server_url="https://mcp.example.com",
        tools=[],
        session_id=session.session_id,
    )
    with patch(
        "backend.copilot.tools.describe_capability.RunMCPToolTool._execute",
        new_callable=AsyncMock,
        return_value=response,
    ) as run:
        await _describe_mcp(entry, "alice", session)
    assert run.await_args.kwargs["custom_connection_id"] == ID
    assert run.await_args.kwargs["custom_credential_id"] == "account-2"


@pytest.mark.asyncio
async def test_temporary_oauth_refresh_failure_is_reported_without_deleting_credential():
    session = ChatSession.new("alice", dry_run=False)
    row = {
        "id": ID,
        "name": "Weather",
        "description": "",
        "serverUrl": "https://mcp.example.com",
        "credentialId": "cred-1",
        "enabled": True,
    }
    with (
        patch("backend.data.db.is_connected", return_value=True),
        patch(
            "backend.data.custom_mcp.get_custom_mcp_connection",
            new_callable=AsyncMock,
            return_value=row,
        ),
        patch(
            "backend.copilot.tools.run_mcp_tool.validate_url_host",
            new_callable=AsyncMock,
        ),
        patch(
            "backend.integrations.creds_manager.IntegrationCredentialsManager.get",
            new_callable=AsyncMock,
            side_effect=TimeoutError(),
        ),
        patch(
            "backend.copilot.tools.run_mcp_tool.invalidate_mcp_credential",
            new_callable=AsyncMock,
        ) as invalidate,
    ):
        result = await RunMCPToolTool()._execute(
            "alice",
            session,
            server_url="https://mcp.example.com",
            custom_connection_id=ID,
            custom_credential_id="cred-1",
        )
    assert "try again" in result.message
    invalidate.assert_not_awaited()
