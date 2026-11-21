"""Black-box catalog journeys with a loopback-only MCP peer and synthetic identities."""

import asyncio
import json
import sqlite3
from contextlib import asynccontextmanager, closing
from unittest.mock import AsyncMock
from urllib.parse import parse_qsl, quote, urlsplit

import aiohttp
import fastapi
import httpx
import pytest
import pytest_asyncio
from aiohttp import web
from aiohttp.test_utils import TestServer
from autogpt_libs.auth import get_user_id
from autogpt_libs.auth.dependencies import get_request_context
from autogpt_libs.auth.models import RequestContext
from pydantic import SecretStr

from backend.blocks.mcp.client import MCPClient
from backend.blocks.mcp.protocol import MODERN_PROTOCOL_VERSION, MCPServerEraCache
from backend.api.features.mcp import routes
from backend.copilot.rate_limit import enforce_payment_paywall
from backend.data import custom_mcp, db
from backend.data.model import OAuth2Credentials
from backend.integrations import mcp_connections
from backend.integrations.credentials_store import IntegrationCredentialsStore
from backend.integrations.mcp_catalog import MCPCatalogEntry, get_mcp_catalog, set_mcp_catalog
from backend.util.encryption import JSONCryptor
from backend.util import request

MAIL = "mcp_dingtalk_mail"
KEY_URL = "https://mcp-gw.dingtalk.com/server/journey_test"
TOKEN = "journey-fixture+not/a=credential"
TOOL = {"name": "echo", "description": "Local echo", "inputSchema": {"type": "object"}}
HEADER_URL = "https://journey.example/mcp"


