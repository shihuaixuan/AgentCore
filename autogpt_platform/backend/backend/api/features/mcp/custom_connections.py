import asyncio
from typing import Annotated, Literal
from urllib.parse import urlsplit

import fastapi
from autogpt_libs.auth import RequestContext, get_request_context, get_user_id
from autogpt_libs.auth.jwt_utils import bearer_jwt_auth, get_jwt_payload
from fastapi import Security
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.blocks.mcp.helpers import catalog_mcp_client
from backend.blocks.mcp.helpers import normalize_mcp_url
from backend.data import custom_mcp
from backend.data.model import OAuth2Credentials
from backend.integrations.credentials_store import provider_matches
from backend.integrations.creds_manager import IntegrationCredentialsManager
from backend.integrations.providers import ProviderName
from backend.util import request
from backend.integrations.mcp_catalog import get_mcp_catalog
from backend.integrations.mcp_methods import prepare_method, resolve_method

router = fastapi.APIRouter()
_CATALOG_PROBE_TIMEOUT_SECONDS = 10


class ConnectionInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    server_url: str = Field(min_length=1, max_length=2048)
    auth_type: Literal["none", "oauth", "bearer", "basic", "header", "query_key"]
    credential_id: str | None = None
    enabled: bool = True

    @model_validator(mode="after")
    def validate_auth(self):
        self.name = self.name.strip()
        if not self.name:
            raise ValueError("Name is required")
        if (self.auth_type == "none") != (self.credential_id is None):
            raise ValueError("Select credentials for the chosen authentication method")
        if self.credential_id is not None and not self.credential_id.strip():
            raise ValueError("Select a valid credential")
        return self


class ConnectionResponse(ConnectionInput):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    server_url: str = Field(
        validation_alias="serverUrl", serialization_alias="server_url"
    )
    auth_type: Literal["none", "oauth", "bearer", "basic", "header", "query_key"] = Field(
        validation_alias="authType", serialization_alias="auth_type"
    )
    credential_id: str | None = Field(
        default=None,
        validation_alias="credentialId",
        serialization_alias="credential_id",
    )
    connector_id: str | None = Field(default=None, validation_alias="connectorId", serialization_alias="connector_id")
    method_id: str | None = Field(default=None, validation_alias="methodId", serialization_alias="method_id")
    definition_version: int | None = Field(default=None, validation_alias="definitionVersion", serialization_alias="definition_version")
    revision: int = 1


class CatalogConnectionInput(BaseModel):
    connector_id: str = Field(min_length=1, max_length=128)
    method_id: str = Field(min_length=1, max_length=128)
    values: dict[str, str] = Field(default_factory=dict)
    server_url: str | None = Field(default=None, max_length=2048)
    credential_id: str | None = Field(default=None, max_length=256)
    name: str | None = Field(default=None, max_length=120)


async def _catalog_entry(connector_id: str):
    entry = next((item for item in get_mcp_catalog() if item.name == connector_id), None)
    if entry is None:
        raise fastapi.HTTPException(404, "MCP connector not found")
    return entry


async def _catalog_context(request: fastapi.Request) -> RequestContext:
    return await get_request_context(request)


async def _optional_connection_context(
    request: fastapi.Request,
) -> RequestContext | None:
    if not request.headers.get("authorization"):
        return None
    payload = await get_jwt_payload(await bearer_jwt_auth(request))
    return await get_request_context(request, payload)


async def _catalog_connection_response(row: dict) -> ConnectionResponse:
    return ConnectionResponse.model_validate(row)


async def _verify_catalog_connection(
    entry, method_id: str, server_url: str, secret
) -> None:
    client = catalog_mcp_client(entry.mcp_server, method_id, server_url, secret)
    try:
        await asyncio.wait_for(client.initialize(), timeout=_CATALOG_PROBE_TIMEOUT_SECONDS)
        await asyncio.wait_for(client.list_tools(), timeout=_CATALOG_PROBE_TIMEOUT_SECONDS)
    except Exception:
        raise fastapi.HTTPException(502, "Could not verify the MCP connection.") from None
    finally:
        try:
            await asyncio.wait_for(client.close(), timeout=5)
        except Exception:
            pass


