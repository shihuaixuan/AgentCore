"""Shared MCP helpers used by blocks, copilot tools, and API routes."""

from __future__ import annotations

import json
import logging
import re
from typing import Any
from urllib.parse import urlparse

from pydantic import SecretStr

from backend.blocks.mcp.client import MCPClient
from backend.data.model import OAuth2Credentials
from backend.integrations.creds_manager import IntegrationCredentialsManager
from backend.integrations.mcp_binding import bound_query_key_catalog_entry
from backend.integrations.mcp_catalog import MCPServerMetadata
from backend.integrations.mcp_methods import (
    method_endpoint,
    resolve_method,
    runtime_token,
)
from backend.integrations.providers import ProviderName
from backend.util.request import EndpointAuth

logger = logging.getLogger(__name__)
_AUTH_PARAMETER = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{0,63}$")


def catalog_mcp_client(
    server: MCPServerMetadata, method_id: str, server_url: str, secret: SecretStr | None
) -> MCPClient:
    method = resolve_method(server, method_id)
    endpoint = method_endpoint(server, method, server_url)
    scheme = {"basic": "Basic ", "bearer": "Bearer ", "oauth": "Bearer "}.get(method.auth_type, "")
    auth = EndpointAuth(
        endpoint=endpoint,
        token=runtime_token(method, secret),
        header="Authorization" if scheme else method.name if method.auth_type == "header" else None,
        query=method.name if method.auth_type == "query_key" else None,
        prefix=scheme or method.auth_prefix,
        fixed_params=method.fixed_params,
    )
    return MCPClient(endpoint, endpoint_auth=auth, follow_redirects=False)


def normalize_mcp_url(url: str) -> str:
    """Normalize an MCP server URL for consistent credential matching.

    Strips leading/trailing whitespace and a single trailing slash so that
    ``https://mcp.example.com/`` and ``https://mcp.example.com`` resolve to
    the same stored credential.

    A URL with no scheme gets ``https://``. That is the user omitting a scheme
    rather than asking for cleartext — but the reason it belongs *here* is
    matching, not politeness: the credential is stored under this value and
    every lookup re-derives it from user input through this same function, so
    the default has to be applied in one place or storage and lookup disagree.
    """
    url = url.strip().rstrip("/")
    if url and "://" not in url:
        url = f"https://{url}"
    return url


def server_host(server_url: str) -> str:
    """Extract the hostname from a server URL for display purposes.

    Uses ``parsed.hostname`` (never ``netloc``) to strip any embedded
    username/password before surfacing the value in UI messages.
    """
    try:
        parsed = urlparse(server_url)
        return parsed.hostname or server_url
    except (ValueError, TypeError):
        return server_url


def is_manual_mcp_credential(credentials: OAuth2Credentials) -> bool:
    """Whether an MCP credential was pasted by the user rather than obtained via OAuth.

    Manual credentials are ``OAuth2Credentials`` rows with no refresh token and
    no OAuth client metadata, so they must not be refreshed or rewritten as if
    they were OAuth grants.
    """
    metadata = credentials.metadata or {}
    return (
        credentials.refresh_token is None
        and not metadata.get("mcp_token_url")
        and not metadata.get("mcp_client_id")
    )


def mcp_query_key(credentials: OAuth2Credentials) -> SecretStr | None:
    """Return the opaque saved key only for a query-key credential."""
    if (credentials.metadata or {}).get("mcp_auth_scheme") == "query_key":
        return credentials.access_token
    return None


def mcp_authorization_header(credentials: OAuth2Credentials) -> str | None:
    """Build the Authorization value for a *stored* MCP credential.

    Reads the scheme from metadata and never re-parses the secret.  Rows with
    a header scheme hold a canonical ``"<Scheme> <credential>"``; older rows
    hold a bare Bearer token. A query key must never become a header.
    """
    if mcp_query_key(credentials) is not None:
        return None
    token = credentials.access_token.get_secret_value()
    scheme = (credentials.metadata or {}).get("mcp_auth_scheme")
    if scheme in {"bearer", "basic"}:
        return token
    if scheme == "header":
        return token
    if token.startswith("Bearer "):
        return token
    return f"Bearer {token}"


