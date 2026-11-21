"""Owner-private MCP connections; a missing tenant means only the owner's personal org."""

from uuid import uuid4

from backend.data import db
from backend.util.encryption import JSONCryptor


_SCOPE = '''WITH memberships AS (
    SELECT org.id, (org."isPersonal" AND member."isOwner") AS personal
    FROM {schema_prefix}"Organization" org JOIN {schema_prefix}"OrgMember" member ON member."orgId"=org.id
    WHERE member."userId"=$1 AND member.status='ACTIVE' AND org."deletedAt" IS NULL AND org."archivedAt" IS NULL
), personal AS (SELECT MIN(id) AS id FROM memberships WHERE personal HAVING COUNT(*)=1),
scope AS (SELECT id, id IN (SELECT id FROM personal) AS personal FROM memberships
          WHERE id=COALESCE(CAST($2 AS TEXT), (SELECT id FROM personal))) '''

_CONNECTIONS = ''' scoped_connections AS (
    SELECT connection.* FROM {schema_prefix}"CustomMCPConnection" connection JOIN scope ON
        (connection."organizationId"=scope.id OR (scope.personal AND connection."organizationId" IS NULL))
    WHERE connection."userId"=$1) '''

_EXPERT = ''' scoped_expert AS (
    SELECT expert.id FROM {schema_prefix}"Expert" expert JOIN scope ON
        (expert."organizationId"=scope.id OR (scope.personal AND expert."organizationId" IS NULL))
    WHERE expert.id=$3 AND expert."ownerUserId"=$1 AND NOT expert."isArchived" AND NOT expert."isTemplate") '''

_GRANT_SCOPE = _SCOPE + ',' + _CONNECTIONS + ',' + _EXPERT


async def resolve_mcp_organization(user_id: str, organization_id: str | None = None) -> str | None:
    rows = await db.query_raw_with_schema(_SCOPE + 'SELECT id FROM scope', user_id, organization_id)
    return rows[0]['id'] if rows else None


async def list_custom_mcp_connections(user_id: str, organization_id: str | None = None) -> list[dict]:
    return await db.query_raw_with_schema(_SCOPE + ',' + _CONNECTIONS + 'SELECT * FROM scoped_connections ORDER BY "createdAt", id', user_id, organization_id)


async def get_custom_mcp_connection(user_id: str, connection_id: str, organization_id: str | None = None) -> dict | None:
    rows = await db.query_raw_with_schema(_SCOPE + ',' + _CONNECTIONS + 'SELECT * FROM scoped_connections WHERE id=$3', user_id, organization_id, connection_id)
    return rows[0] if rows else None


async def list_expert_mcp_connection_ids(user_id: str, expert_id: str, organization_id: str | None = None) -> list[str]:
    rows = await db.query_raw_with_schema(_GRANT_SCOPE + '''SELECT connection.id FROM {schema_prefix}"ExpertMCPConnectionGrant" permission
        JOIN scope ON scope.id=permission."organizationId" JOIN scoped_expert expert ON expert.id=permission."expertId"
        JOIN scoped_connections connection ON connection.id=permission."connectionId" ORDER BY connection.id''', user_id, organization_id, expert_id)
    return [row['id'] for row in rows]


async def grant_expert_mcp_connection(user_id: str, expert_id: str, connection_id: str, organization_id: str | None = None) -> bool:
    rows = await db.query_raw_with_schema(_GRANT_SCOPE + '''INSERT INTO {schema_prefix}"ExpertMCPConnectionGrant" ("expertId", "connectionId", "organizationId")
        SELECT scoped_expert.id, scoped_connections.id, scope.id FROM scoped_expert, scoped_connections, scope WHERE scoped_connections.id=$4 AND scoped_connections.enabled
        ON CONFLICT ("expertId", "connectionId") DO UPDATE SET "organizationId"=EXCLUDED."organizationId"
        WHERE "ExpertMCPConnectionGrant"."organizationId"=EXCLUDED."organizationId" RETURNING "connectionId"''', user_id, organization_id, expert_id, connection_id)
    return bool(rows)


