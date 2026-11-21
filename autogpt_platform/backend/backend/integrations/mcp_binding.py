from backend.data.model import Credentials, OAuth2Credentials
from backend.integrations.credentials_store import provider_matches
from backend.integrations.mcp_catalog import MCPCatalogEntry, get_mcp_catalog
from backend.integrations.mcp_methods import MCPMethod, method_endpoint


def query_key_catalog_method(
    catalog_id: object, server_url: object
) -> tuple[MCPCatalogEntry, MCPMethod] | None:
    if (
        not isinstance(catalog_id, str)
        or not isinstance(server_url, str)
    ):
        return None
    entry = next(
        (
            entry
            for entry in get_mcp_catalog()
            if entry.name == catalog_id
        ),
        None,
    )
    if entry is not None:
        try:
            method = next(
                method
                for method in entry.mcp_server.methods
                if method.auth_type == "query_key"
            )
            method_endpoint(entry.mcp_server, method, server_url)
        except (StopIteration, ValueError):
            return None
        return entry, method
    return None


def query_key_catalog_entry(
    catalog_id: object, server_url: object
) -> MCPCatalogEntry | None:
    result = query_key_catalog_method(catalog_id, server_url)
    return result[0] if result else None


def bound_query_key_catalog_entry(credential: Credentials) -> MCPCatalogEntry | None:
    if not isinstance(credential, OAuth2Credentials) or not provider_matches(
        credential.provider, "mcp"
    ):
        return None
    metadata = credential.metadata or {}
    if metadata.get("mcp_isolated") or metadata.get("mcp_auth_scheme") != "query_key":
        return None
    return query_key_catalog_entry(
        metadata.get("mcp_catalog_id"), metadata.get("mcp_server_url")
    )
