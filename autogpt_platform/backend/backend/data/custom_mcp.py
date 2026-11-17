from backend.data import db


async def list_custom_mcp_connections(user_id: str) -> list[dict]:
    return await db.query_raw_with_schema(
        'SELECT "id", "name", "description", "serverUrl", "credentialId", "enabled" FROM {schema_prefix}"CustomMCPConnection" '
        'WHERE "userId"=$1 ORDER BY "createdAt"',
        user_id,
    )


async def get_custom_mcp_connection(user_id: str, connection_id: str) -> dict | None:
    rows = await db.query_raw_with_schema(
        'SELECT "id", "name", "description", "serverUrl", "credentialId", "enabled" FROM {schema_prefix}"CustomMCPConnection" '
        'WHERE "id"=$1 AND "userId"=$2',
        connection_id,
        user_id,
    )
    return rows[0] if rows else None
