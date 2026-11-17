from unittest.mock import AsyncMock, patch

import fastapi
import httpx
import pytest
from autogpt_libs.auth import get_user_id

from backend.api.features.mcp.custom_connections import (
    ConnectionInput,
    update_connection,
)
from backend.api.features.mcp.routes import router
from backend.copilot.rate_limit import enforce_payment_paywall


@pytest.mark.asyncio
async def test_can_disable_existing_connection_when_remote_service_is_unreachable():
    row = {
        "id": "connection-1",
        "name": "Weather",
        "description": "",
        "serverUrl": "https://mcp.example.com",
        "authType": "bearer",
        "credentialId": "cred-1",
        "enabled": True,
    }
    with (
        patch(
            "backend.data.db.query_raw_with_schema",
            new_callable=AsyncMock,
            side_effect=[[row], [{**row, "enabled": False}]],
        ),
        patch(
            "backend.util.request.validate_url_host",
            new_callable=AsyncMock,
            side_effect=ValueError("offline"),
        ),
    ):
        result = await update_connection(
            "connection-1",
            ConnectionInput(
                name=row["name"],
                server_url=row["serverUrl"],
                auth_type="bearer",
                credential_id="cred-1",
                enabled=False,
            ),
            "alice",
        )
    assert result.enabled is False


@pytest.mark.asyncio
async def test_create_public_connection_is_saved_for_current_user():
    app = fastapi.FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_user_id] = lambda: "alice"
    app.dependency_overrides[enforce_payment_paywall] = lambda: None
    row = {
        "id": "connection-1",
        "userId": "alice",
        "name": "Weather",
        "description": "Weather lookup",
        "serverUrl": "https://mcp.example.com/mcp",
        "authType": "none",
        "credentialId": None,
        "enabled": True,
    }
    with (
        patch(
            "backend.data.db.query_raw_with_schema",
            new_callable=AsyncMock,
            return_value=[row],
        ) as query,
        patch("backend.util.request.validate_url_host", new_callable=AsyncMock),
    ):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/connections",
                json={
                    "name": "Weather",
                    "description": "Weather lookup",
                    "server_url": "https://mcp.example.com/mcp",
                    "auth_type": "none",
                },
            )
    assert response.status_code == 200
    assert response.json()["name"] == "Weather"
    assert response.json()["credential_id"] is None
    assert "alice" in query.await_args.args


@pytest.mark.asyncio
async def test_user_cannot_delete_another_users_connection():
    app = fastapi.FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_user_id] = lambda: "alice"
    app.dependency_overrides[enforce_payment_paywall] = lambda: None
    with patch(
        "backend.data.db.execute_raw_with_schema",
        new_callable=AsyncMock,
        return_value=0,
    ) as query:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.delete("/connections/bobs-id")
    assert response.status_code == 404
    assert query.await_args.args[1:] == ("bobs-id", "alice")


@pytest.mark.asyncio
async def test_rejects_non_https_server():
    app = fastapi.FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_user_id] = lambda: "alice"
    app.dependency_overrides[enforce_payment_paywall] = lambda: None
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/connections",
            json={
                "name": "Local",
                "server_url": "http://127.0.0.1/mcp",
                "auth_type": "none",
            },
        )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_rejects_credential_from_another_user():
    app = fastapi.FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_user_id] = lambda: "alice"
    app.dependency_overrides[enforce_payment_paywall] = lambda: None
    with (
        patch("backend.util.request.validate_url_host", new_callable=AsyncMock),
        patch(
            "backend.api.features.mcp.custom_connections.IntegrationCredentialsManager.get",
            new_callable=AsyncMock,
            return_value=None,
        ) as get_credential,
    ):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/connections",
                json={
                    "name": "Weather",
                    "server_url": "https://mcp.example.com/mcp",
                    "auth_type": "bearer",
                    "credential_id": "bobs-credential",
                },
            )
    assert response.status_code == 400
    get_credential.assert_awaited_once_with("alice", "bobs-credential")


@pytest.mark.asyncio
async def test_discovery_does_not_send_a_token_over_http():
    app = fastapi.FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_user_id] = lambda: "alice"
    app.dependency_overrides[enforce_payment_paywall] = lambda: None
    with (
        patch(
            "backend.api.features.mcp.routes.validate_url_host", new_callable=AsyncMock
        ),
        patch("backend.api.features.mcp.routes.MCPClient") as mcp,
    ):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/discover-tools",
                json={
                    "server_url": "http://public.example/mcp",
                    "auth_token": "secret",
                },
            )
    assert response.status_code == 400
    mcp.assert_not_called()