@router.post(
    "/catalog-connections",
    response_model=ConnectionResponse,
    response_model_by_alias=False,
)
async def create_catalog_connection(
    data: CatalogConnectionInput,
    user_id: Annotated[str, Security(get_user_id)],
    context: Annotated[RequestContext, Security(get_request_context)],
):
    entry = await _catalog_entry(data.connector_id)
    try:
        method = resolve_method(entry.mcp_server, data.method_id)
        prepared = prepare_method(
            entry.mcp_server,
            data.method_id,
            server_url=data.server_url,
            values=data.values,
        )
    except ValueError as exc:
        raise fastapi.HTTPException(400, str(exc)) from exc
    if method.kind == "none" and data.credential_id is not None:
        raise fastapi.HTTPException(400, "Public MCP methods do not accept credentials")
    credential = None
    if method.kind != "none" and data.credential_id is None:
        if prepared.secret is None:
            raise fastapi.HTTPException(400, "A credential is required")
    if data.credential_id is not None:
        credential = await IntegrationCredentialsManager().get(user_id, data.credential_id)
        if not isinstance(credential, OAuth2Credentials) or not provider_matches(
            credential.provider, ProviderName.MCP.value
        ):
            raise fastapi.HTTPException(400, "The selected credential is unavailable")
        credential_metadata = credential.metadata or {}
        expected_metadata = {
            "mcp_catalog_id": entry.name,
            "mcp_method_id": method.id,
            "mcp_definition_version": entry.mcp_server.definition_version,
            "mcp_organization_id": context.org_id,
            "mcp_server_url": prepared.server_url,
        }
        if (
            credential_metadata.get("mcp_isolated") is not True
            or any(
                credential_metadata.get(key) != value
                for key, value in expected_metadata.items()
            )
        ):
            raise fastapi.HTTPException(
                400, "The selected credential is not bound to this MCP method"
            )
        if normalize_mcp_url(credential_metadata.get("mcp_server_url", "")) != normalize_mcp_url(prepared.server_url):
            raise fastapi.HTTPException(400, "The selected credential does not belong to this MCP endpoint")
        secret = credential.access_token
    else:
        secret = prepared.secret

    await _verify_catalog_connection(entry, method.id, prepared.server_url, secret)

    if data.credential_id is None and method.kind != "none":
        credential = OAuth2Credentials(
            provider=ProviderName.MCP.value,
            title=f"MCP: {entry.display_name}",
            access_token=prepared.secret,
            scopes=[],
            metadata={
                "mcp_server_url": prepared.server_url,
                "mcp_auth_scheme": method.auth_type,
                "mcp_isolated": True,
                "mcp_catalog_id": entry.name,
                "mcp_method_id": method.id,
                "mcp_definition_version": entry.mcp_server.definition_version,
                "mcp_organization_id": context.org_id,
            },
        )
        await IntegrationCredentialsManager().create(user_id, credential)
        data.credential_id = credential.id
    if data.credential_id is not None:
        assert credential is not None
        credential_metadata = credential.metadata or {}
        metadata = {
            **credential_metadata,
            "mcp_isolated": True,
            "mcp_catalog_id": entry.name,
            "mcp_method_id": method.id,
            "mcp_definition_version": entry.mcp_server.definition_version,
            "mcp_organization_id": context.org_id,
            "mcp_server_url": prepared.server_url,
            "mcp_auth_scheme": method.auth_type,
        }
        await IntegrationCredentialsManager().update(
            user_id, credential.model_copy(update={"metadata": metadata})
        )
    try:
        row = await __import__("backend.data.custom_mcp", fromlist=["create_catalog_mcp_connection"]).create_catalog_mcp_connection(
            user_id,
            entry.name,
            method.id,
            entry.mcp_server.definition_version,
            prepared.server_url,
            data.credential_id,
            data.name or entry.display_name,
            method.auth_type,
            context.org_id,
        )
    except ValueError as exc:
        raise fastapi.HTTPException(400, str(exc)) from exc
    return await _catalog_connection_response(row)


@router.get(
    "/connections/expert/{expert_id}",
    response_model=list[str],
)
async def list_expert_connection_ids(
    expert_id: str,
    user_id: Annotated[str, Security(get_user_id)],
    context: Annotated[RequestContext, Security(get_request_context)],
):
    from backend.data.custom_mcp import list_expert_mcp_connection_ids

    return await list_expert_mcp_connection_ids(user_id, expert_id, context.org_id)


@router.put("/connections/expert/{expert_id}/{connection_id}", status_code=204)
async def grant_expert_connection(
    expert_id: str,
    connection_id: str,
    user_id: Annotated[str, Security(get_user_id)],
    context: Annotated[RequestContext, Security(get_request_context)],
):
    from backend.data.custom_mcp import grant_expert_mcp_connection

    if not await grant_expert_mcp_connection(user_id, expert_id, connection_id, context.org_id):
        raise fastapi.HTTPException(404, "Connection or expert not found")


@router.delete("/connections/expert/{expert_id}/{connection_id}", status_code=204)
async def revoke_expert_connection(
    expert_id: str,
    connection_id: str,
    user_id: Annotated[str, Security(get_user_id)],
    context: Annotated[RequestContext, Security(get_request_context)],
):
    from backend.data.custom_mcp import revoke_expert_mcp_connection

    if not await revoke_expert_mcp_connection(user_id, expert_id, connection_id, context.org_id):
        raise fastapi.HTTPException(404, "Connection grant not found")