async def revoke_expert_mcp_connection(user_id: str, expert_id: str, connection_id: str, organization_id: str | None = None) -> bool:
    rows = await db.query_raw_with_schema(_GRANT_SCOPE + '''DELETE FROM {schema_prefix}"ExpertMCPConnectionGrant" WHERE
        "expertId" IN (SELECT id FROM scoped_expert) AND "connectionId" IN (SELECT id FROM scoped_connections WHERE id=$4)
        AND "organizationId" IN (SELECT id FROM scope) RETURNING "connectionId"''', user_id, organization_id, expert_id, connection_id)
    return bool(rows)


async def create_catalog_mcp_connection(user_id: str, connector_id: str, method_id: str, definition_version: int, server_url: str, credential_id: str | None, name: str, auth_type: str, organization_id: str | None = None) -> dict:
    if not connector_id or not method_id or definition_version < 1 or (auth_type == 'none') != (credential_id is None):
        raise ValueError('Invalid catalog connection binding')
    org = await resolve_mcp_organization(user_id, organization_id)
    if org is None:
        raise ValueError('No active organization for this connection')
    encrypted = None
    if credential_id is not None:
        rows = await db.query_raw_with_schema(_SCOPE + '''SELECT cred."encryptedPayload" FROM {schema_prefix}"IntegrationCredential" cred, scope
            WHERE cred.id=$3 AND cred."ownerType"='USER' AND cred."ownerId"=$1 AND cred.status='active' AND cred.provider IN ('mcp','ProviderName.MCP')
            AND (cred."organizationId"=scope.id OR cred."organizationId" IN (SELECT id FROM personal))''', user_id, org, credential_id)
        if not rows:
            raise ValueError('Credential does not belong to this connection')
        encrypted = rows[0]['encryptedPayload']
        payload = JSONCryptor().decrypt(encrypted)
        metadata = payload.get('metadata') or {}
        expected = {'mcp_catalog_id': connector_id, 'mcp_method_id': method_id, 'mcp_definition_version': definition_version, 'mcp_organization_id': org, 'mcp_server_url': server_url}
        if payload.get('id') != credential_id or any(metadata.get(key) != value for key, value in expected.items()):
            raise ValueError('Credential does not match the sealed connection binding')
    return await _insert_connection(user_id, org, name, '', server_url, auth_type, credential_id, True, connector_id, method_id, definition_version, encrypted)


async def create_custom_mcp_connection(user_id: str, name: str, description: str, server_url: str, auth_type: str, credential_id: str | None, enabled: bool, organization_id: str | None = None) -> dict:
    org = await resolve_mcp_organization(user_id, organization_id)
    if org is None:
        raise ValueError('No active organization for this connection')
    encrypted = await _credential_payload(user_id, org, credential_id)
    return await _insert_connection(user_id, org, name, description, server_url, auth_type, credential_id, enabled, None, None, None, encrypted)


async def _insert_connection(user_id: str, organization_id: str | None, name: str, description: str, server_url: str, auth_type: str, credential_id: str | None, enabled: bool, connector_id: str | None, method_id: str | None, definition_version: int | None, encrypted: str | None) -> dict:
    rows = await db.query_raw_with_schema(_SCOPE + '''INSERT INTO {schema_prefix}"CustomMCPConnection"
        (id,"userId","organizationId",name,description,"serverUrl","authType","credentialId",enabled,"connectorId","methodId","definitionVersion","updatedAt")
        SELECT $3,$1,scope.id,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_TIMESTAMP FROM scope
        WHERE CAST($8 AS TEXT) IS NULL OR EXISTS (SELECT 1 FROM {schema_prefix}"IntegrationCredential" cred WHERE cred.id=$8
            AND cred."ownerType"='USER' AND cred."ownerId"=$1 AND cred.status='active' AND cred.provider IN ('mcp','ProviderName.MCP')
            AND ((CAST($10 AS TEXT) IS NULL AND scope.personal AND cred."organizationId"=scope.id) OR
            (cred."encryptedPayload"=$13 AND (cred."organizationId"=scope.id OR cred."organizationId" IN (SELECT id FROM personal))))) RETURNING *''',
        user_id, organization_id, str(uuid4()), name, description, server_url, auth_type, credential_id, enabled, connector_id, method_id, definition_version, encrypted)
    if not rows:
        raise ValueError('Connection scope or credential no longer available')
    return rows[0]


