import sqlite3
from unittest.mock import patch

import pytest

from backend.data import custom_mcp


@pytest.fixture
def scoped_rows():
    """Exercise the parameterized access predicates without a service or live DB."""
    with sqlite3.connect(":memory:") as conn:
        conn.row_factory = sqlite3.Row
        conn.executescript('''
            CREATE TABLE Organization(id TEXT, isPersonal BOOLEAN, archivedAt TEXT, deletedAt TEXT);
            CREATE TABLE OrgMember(userId TEXT, orgId TEXT, status TEXT, isOwner BOOLEAN);
            CREATE TABLE CustomMCPConnection(id TEXT PRIMARY KEY, userId TEXT, organizationId TEXT,
              name TEXT, description TEXT DEFAULT '', serverUrl TEXT, credentialId TEXT, authType TEXT,
              connectorId TEXT, methodId TEXT, definitionVersion INTEGER, revision INTEGER DEFAULT 1,
              enabled BOOLEAN DEFAULT TRUE, createdAt TEXT, updatedAt TEXT);
            CREATE TABLE Expert(id TEXT, ownerUserId TEXT, organizationId TEXT, isArchived BOOLEAN DEFAULT FALSE, isTemplate BOOLEAN DEFAULT FALSE);
            CREATE TABLE ExpertMCPConnectionGrant(expertId TEXT, connectionId TEXT, organizationId TEXT, PRIMARY KEY(expertId, connectionId));
            CREATE TABLE IntegrationCredential(id TEXT, ownerType TEXT, ownerId TEXT, organizationId TEXT, status TEXT, provider TEXT);
            INSERT INTO Organization VALUES ('personal',TRUE,NULL,NULL), ('team',FALSE,NULL,NULL), ('away',FALSE,NULL,NULL);
            INSERT INTO OrgMember VALUES ('alice','personal','ACTIVE',TRUE), ('alice','team','ACTIVE',FALSE), ('alice','away','SUSPENDED',FALSE);
            INSERT INTO CustomMCPConnection(id,userId,organizationId) VALUES ('legacy','alice',NULL), ('p','alice','personal'), ('t','alice','team'), ('other','bob','team');
            INSERT INTO Expert(id,ownerUserId,organizationId) VALUES ('old','alice',NULL), ('expert','alice','team'), ('other','bob','team');
        ''')

        async def query(sql, *args):
            cursor = conn.execute(sql.format(schema_prefix=""), {str(idx): value for idx, value in enumerate(args, 1)})
            return [dict(row) for row in cursor.fetchall()]

        with patch.object(custom_mcp.db, "query_raw_with_schema", query):
            yield conn
    conn.close()


@pytest.mark.asyncio
async def test_scoped_reads(scoped_rows):
    assert {row['id'] for row in await custom_mcp.list_custom_mcp_connections('alice')} == {'p', 'legacy'}
    assert {row['id'] for row in await custom_mcp.list_custom_mcp_connections('alice', 'team')} == {'t'}
    assert await custom_mcp.get_custom_mcp_connection('alice', 't') is None
    assert await custom_mcp.get_custom_mcp_connection('alice', 'other', 'team') is None
    assert not await custom_mcp.list_custom_mcp_connections('alice', 'away')


@pytest.mark.asyncio
async def test_expert_grants_are_explicit_and_tenant_scoped(scoped_rows):
    grant = custom_mcp.grant_expert_mcp_connection
    ids = custom_mcp.list_expert_mcp_connection_ids
    assert not await ids('alice', 'expert', 'team')
    assert not await grant('alice', 'old', 't', 'team')
    assert not await grant('alice', 'expert', 'legacy', 'team')
    assert not await grant('alice', 'other', 't', 'team')
    assert not await grant('alice', 'expert', 'other', 'team')
    assert await grant('alice', 'expert', 't', 'team')
    assert await grant('alice', 'expert', 't', 'team')
    assert await ids('alice', 'expert', 'team') == ['t']
    assert not await ids('alice', 'expert')
    assert await grant('alice', 'old', 'legacy')
    assert await ids('alice', 'old') == ['legacy']
    assert not await custom_mcp.revoke_expert_mcp_connection('alice', 'expert', 't', 'personal')
    assert await custom_mcp.revoke_expert_mcp_connection('alice', 'expert', 't', 'team')
    assert not await ids('alice', 'expert', 'team')
