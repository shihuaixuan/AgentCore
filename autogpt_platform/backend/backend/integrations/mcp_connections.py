"""Resolve an owned, granted remote MCP connection before opening its transport."""

from dataclasses import dataclass, field
from typing import Any, Literal

from backend.blocks.mcp.client import MCPClient
from backend.blocks.mcp.helpers import (
    catalog_mcp_client,
    mcp_client_for_credential,
    normalize_mcp_url,
)
from backend.data import custom_mcp, db
from backend.data.model import OAuth2Credentials
from backend.integrations.credentials_store import provider_matches
from backend.integrations.creds_manager import IntegrationCredentialsManager
from backend.integrations.mcp_catalog import MCPCatalogEntry, get_mcp_catalog
from backend.integrations.oauth.refresh_failure import (
    CredentialsNeedReconnectError,
    reconnect_required,
)

ConnectionState = Literal[
    "ready", "legacy", "needs_grant", "needs_selection", "needs_connection",
    "reauth_required", "unavailable",
]


@dataclass(frozen=True)
class MCPResolution:
    state: ConnectionState
    connection: dict | None = None
    choices: list[dict[str, str]] = field(default_factory=list)


class MCPConnectionError(ValueError):
    def __init__(self, state: ConnectionState):
        self.state = state
        super().__init__(f"MCP connection: {state}")


def _store():
    if db.is_connected():
        return custom_mcp
    from backend.util.clients import get_database_manager_async_client

    return get_database_manager_async_client()


def catalog_connector(connector_id: str) -> MCPCatalogEntry:
    for entry in get_mcp_catalog():
        if entry.name == connector_id:
            return entry
    raise MCPConnectionError("unavailable")


def _selection(row: dict) -> MCPResolution:
    from backend.integrations.mcp_methods import resolve_method

    if not row.get("enabled", True):
        return MCPResolution("unavailable")
    if connector_id := row.get("connectorId"):
        try:
            server = catalog_connector(connector_id).mcp_server
            method = resolve_method(server, row["methodId"])
        except (ValueError, KeyError):
            return MCPResolution("unavailable")
        if server.definition_version != row.get("definitionVersion"):
            return MCPResolution("unavailable")
        if not row.get("credentialId") and method.kind != "none":
            return MCPResolution("reauth_required")
        if row.get("credentialId") and method.kind == "none":
            return MCPResolution("unavailable")
    return MCPResolution("ready", row)


def _choices(rows: list[dict]) -> list[dict[str, str]]:
    return [{"id": row["id"], "name": row["name"]} for row in rows]


async def resolve_saved_connection(
    user_id: str, connection_id: str, *, expert_id: str | None = None,
    organization_id: str | None = None,
) -> MCPResolution:
    store = _store()
    scope = (organization_id,) if organization_id is not None else ()
    try:
        row = await store.get_custom_mcp_connection(user_id, connection_id, *scope)
        if not row or row["id"] != connection_id or not row.get("enabled", True):
            return MCPResolution("unavailable")
        if expert_id is not None and connection_id not in await store.list_expert_mcp_connection_ids(user_id, expert_id, *scope):
            return MCPResolution("needs_grant", choices=_choices([row]))
        return _selection(row)
    except Exception:
        return MCPResolution("unavailable")


async def resolve_catalog_connection(
    user_id: str, connector_id: str, *, expert_id: str | None = None,
    connection_id: str | None = None, organization_id: str | None = None,
) -> MCPResolution:
    store = _store()
    scope = (organization_id,) if organization_id is not None else ()
    try:
        catalog_connector(connector_id)
        rows = [row for row in await store.list_custom_mcp_connections(user_id, *scope)
                if row.get("connectorId") == connector_id]
        if connection_id is not None:
            if not any(row["id"] == connection_id for row in rows):
                return MCPResolution("unavailable")
            return await resolve_saved_connection(user_id, connection_id, expert_id=expert_id, organization_id=organization_id)
        if not rows:
            if organization_id is not None and await store.resolve_mcp_organization(user_id) != organization_id:
                return MCPResolution("needs_connection")
            return MCPResolution("legacy")
        enabled = [row for row in rows if row.get("enabled", True)]
        if not enabled:
            return MCPResolution("unavailable")
        if expert_id is not None:
            grants = set(await store.list_expert_mcp_connection_ids(user_id, expert_id, *scope))
            allowed = [row for row in enabled if row["id"] in grants]
            if not allowed:
                return MCPResolution("needs_grant", choices=_choices(enabled))
        else:
            allowed = enabled
        if len(allowed) != 1:
            return MCPResolution("needs_selection", choices=_choices(allowed))
        return _selection(allowed[0])
    except Exception:
        return MCPResolution("unavailable")


def _validate_credential(row: dict, credential: object) -> OAuth2Credentials:
    if credential is None:
        raise MCPConnectionError("reauth_required")
    if (
        not isinstance(credential, OAuth2Credentials)
        or credential.id != row["credentialId"]
        or not provider_matches(credential.provider, "mcp")
        or normalize_mcp_url(credential.metadata.get("mcp_server_url", "")) != normalize_mcp_url(row["serverUrl"])
    ):
        raise MCPConnectionError("unavailable")
    meta = credential.metadata
    if connector_id := row.get("connectorId"):
        if (
            meta.get("mcp_isolated") is not True
            or meta.get("mcp_catalog_id") != connector_id
            or meta.get("mcp_method_id") != row["methodId"]
            or meta.get("mcp_definition_version") != row["definitionVersion"]
            or not row.get("organizationId")
            or meta.get("mcp_organization_id") != row["organizationId"]
        ):
            raise MCPConnectionError("unavailable")
    elif "mcp_method_id" in meta:
        raise MCPConnectionError("unavailable")
    if row.get("authType") and row["authType"] != (meta.get("mcp_auth_scheme") or "oauth"):
        raise MCPConnectionError("unavailable")
    if reconnect_required(credential):
        raise MCPConnectionError("reauth_required")
    return credential


_UNSET = object()


async def open_connection_client(user_id: str, row: dict, *, credential: Any = _UNSET) -> MCPClient:
    """Open only a row returned by the resolver, or a server-built setup draft."""
    selection = _selection(row)
    if selection.state != "ready" or row.get("userId", user_id) != user_id:
        raise MCPConnectionError(selection.state if selection.state != "ready" else "unavailable")
    try:
        secret = None
        bound = None
        if row.get("credentialId"):
            if credential is _UNSET:
                manager = IntegrationCredentialsManager()
                bound = _validate_credential(row, await manager.store.get_creds_by_id(user_id, row["credentialId"]))
                if bound.access_token_expires_at:
                    bound = _validate_credential(row, await manager.refresh_if_needed(user_id, bound))
            else:
                bound = _validate_credential(row, credential)
            secret = bound.access_token
        elif row.get("authType", "none") != "none" or credential not in (_UNSET, None):
            raise MCPConnectionError("reauth_required")
        if connector_id := row.get("connectorId"):
            return catalog_mcp_client(catalog_connector(connector_id).mcp_server, row["methodId"], row["serverUrl"], secret)
        if bound and not row["serverUrl"].lower().startswith("https://"):
            raise MCPConnectionError("unavailable")
        if bound:
            return mcp_client_for_credential(row["serverUrl"], bound)
        return MCPClient(row["serverUrl"], follow_redirects=False)
    except MCPConnectionError:
        raise
    except CredentialsNeedReconnectError:
        raise MCPConnectionError("reauth_required") from None
    except Exception:
        raise MCPConnectionError("unavailable") from None