async def update_custom_mcp_connection(user_id: str, connection_id: str, name: str, description: str, server_url: str, auth_type: str, credential_id: str | None, enabled: bool, revision: int, organization_id: str | None = None) -> dict | None:
    org = await resolve_mcp_organization(user_id, organization_id)
    if org is None:
        return None
    encrypted = await _credential_payload(user_id, org, credential_id)
    rows = await db.query_raw_with_schema(_SCOPE + ',' + _CONNECTIONS + '''UPDATE {schema_prefix}"CustomMCPConnection"
        SET name=$4, description=$5, "serverUrl"=$6, "authType"=$7, "credentialId"=$8, enabled=$9, revision=revision+1, "updatedAt"=CURRENT_TIMESTAMP
        WHERE id=$3 AND id IN (SELECT id FROM scoped_connections) AND revision=$10
        AND (CAST($8 AS TEXT) IS NULL OR EXISTS (SELECT 1 FROM {schema_prefix}"IntegrationCredential" cred WHERE cred.id=$8
            AND cred."ownerType"='USER' AND cred."ownerId"=$1 AND cred.status='active' AND cred.provider IN ('mcp','ProviderName.MCP')
            AND (cred."encryptedPayload"=$11 AND (cred."organizationId"=scope.id OR cred."organizationId" IN (SELECT id FROM personal))))) RETURNING *''', user_id, org, connection_id, name, description, server_url, auth_type, credential_id, enabled, revision, encrypted)
    return rows[0] if rows else None


async def disable_custom_mcp_connection(
    user_id: str,
    connection_id: str,
    name: str,
    description: str,
    revision: int,
    organization_id: str | None = None,
) -> dict | None:
    rows = await db.query_raw_with_schema(
        _SCOPE
        + ','
        + _CONNECTIONS
        + '''UPDATE {schema_prefix}"CustomMCPConnection"
        SET name=$4, description=$5, enabled=false, revision=revision+1,
            "updatedAt"=CURRENT_TIMESTAMP
        WHERE id=$3 AND id IN (SELECT id FROM scoped_connections) AND revision=$6
        RETURNING *''',
        user_id,
        organization_id,
        connection_id,
        name,
        description,
        revision,
    )
    return rows[0] if rows else None


async def delete_custom_mcp_connection(user_id: str, connection_id: str, organization_id: str | None = None) -> bool:
    if organization_id is None:
        count = await db.execute_raw_with_schema(
            'DELETE FROM {schema_prefix}"CustomMCPConnection" WHERE id=$1 AND "userId"=$2',
            connection_id,
            user_id,
        )
        return bool(count)
    count = await db.execute_raw_with_schema(
        _SCOPE
        + ','
        + _CONNECTIONS
        + '''DELETE FROM {schema_prefix}"CustomMCPConnection"
        WHERE id=$3 AND id IN (SELECT id FROM scoped_connections)''',
        user_id,
        organization_id,
        connection_id,
    )
    return bool(count)


async def _credential_payload(
    user_id: str, organization_id: str, credential_id: str | None
) -> str | None:
    if credential_id is None:
        return None
    rows = await db.query_raw_with_schema(
        _SCOPE
        + '''SELECT cred."encryptedPayload" FROM {schema_prefix}"IntegrationCredential" cred, scope
            WHERE cred.id=$3 AND cred."ownerType"='USER' AND cred."ownerId"=$1
            AND cred.status='active' AND cred.provider IN ('mcp','ProviderName.MCP')
            AND (cred."organizationId"=scope.id OR cred."organizationId" IN (SELECT id FROM personal))''',
        user_id,
        organization_id,
        credential_id,
    )
    if not rows:
        raise ValueError('Credential does not belong to this connection')
    return rows[0]['encryptedPayload']
