"""Synthetic boundaries: no provider, credentials database or DNS required."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from backend.copilot.tools._test_data import make_session
from backend.copilot.tools.models import SetupRequirementsResponse
from backend.copilot.tools.run_mcp_tool import RunMCPToolTool

ROUTES = "backend.copilot.capabilities.mcp_routes"
URL = "https://api.githubcopilot.com/mcp/"


@pytest.mark.xfail(strict=True, reason="Catalog discovery does not consult the saved connection resolver")
@pytest.mark.parametrize("state", ["needs_grant", "needs_selection", "needs_connection", "reauth_required", "unavailable"])
async def test_catalog_discovery_surfaces_state_without_opening_client(state):
    resolution = SimpleNamespace(state=state, connection=None, choices=[{"id": "account-a", "name": "Work", "secret": "must-not-leak"}])
    with (
        patch(f"{ROUTES}.resolve_catalog_connection", AsyncMock(return_value=resolution)) as resolve,
        patch(f"{ROUTES}.open_connection_client", new_callable=AsyncMock) as opened,
    ):
        result = await RunMCPToolTool()._execute("user", make_session("user", expert_id="expert"), server_url=URL)
    resolve.assert_awaited_once_with("user", "mcp_github", expert_id="expert")
    assert isinstance(result, SetupRequirementsResponse)
    assert result.setup_info.mcp_catalog_id == "mcp_github"
    assert result.setup_info.mcp_connection_state == state
    assert "must-not-leak" not in result.model_dump_json()
    opened.assert_not_awaited()