def mcp_endpoint_auth(
    credentials: OAuth2Credentials, endpoint: str
) -> EndpointAuth:
    """Build the endpoint-bound delivery plan for a stored MCP credential."""
    metadata = credentials.metadata or {}
    scheme = metadata.get("mcp_auth_scheme") or "oauth"
    parameter = metadata.get("mcp_auth_parameter")
    if parameter is not None and (
        not isinstance(parameter, str) or not _AUTH_PARAMETER.fullmatch(parameter)
    ):
        raise ValueError("Stored MCP credential has an invalid delivery parameter")
    if scheme == "query_key":
        return EndpointAuth(
            endpoint=endpoint,
            token=credentials.access_token,
            query=parameter if isinstance(parameter, str) and parameter else "key",
        )
    if scheme == "header":
        return EndpointAuth(
            endpoint=endpoint,
            token=credentials.access_token,
            header=parameter if isinstance(parameter, str) and parameter else "Authorization",
            prefix=str(metadata.get("mcp_auth_prefix") or ""),
        )
    prefix = "Basic " if scheme == "basic" else "Bearer "
    token = credentials.access_token
    value = token.get_secret_value()
    if value.startswith(prefix):
        token = SecretStr(value.removeprefix(prefix))
    return EndpointAuth(
        endpoint=endpoint,
        token=token,
        header="Authorization",
        prefix=prefix,
    )


def has_mcp_endpoint_auth(credentials: OAuth2Credentials) -> bool:
    """Whether this row uses a declaration-driven delivery target.

    Older query-key rows do not have ``mcp_auth_parameter`` because the only
    supported destination used to be ``key``.  Treat those rows as the same
    declaration with the historical default so they continue working without
    taking the legacy DingTalk-only client path.
    """
    metadata = credentials.metadata or {}
    return metadata.get("mcp_auth_scheme") in {"query_key", "header"}


def mcp_client_for_credential(
    endpoint: str, credentials: OAuth2Credentials, *, follow_redirects: bool = False
) -> MCPClient:
    """Open a client using the credential's declared delivery plan."""
    if has_mcp_endpoint_auth(credentials):
        return MCPClient(
            endpoint,
            endpoint_auth=mcp_endpoint_auth(credentials, endpoint),
            follow_redirects=follow_redirects,
        )
    authorization = mcp_authorization_header(credentials)
    query_key = mcp_query_key(credentials)
    if query_key is not None:
        return MCPClient(
            endpoint,
            query_key=query_key,
            follow_redirects=follow_redirects,
        )
    return MCPClient(endpoint, authorization=authorization, follow_redirects=follow_redirects)


def parse_mcp_content(
    content: list[dict[str, Any]],
    structured_content: Any = None,
) -> Any:
    """Parse MCP tool response content into a plain Python value.

    - text items: parsed as JSON when possible, kept as str otherwise
    - image items: kept as ``{type, data, mimeType}`` dict for frontend rendering
    - resource items: unwrapped to their resource payload dict

    ``structured_content`` (any JSON value, even an empty one) stands in for
    the text when a tool sends structured content and no text, beside any
    image and resource items.  Text wins when both are sent: FastMCP sends a
    ``-> int`` tool's ``3`` as the text ``"3"`` with ``{"result": 3}`` as
    structured content.

    Single-item responses are unwrapped from the list; multiple items are
    returned as a list; empty content returns ``None``.
    """
    use_structured = structured_content is not None and not any(
        item.get("type") == "text" and item.get("text") for item in content
    )
    output_parts: list[Any] = [structured_content] if use_structured else []
    for item in content:
        item_type = item.get("type")
        if item_type == "text" and not use_structured:
            text = item.get("text", "")
            try:
                output_parts.append(json.loads(text))
            except (json.JSONDecodeError, ValueError):
                output_parts.append(text)
        elif item_type == "image":
            output_parts.append(
                {
                    "type": "image",
                    "data": item.get("data"),
                    "mimeType": item.get("mimeType"),
                }
            )
        elif item_type == "resource":
            output_parts.append(item.get("resource", {}))

    if len(output_parts) == 1:
        return output_parts[0]
    return output_parts or None


