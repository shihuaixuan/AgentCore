from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from backend.api.features.mcp import routes

URL = "https://weather.example.com/mcp"
ROW = {"id": "chosen", "serverUrl": URL, "credentialId": "current", "revision": 2}


def test_discovery_preserves_selected_connection_id():
    assert routes.DiscoverToolsRequest(server_url=URL, connection_id="chosen").connection_id == "chosen"


@pytest.mark.asyncio
@pytest.mark.parametrize("state", ["ready", "needs_grant", "unavailable"])
async def test_saved_discovery_uses_only_the_scoped_connection(state):
    request = routes.DiscoverToolsRequest(server_url=URL, connection_id="chosen", expert_id="expert")
    resolution = SimpleNamespace(state=state, connection=ROW if state == "ready" else None)
    client = AsyncMock()
    client.initialize.return_value = {"serverInfo": {"name": "Weather"}}
    client.list_tools.return_value = []
    with (
        patch.object(routes, "_discovery_context", AsyncMock(return_value=SimpleNamespace(user_id="owner", org_id="org"))),
        patch.object(routes, "resolve_saved_connection", AsyncMock(return_value=resolution)) as resolve,
        patch.object(routes, "open_connection_client", AsyncMock(return_value=client)) as opened,
        patch.object(routes, "auto_lookup_mcp_credential", new_callable=AsyncMock) as fallback,
        patch.object(routes, "validate_url_host", new_callable=AsyncMock),
    ):
        if state == "ready":
            response = await routes.discover_tools(request, "owner", AsyncMock())
            assert response.server_name == "Weather"
            opened.assert_awaited_once_with("owner", ROW)
            client.close.assert_awaited_once()
        else:
            with pytest.raises(HTTPException):
                await routes.discover_tools(request, "owner", AsyncMock())
            opened.assert_not_awaited()
        resolve.assert_awaited_once_with("owner", "chosen", expert_id="expert", organization_id="org")
        fallback.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize("changes", [{"server_url": URL + "/other"}, {"credential_id": "different"}, {"auth_token": "fixture"}])
async def test_saved_discovery_rejects_mismatched_or_override_inputs(changes):
    data = {"server_url": URL, "connection_id": "chosen", **changes}
    with (
        patch.object(routes, "_discovery_context", AsyncMock(return_value=SimpleNamespace(user_id="owner", org_id="org"))),
        patch.object(routes, "resolve_saved_connection", AsyncMock(return_value=SimpleNamespace(state="ready", connection=ROW))),
        patch.object(routes, "open_connection_client", new_callable=AsyncMock) as opened,
        patch.object(routes, "auto_lookup_mcp_credential", new_callable=AsyncMock) as fallback,
        patch.object(routes, "validate_url_host", new_callable=AsyncMock),
        pytest.raises(HTTPException),
    ):
        await routes.discover_tools(routes.DiscoverToolsRequest(**data), "owner", AsyncMock())
    opened.assert_not_awaited()
    fallback.assert_not_awaited()
