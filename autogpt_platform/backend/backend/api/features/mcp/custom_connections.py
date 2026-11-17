from typing import Annotated, Literal
from urllib.parse import urlsplit
from uuid import uuid4

import fastapi
from autogpt_libs.auth import get_user_id
from fastapi import Security
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.blocks.mcp.helpers import normalize_mcp_url
from backend.data import db
from backend.data.model import OAuth2Credentials
from backend.integrations.credentials_store import provider_matches
from backend.integrations.creds_manager import IntegrationCredentialsManager
from backend.integrations.providers import ProviderName
from backend.util import request

router = fastapi.APIRouter()


class ConnectionInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    server_url: str = Field(min_length=1, max_length=2048)
    auth_type: Literal["none", "oauth", "bearer", "basic"]
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
    auth_type: Literal["none", "oauth", "bearer", "basic"] = Field(
        validation_alias="authType", serialization_alias="auth_type"
    )
    credential_id: str | None = Field(
        default=None,
        validation_alias="credentialId",
        serialization_alias="credential_id",
    )


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
        scheme = (credential.metadata or {}).get("mcp_auth_scheme")
        if data.auth_type in ("basic", "bearer") and scheme != data.auth_type:
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
    data: ConnectionInput, user_id: Annotated[str, Security(get_user_id)]
):
    url = await validate_connection(user_id, data)
    rows = await db.query_raw_with_schema(
        'INSERT INTO {schema_prefix}"CustomMCPConnection" '
        '("id", "userId", "name", "description", "serverUrl", "authType", "credentialId", "enabled", "updatedAt") '
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP) RETURNING *",
        str(uuid4()),
        user_id,
        data.name,
        data.description,
        url,
        data.auth_type,
        data.credential_id,
        data.enabled,
    )
    return ConnectionResponse.model_validate(rows[0])


@router.get(
    "/connections",
    response_model=list[ConnectionResponse],
    response_model_by_alias=False,
)
async def list_connections(user_id: Annotated[str, Security(get_user_id)]):
    rows = await db.query_raw_with_schema(
        'SELECT * FROM {schema_prefix}"CustomMCPConnection" WHERE "userId" = $1 ORDER BY "createdAt"',
        user_id,
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
):
    if not data.enabled:
        existing = await db.query_raw_with_schema(
            'SELECT * FROM {schema_prefix}"CustomMCPConnection" WHERE "id"=$1 AND "userId"=$2',
            connection_id,
            user_id,
        )
        if not existing:
            raise fastapi.HTTPException(404, "Connection not found")
        current = ConnectionResponse.model_validate(existing[0])
        if (
            normalize_mcp_url(data.server_url) == current.server_url
            and data.auth_type == current.auth_type
            and data.credential_id == current.credential_id
        ):
            rows = await db.query_raw_with_schema(
                'UPDATE {schema_prefix}"CustomMCPConnection" SET "name"=$3, "description"=$4, "enabled"=false, "updatedAt"=CURRENT_TIMESTAMP '
                'WHERE "id"=$1 AND "userId"=$2 RETURNING *',
                connection_id,
                user_id,
                data.name,
                data.description,
            )
            if not rows:
                raise fastapi.HTTPException(404, "Connection not found")
            return ConnectionResponse.model_validate(rows[0])
    url = await validate_connection(user_id, data)
    rows = await db.query_raw_with_schema(
        'UPDATE {schema_prefix}"CustomMCPConnection" SET "name"=$3, "description"=$4, "serverUrl"=$5, '
        '"authType"=$6, "credentialId"=$7, "enabled"=$8, "updatedAt"=CURRENT_TIMESTAMP '
        'WHERE "id"=$1 AND "userId"=$2 RETURNING *',
        connection_id,
        user_id,
        data.name,
        data.description,
        url,
        data.auth_type,
        data.credential_id,
        data.enabled,
    )
    if not rows:
        raise fastapi.HTTPException(404, "Connection not found")
    return ConnectionResponse.model_validate(rows[0])


@router.delete("/connections/{connection_id}", status_code=204)
async def delete_connection(
    connection_id: str, user_id: Annotated[str, Security(get_user_id)]
):
    count = await db.execute_raw_with_schema(
        'DELETE FROM {schema_prefix}"CustomMCPConnection" WHERE "id"=$1 AND "userId"=$2',
        connection_id,
        user_id,
    )
    if not count:
        raise fastapi.HTTPException(404, "Connection not found")