async def invalidate_mcp_credential(user_id: str, credential_id: str) -> None:
    """Delete a stored MCP credential that the server just rejected.

    Called from the copilot's ``run_mcp_tool`` path when an MCP server
    returns 401/403 with a credential we *do* have on file — meaning the
    token was revoked or expired server-side without our local
    ``access_token_expires_at`` knowing.  Removing the dead row prevents
    ``auto_lookup_mcp_credential`` from feeding the same stale token back
    on the next attempt and lets the user re-auth cleanly via the setup
    card.  Failures are swallowed (best-effort) — the worst case is a
    second loop through the same code path, which still surfaces the
    setup card.
    """
    try:
        mgr = IntegrationCredentialsManager()
        # Go through ``mgr.delete`` (not ``store.delete_creds_by_id``) so the
        # per-credential lock + ``_invoke_creds_changed_hook`` fire — the hook
        # evicts any cached provider token for the user.
        await mgr.delete(user_id, credential_id)
        logger.info("Invalidated stale MCP credential %s", credential_id)
    except ValueError:
        # ``mgr.delete`` raises ``ValueError`` when the credential is
        # already gone (e.g. the user deleted it manually in Settings
        # between the ``auto_lookup_mcp_credential`` call and now).  Not
        # a problem — the goal was "this row should not exist" and it
        # doesn't.  Demote to debug so we don't spam warnings on retries.
        logger.debug("MCP credential %s already gone during invalidate", credential_id)
    except Exception:
        logger.warning(
            "Failed to invalidate stale MCP credential %s",
            credential_id,
            exc_info=True,
        )


async def auto_lookup_mcp_credential(
    user_id: str,
    server_url: str,
    allowed_ids: set[str] | None = None,
    *,
    match_catalog: bool = False,
) -> OAuth2Credentials | None:
    """Look up the best stored MCP credential for *server_url*.

    The caller should pass a **normalized** URL (via :func:`normalize_mcp_url`)
    so the comparison with ``mcp_server_url`` in credential metadata matches.

    ``allowed_ids`` narrows the candidates before ranking, so an expert whose
    grant is outranked by an ungranted row still gets the one it may use.

    Returns the credential with the latest ``access_token_expires_at``, refreshed
    if it can expire and needs it, or ``None`` when no match is found.

    A failed refresh also yields ``None``, deliberately. Returning the stale
    access token instead would earn a 401 from the server, and the caller
    treats a 401 on a credential it *has* as proof the token is dead — so a
    transient outage at the provider's token endpoint would delete a row whose
    refresh token is still perfectly good.
    """
    try:
        mgr = IntegrationCredentialsManager()
        mcp_creds = await mgr.store.get_creds_by_provider(
            user_id, ProviderName.MCP.value
        )

        # Best match: a manually pasted credential outranks an OAuth row, then
        # the latest expiry, then the last row in iteration order.
        def rank(cred: OAuth2Credentials) -> tuple[int, float]:
            return (
                1 if is_manual_mcp_credential(cred) else 0,
                cred.access_token_expires_at or 0,
            )

        best: OAuth2Credentials | None = None
        for cred in mcp_creds:
            if (
                isinstance(cred, OAuth2Credentials)
                and not (cred.metadata or {}).get("mcp_isolated")
                and (allowed_ids is None or cred.id in allowed_ids)
            ):
                if (cred.metadata or {}).get("mcp_server_url") != server_url:
                    entry = (
                        bound_query_key_catalog_entry(cred) if match_catalog else None
                    )
                    if not entry or entry.mcp_server.server_url != server_url:
                        continue
                if best is None or rank(cred) >= rank(best):
                    best = cred
        # Manual credentials have no token endpoint to refresh against.
        if best and not is_manual_mcp_credential(best):
            best = await mgr.refresh_if_needed(user_id, best)
        if best:
            logger.info("Auto-resolved MCP credential %s for %s", best.id, server_url)
        return best
    except Exception:
        logger.warning("Auto-lookup MCP credential failed", exc_info=True)
        return None
