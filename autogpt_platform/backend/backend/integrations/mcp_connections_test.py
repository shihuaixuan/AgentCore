from unittest.mock import AsyncMock, patch

import pytest
from pydantic import SecretStr

from backend.data.model import OAuth2Credentials
from backend.integrations import mcp_connections as connections


def row(connection_id="account-a", **changes):
    return {
        "id": connection_id,
        "name": connection_id,
        "userId": "alice",
        "organizationId": "org-1",
        "connectorId": "mcp_1inch",
        "methodId": "bearer",
        "definitionVersion": 1,
        "serverUrl": "https://api.1inch.com/mcp/protocol",
        "authType": "bearer",
        "credentialId": "cred-a",
        "revision": 1,
        "enabled": True,
        **changes,
    }


@pytest.fixture
def store():
    storage = AsyncMock()
    storage.list_custom_mcp_connections.return_value = [row()]
    storage.list_expert_mcp_connection_ids.return_value = ["account-a"]
    storage.get_custom_mcp_connection.return_value = row()
    with patch.object(connections, "_store", return_value=storage):
        yield storage


@pytest.mark.asyncio
async def test_multiple_accounts_require_selection_even_if_same_url(store):
    store.list_custom_mcp_connections.return_value += [row("account-b")]
    resolution = await connections.resolve_catalog_connection("alice", "mcp_1inch")
    assert resolution.state == "needs_selection"
    assert resolution.connection is None
    assert {choice["id"] for choice in resolution.choices} == {"account-a", "account-b"}
    assert all(set(choice) == {"id", "name"} for choice in resolution.choices)
    granted = await connections.resolve_catalog_connection(
        "alice", "mcp_1inch", expert_id="expert"
    )
    assert granted.state == "ready" and granted.connection == row()


@pytest.mark.asyncio
async def test_missing_grant_cannot_use_even_an_anonymous_connection(store):
    public = row(methodId="none", authType="none", credentialId=None)
    store.get_custom_mcp_connection.return_value = public
    store.list_expert_mcp_connection_ids.return_value = []
    for connector_id in ("mcp_1inch", "mcp_dingtalk_calendar"):
        result = await connections.resolve_catalog_connection(
            "alice", connector_id, expert_id="expert", connection_id=public["id"]
        )
        assert result.state != "ready" and result.connection is None
    assert (await connections.resolve_saved_connection("alice", public["id"])).state == "ready"


@pytest.mark.asyncio
async def test_disabled_or_changed_definition_never_falls_back_to_legacy(store):
    for changes in ({"enabled": False}, {"definitionVersion": 17}, {"methodId": "deleted"}):
        store.list_custom_mcp_connections.return_value = [row(**changes)]
        result = await connections.resolve_catalog_connection("alice", "mcp_1inch")
        assert result.state == "unavailable" and result.connection is None


@pytest.mark.asyncio
async def test_open_rejects_different_credential_scope_before_network_or_refresh(store):
    selected = row()
    credential = OAuth2Credentials(
        id="cred-a", provider="mcp", access_token=SecretStr("synthetic-test-value"),
        scopes=[], metadata={
            "mcp_server_url": selected["serverUrl"], "mcp_isolated": True,
            "mcp_catalog_id": selected["connectorId"], "mcp_method_id": "bearer",
            "mcp_definition_version": 1, "mcp_auth_scheme": "bearer",
            "mcp_organization_id": "other-tenant",
        },
    )
    with pytest.raises(connections.MCPConnectionError) as failure:
        await connections.open_connection_client("alice", selected, credential=credential)
    assert failure.value.state != "ready"
    assert "synthetic-test-value" not in str(failure.value)


@pytest.mark.asyncio
async def test_missing_key_never_opens_anonymous_client(store):
    with pytest.raises(connections.MCPConnectionError) as failure:
        await connections.open_connection_client("alice", row(), credential=None)
    assert failure.value.state == "reauth_required"


@pytest.mark.asyncio
async def test_transient_lookup_error_is_not_a_request_to_sign_in(store):
    store.list_custom_mcp_connections.side_effect = TimeoutError("private details")
    result = await connections.resolve_catalog_connection("alice", "mcp_1inch")
    assert result.state == "unavailable" and result.connection is None
