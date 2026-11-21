"""Bind a Copilot MCP action to a connection before asking or opening a client."""

import hashlib
import hmac
import json

from pydantic import BaseModel, Field

from backend.blocks.mcp.client import MCPClient, is_dingtalk_key_endpoint
from backend.blocks.mcp.helpers import (
    mcp_client_for_credential,
    mcp_query_key,
    normalize_mcp_url,
)
from backend.copilot.model import ChatSession
from backend.data.db_accessors import experts_db
from backend.data.model import OAuth2Credentials
from backend.integrations.creds_manager import IntegrationCredentialsManager
from backend.integrations.mcp_binding import bound_query_key_catalog_entry
from backend.integrations.mcp_catalog import get_mcp_catalog_entry_for_url
from backend.integrations.mcp_connections import (
    open_connection_client,
    resolve_catalog_connection,
    resolve_saved_connection,
)
from backend.util.encryption import ENCRYPTION_KEY
from backend.util.request import validate_url_host


class MCPReviewedRoute(BaseModel):
    """Only non-secret server-derived fields may enter held calls and review rows."""

    server_url: str
    endpoint: str
    credential_id: str | None
    key_revision: str | None = None
    connector_id: str | None = None
    connection_id: str | None = None
    revision: int | str | None = None
    state: str = "ready"
    choices: list[dict[str, str]] = Field(default_factory=list)

    @property
    def account_key(self) -> str:
        identity = (self.connection_id, self.connector_id, self.credential_id, self.revision, self.key_revision, self.endpoint)
        return hashlib.sha256(json.dumps(identity).encode()).hexdigest()


def selected_id(capability_id: str) -> str | None:
    prefix, sep, value = capability_id.partition(":")
    return value if sep and prefix in {"custom_mcp", "custom"} else None


def requires_route_pin(server_url: str) -> bool:
    url = normalize_mcp_url(server_url)
    return bool(get_mcp_catalog_entry_for_url(url) or is_dingtalk_key_endpoint(url))


async def select_route(
    user_id: str, session: ChatSession, server_url: str,
    *, connector_id: str | None = None, connection_id: str | None = None,
) -> tuple[MCPReviewedRoute, dict | None, OAuth2Credentials | None]:
    url = normalize_mcp_url(server_url)
    preset = get_mcp_catalog_entry_for_url(url) if url else None
    if connector_id is None and connection_id is None and preset:
        connector_id = preset.name
    base = MCPReviewedRoute(server_url=url, endpoint=url, credential_id=None, connector_id=connector_id, connection_id=connection_id, state="unavailable")
    scope = {"expert_id": session.expert_id, "organization_id": session.organization_id}
    if connector_id and connection_id is not None:
        resolution = await resolve_catalog_connection(user_id, connector_id, connection_id=connection_id, **scope)
    elif connection_id is not None:
        resolution = await resolve_saved_connection(user_id, connection_id, **scope)
    elif connector_id:
        resolution = await resolve_catalog_connection(user_id, connector_id, **scope)
    else:
        resolution = None
    if resolution is not None:
        row = resolution.connection
        if resolution.state == "ready" and row:
            if (connection_id is not None and row.get("id") != connection_id) or (connector_id and row.get("connectorId") != connector_id):
                return base, None, None
            if not row.get("id") or not row.get("serverUrl") or row.get("revision") is None or "credentialId" not in row:
                return base, None, None
            return base.model_copy(update={"state":"ready", "endpoint":row["serverUrl"], "connection_id":row["id"], "credential_id":row["credentialId"], "connector_id":row.get("connectorId"), "revision":row["revision"]}), row, None
        if resolution.state != "legacy" or connection_id is not None:
            choices = [{"id": item["id"], "name": str(item.get("name") or item["id"])} for item in resolution.choices if isinstance(item.get("id"), str)]
            state = resolution.state if resolution.state not in {"legacy", "ready"} else "unavailable"
            return base.model_copy(update={"state":state, "choices":choices}), None, None
    if not url or (connector_id and (not preset or preset.name != connector_id)) or session.organization_id is not None:
        return base.model_copy(update={"state":"needs_connection"}), None, None
    return await _legacy_route(user_id, session, base, public=bool(preset and "none" in preset.mcp_server.auth_methods))


async def _legacy_route(user_id: str, session: ChatSession, base: MCPReviewedRoute, *, public: bool):
    manager = IntegrationCredentialsManager()
    rows = await manager.store.get_creds_by_provider(user_id, "mcp")
    candidates = [row for row in rows if isinstance(row, OAuth2Credentials) and _matches(row, base)]
    granted = candidates
    if session.expert_id is not None:
        ids = set(await experts_db().expert_allowed_credential_ids(user_id, session.expert_id))
        granted = [row for row in candidates if row.id in ids]
    if len(granted) != 1:
        state = "needs_selection" if granted else "needs_grant" if session.expert_id and (candidates or public) else "ready" if public and not candidates else "needs_connection"
        return base.model_copy(update={"state":state}), None, None
    cred = granted[0]
    endpoint = cred.metadata["mcp_server_url"]
    revision = None
    if mcp_query_key(cred) is not None:
        if not ENCRYPTION_KEY:
            return base, None, None
        data = f"mcp-review-v1\0{user_id}\0{cred.id}\0{cred.access_token.get_secret_value()}"
        revision = hmac.digest(ENCRYPTION_KEY.encode(), data.encode(), "sha256").hex()
    return base.model_copy(update={"state":"ready", "credential_id":cred.id, "endpoint":endpoint, "key_revision":revision}), None, cred


def _matches(cred: OAuth2Credentials, base: MCPReviewedRoute) -> bool:
    if cred.metadata.get("mcp_isolated"):
        return False
    if cred.metadata.get("mcp_server_url") == base.server_url:
        return True
    alias = bound_query_key_catalog_entry(cred)
    return bool(alias and alias.name == base.connector_id and alias.mcp_server.server_url == base.server_url)


async def open_reviewed_client(user_id: str, session: ChatSession, route: MCPReviewedRoute) -> MCPClient | None:
    if route.state != "ready":
        return None
    current, row, cred = await select_route(user_id, session, route.server_url, connector_id=route.connector_id, connection_id=route.connection_id)
    if current != route:
        return None
    if row:
        return await open_connection_client(user_id, row)
    await validate_url_host(route.endpoint)
    if cred and cred.access_token_expires_at:
        refreshed = await IntegrationCredentialsManager().refresh_if_needed(user_id, cred)
        if refreshed.id != cred.id or refreshed.metadata != cred.metadata:
            return None
        cred = refreshed
    if cred:
        return mcp_client_for_credential(route.endpoint, cred)
    return MCPClient(route.endpoint, follow_redirects=False)