@pytest.fixture
def storage(monkeypatch):
    with closing(sqlite3.connect(":memory:")) as conn:
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
            CREATE TABLE IntegrationCredential(id TEXT, ownerType TEXT, ownerId TEXT, organizationId TEXT, status TEXT, provider TEXT, encryptedPayload TEXT);
            INSERT INTO Organization VALUES ('home',TRUE,NULL,NULL), ('away',FALSE,NULL,NULL);
            INSERT INTO OrgMember VALUES ('alice','home','ACTIVE',TRUE), ('alice','away','ACTIVE',FALSE), ('bob','away','ACTIVE',TRUE);
            INSERT INTO Expert(id,ownerUserId,organizationId) VALUES ('assistant','alice','home'), ('tenant-expert','alice','away');
        ''')

        async def query(sql, *args):
            bindings = {str(index): arg for index, arg in enumerate(args, 1)}
            return [dict(row) for row in conn.execute(sql.format(schema_prefix=""), bindings)]

        monkeypatch.setattr(db, "query_raw_with_schema", query)
        monkeypatch.setattr(mcp_connections, "_store", lambda: custom_mcp)
        secrets = {}

        async def add(store, user_id, credentials):
            secrets[user_id, credentials.id] = credentials
            conn.execute(
                "INSERT INTO IntegrationCredential VALUES (?, 'USER', ?, ?, 'active', 'mcp', ?)",
                (
                    credentials.id,
                    user_id,
                    credentials.metadata["mcp_organization_id"],
                    JSONCryptor().encrypt(credentials.model_dump(mode="json")),
                ),
            )

        async def get(store, user_id, credentials_id):
            return secrets.get((user_id, credentials_id))

        async def update(store, user_id, credentials):
            secrets[user_id, credentials.id] = credentials
            conn.execute(
                "UPDATE IntegrationCredential SET encryptedPayload = ? WHERE id = ?",
                (
                    JSONCryptor().encrypt(credentials.model_dump(mode="json")),
                    credentials.id,
                ),
            )

        monkeypatch.setattr(IntegrationCredentialsStore, "add_creds", add)
        monkeypatch.setattr(IntegrationCredentialsStore, "get_creds_by_id", get)
        monkeypatch.setattr(IntegrationCredentialsStore, "update_creds", update)
        class NoopMutex:
            class NoopLock:
                async def locked(self):
                    return False

                async def owned(self):
                    return False

                async def release(self):
                    return None

            @asynccontextmanager
            async def locked(self, _key):
                yield

            async def acquire(self, _key, *, blocking_timeout=None):
                return self.NoopLock()

        monkeypatch.setattr(
            IntegrationCredentialsStore,
            "locks",
            AsyncMock(return_value=NoopMutex()),
        )
        monkeypatch.setattr("backend.integrations.creds_manager._invoke_creds_changed_hook", AsyncMock())
        yield secrets


@pytest_asyncio.fixture
async def api(storage, wire, monkeypatch):
    original = get_mcp_catalog()
    header = MCPCatalogEntry.model_validate({
        "name": "mcp_journey", "display_name": "Journey", "description": "Synthetic fixture",
        "mcp_server": {"server_url": HEADER_URL, "documentation_url": HEADER_URL,
                       "connection_mode": "hosted", "setup_instructions": "Synthetic",
                       "methods": [{"id": "api_key", "kind": "user_input", "label": "Key", "auth_type": "header",
                                    "name": "X-Journey-Key", "fields": [{"id": "token", "type": "secret", "label": "Key"}]}]},
    })
    app = fastapi.FastAPI()
    app.include_router(routes.router, prefix="/mcp")

    def context(request: fastapi.Request):
        return RequestContext(user_id=request.headers.get("x-fixture-user", "alice"), org_id=request.headers.get("x-org-id", "home"),
                              team_id=None, is_org_owner=False, is_org_admin=False, is_org_billing_manager=False,
                              is_team_admin=False, is_team_billing_manager=False, seat_status="ACTIVE")

    def user(request: fastapi.Request):
        return context(request).user_id

    async def discovery_context(request):
        return context(request)

    app.dependency_overrides.update({get_request_context: context, get_user_id: user, enforce_payment_paywall: lambda: None})
    monkeypatch.setattr(routes, "_discovery_context", discovery_context)
    monkeypatch.setattr(routes, "validate_url_host", AsyncMock())
    set_mcp_catalog((*original, header))
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://fixture") as client:
            yield client
    finally:
        set_mcp_catalog(None)


@pytest_asyncio.fixture
async def wire(monkeypatch):
    """Keep aiohttp's real middleware/serialization, replace only DNS and TCP/TLS."""
    received = []

    async def handle(message: web.Request):
        payload = await message.json()
        received.append((message.host, message.raw_path, dict(message.headers), payload))
        results = {
            "server/discover": {"supportedVersions": [MODERN_PROTOCOL_VERSION], "capabilities": {"tools": {}}},
            "tools/list": {"tools": [TOOL]},
            "tools/call": {"content": [{"type": "text", "text": "local reply"}]},
        }
        return web.json_response({"jsonrpc": "2.0", "id": payload["id"], "result": results[payload["method"]]})

    peer = web.Application()
    peer.router.add_post("/{tail:.*}", handle)
    async with TestServer(peer, host="127.0.0.1") as server:
        async def loopback(connector, req, traces, timeout):
            _, protocol = await asyncio.get_running_loop().create_connection(
                connector._factory, "127.0.0.1", server.port
            )
            return protocol

        monkeypatch.setattr(aiohttp.TCPConnector, "_create_connection", loopback)
        monkeypatch.setattr(request, "_resolve_host", AsyncMock(return_value=["93.184.216.34"]))
        monkeypatch.setattr("backend.blocks.mcp.client.era_cache", MCPServerEraCache())
        yield received


def assert_wire(received, endpoint, method, secret):
    expected = urlsplit(endpoint)
    expected_path = expected.path or "/"
    assert received
    for host, path, headers, payload in received:
        assert (host, urlsplit(path).path) == (expected.netloc, expected_path)
        assert parse_qsl(urlsplit(path).query, keep_blank_values=True) == (
            [("key", secret)] if method == "query_key" else []
        )
        assert headers.get("Authorization") == (
            f"Bearer {secret}" if method in ("oauth", "bearer") else None
        )
        assert "Cookie" not in headers
        assert headers.get("X-Journey-Key") == (secret if method == "header" else None)
        if secret:
            assert secret not in json.dumps(payload)


async def test_query_key_reaches_only_the_synthetic_wire_peer(wire, caplog):
    client = MCPClient(KEY_URL, query_key=SecretStr(TOKEN))
    await client.initialize()
    assert [tool.name for tool in await client.list_tools()] == ["echo"]
    assert (await client.call_tool("echo", {})).content == [{"type": "text", "text": "local reply"}]
    assert_wire(wire, KEY_URL, "query_key", TOKEN)
    assert TOKEN not in caplog.text and quote(TOKEN, safe="") not in caplog.text


@pytest.mark.parametrize("connector,method,endpoint", [
    ("mcp_aave", "none", "https://mcp.aave.com"),
    ("mcp_journey", "api_key", HEADER_URL),
    (MAIL, "query_key", KEY_URL),
    (MAIL, "oauth", "https://mcp-gw.dingtalk.com/oauth/server/mail"),
])
async def test_create_grant_discover_call_revoke(api, storage, wire, caplog, connector, method, endpoint):
    body = {"connector_id": connector, "method_id": method, "values": {}}
    if method == "query_key":
        body["values"] = {"url": f"{KEY_URL}?key={quote(TOKEN, safe='')}"}
    elif method == "api_key":
        body["values"] = {"token": TOKEN}
    elif method == "oauth":
        exchanged = OAuth2Credentials(provider="mcp", access_token=SecretStr(TOKEN), scopes=[], metadata={
            "mcp_isolated": True, "mcp_server_url": endpoint, "mcp_catalog_id": connector,
            "mcp_method_id": method, "mcp_definition_version": 1, "mcp_organization_id": "home",
        })
        await IntegrationCredentialsStore().add_creds("alice", exchanged)
        body["credential_id"] = exchanged.id
    created = await api.post("/mcp/catalog-connections", json=body)
    assert created.is_success, created.text
    connection_id = created.json()["id"]
    assert TOKEN not in created.text and quote(TOKEN, safe="") not in created.text
    listed = await api.get("/mcp/connections")
    assert listed.is_success and [row["id"] for row in listed.json()] == [connection_id]
    assert TOKEN not in listed.text and len(storage) == int(method != "none")
    resolution = await mcp_connections.resolve_catalog_connection("alice", connector, expert_id="assistant")
    assert resolution.state == "needs_grant" and resolution.connection is None
    grant = f"/mcp/connections/expert/assistant/{connection_id}"
    assert (await api.put(grant)).is_success
    discovery = {"server_url": endpoint, "connection_id": connection_id, "expert_id": "assistant"}
    tools = await api.post("/mcp/discover-tools", json=discovery)
    assert tools.is_success, tools.text
    assert [tool["name"] for tool in tools.json()["tools"]] == ["echo"]
    row = (await mcp_connections.resolve_catalog_connection("alice", connector, expert_id="assistant")).connection
    assert row and row["id"] == connection_id and row["serverUrl"] == endpoint
    assert TOKEN not in json.dumps(row)
    client = await mcp_connections.open_connection_client("alice", row)
    try:
        await client.initialize()
        result = await client.call_tool("echo", {"message": "fixture"})
        assert result.content == [{"type": "text", "text": "local reply"}]
    finally:
        await client.close()
    assert_wire(wire, endpoint, "header" if method == "api_key" else method, None if method == "none" else TOKEN)
    calls = [record[3] for record in wire if record[3]["method"] == "tools/call"]
    assert len(calls) == 1 and calls[0]["params"]["arguments"] == {"message": "fixture"}
    previous = len(wire)
    assert (await api.delete(grant)).is_success
    assert (await mcp_connections.resolve_catalog_connection("alice", connector, expert_id="assistant")).state == "needs_grant"
    assert (await api.post("/mcp/discover-tools", json=discovery)).is_client_error
    assert previous == len(wire) and TOKEN not in caplog.text