async def validate_connection(user_id: str, data: ConnectionInput) -> str:
    url = normalize_mcp_url(data.server_url)
    try:
        parsed = urlsplit(url)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise fastapi.HTTPException(400, "Invalid server URL.") from exc
    if (
        parsed.scheme != "https"
        or not hostname
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
        or (port is not None and not 0 < port < 65536)
    ):
        raise fastapi.HTTPException(
            400,
            "Use an HTTPS server URL without credentials, query parameters or a fragment.",
        )
    try:
        await request.validate_url_host(url)
    except ValueError as exc:
        raise fastapi.HTTPException(400, f"Invalid server URL: {exc}") from exc
    if data.credential_id:
        credential = await IntegrationCredentialsManager().get(
            user_id, data.credential_id
        )
        if (
            not isinstance(credential, OAuth2Credentials)
            or not provider_matches(credential.provider, ProviderName.MCP.value)
            or normalize_mcp_url((credential.metadata or {}).get("mcp_server_url", ""))
            != url
        ):
            raise fastapi.HTTPException(
                400, "The selected credential does not belong to this server."
            )
        if (credential.metadata or {}).get("mcp_method_id"):
            raise fastapi.HTTPException(
                400, "Use the catalog connection flow for this credential."
            )
        scheme = (credential.metadata or {}).get("mcp_auth_scheme")
        if data.auth_type != "oauth" and scheme != data.auth_type:
            raise fastapi.HTTPException(
                400, "The selected credential uses a different authentication method."
            )
        if data.auth_type == "oauth" and scheme:
            raise fastapi.HTTPException(
                400, "The selected credential uses a different authentication method."
            )
    return url


@router.post(
    "/connections", response_model=ConnectionResponse, response_model_by_alias=False
)
async def create_connection(
    data: ConnectionInput,
    user_id: Annotated[str, Security(get_user_id)],
    context: Annotated[RequestContext | None, fastapi.Depends(_optional_connection_context)],
):
    url = await validate_connection(user_id, data)
    try:
        row = await custom_mcp.create_custom_mcp_connection(
            user_id,
            data.name,
            data.description,
            url,
            data.auth_type,
            data.credential_id,
            data.enabled,
            context.org_id if context else None,
        )
    except ValueError as exc:
        raise fastapi.HTTPException(400, str(exc)) from exc
    return ConnectionResponse.model_validate(row)


@router.get(
    "/connections",
    response_model=list[ConnectionResponse],
    response_model_by_alias=False,
)
async def list_connections(
    user_id: Annotated[str, Security(get_user_id)],
    context: Annotated[RequestContext | None, fastapi.Depends(_optional_connection_context)],
):
    rows = await custom_mcp.list_custom_mcp_connections(
        user_id, context.org_id if context else None
    )
    return [ConnectionResponse.model_validate(row) for row in rows]


@router.put(
    "/connections/{connection_id}",
    response_model=ConnectionResponse,
    response_model_by_alias=False,
)
async def update_connection(
    connection_id: str,
    data: ConnectionInput,
    user_id: Annotated[str, Security(get_user_id)],
    context: Annotated[RequestContext | None, fastapi.Depends(_optional_connection_context)] = None,
):
    organization_id = context.org_id if context else None
    if not data.enabled:
        existing = await custom_mcp.get_custom_mcp_connection(
            user_id, connection_id, organization_id
        )
        if not existing:
            raise fastapi.HTTPException(404, "Connection not found")
        current = ConnectionResponse.model_validate(existing)
        if (
            normalize_mcp_url(data.server_url) == current.server_url
            and data.auth_type == current.auth_type
            and data.credential_id == current.credential_id
        ):
            row = await custom_mcp.disable_custom_mcp_connection(
                user_id,
                connection_id,
                data.name,
                data.description,
                current.revision,
                organization_id,
            )
            if row is None:
                raise fastapi.HTTPException(404, "Connection not found")
            return ConnectionResponse.model_validate(row)
    url = await validate_connection(user_id, data)
    existing = await custom_mcp.get_custom_mcp_connection(
        user_id, connection_id, organization_id
    )
    if not existing:
        raise fastapi.HTTPException(404, "Connection not found")
    try:
        row = await custom_mcp.update_custom_mcp_connection(
            user_id,
            connection_id,
            data.name,
            data.description,
            url,
            data.auth_type,
            data.credential_id,
            data.enabled,
            existing.get("revision", 1),
            organization_id,
        )
    except ValueError as exc:
        raise fastapi.HTTPException(400, str(exc)) from exc
    if row is None:
        raise fastapi.HTTPException(409, "Connection changed. Reload and try again.")
    return ConnectionResponse.model_validate(row)


@router.delete("/connections/{connection_id}", status_code=204)
async def delete_connection(
    connection_id: str,
    user_id: Annotated[str, Security(get_user_id)],
    context: Annotated[RequestContext | None, fastapi.Depends(_optional_connection_context)],
):
    deleted = await custom_mcp.delete_custom_mcp_connection(
        user_id, connection_id, context.org_id if context else None
    )
    if not deleted:
        raise fastapi.HTTPException(404, "Connection not found")
