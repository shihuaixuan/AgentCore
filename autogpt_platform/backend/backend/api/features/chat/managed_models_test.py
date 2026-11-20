from unittest.mock import AsyncMock
from uuid import uuid4

import httpx
import pytest
from autogpt_libs.auth.dependencies import get_unbanned_jwt_payload
from cryptography.fernet import Fernet
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.api.features.chat import managed_models as routes
from backend.copilot import managed_models
from backend.copilot.managed_model_client import public_request
from backend.util.encryption import JSONCryptor


@pytest.mark.parametrize(
    "base_url",
    [
        "file:///models",
        "https://user:secret@ai.example/v1",
        "https://ai.example/v1?k=x",
    ],
)
def test_rejects_unsafe_base_url(base_url):
    with pytest.raises(ValidationError):
        managed_models.ModelCreate(
            name="My model", model="model-id", base_url=base_url, api_key="test-only"
        )


def test_http_base_url_is_supported():
    data = managed_models.ModelCreate(
        name="My model",
        model="model-id",
        base_url="http://162.35.169.105:8080/v1/",
        api_key="test-only",
    )
    assert data.base_url == "http://162.35.169.105:8080/v1"


@pytest.mark.asyncio
async def test_disabled_or_unknown_model_cannot_be_resolved(monkeypatch):
    query = AsyncMock(return_value=[])
    monkeypatch.setattr(managed_models, "query_raw_with_schema", query)
    model_id = str(uuid4())
    with pytest.raises(managed_models.ModelUnavailable):
        await managed_models.resolve_model(model_id)
    sql, *args = query.call_args.args
    assert '"enabled" = TRUE' in sql
    assert args == [model_id]


@pytest.mark.asyncio
async def test_public_catalog_excludes_endpoint_and_key(monkeypatch):
    model_id = str(uuid4())
    query = AsyncMock(
        return_value=[managed_models.ChatModel(id=model_id, name="My model")]
    )
    monkeypatch.setattr(managed_models, "query_raw_with_schema", query)
    models = await managed_models.list_chat_models()
    assert models[0].model_dump() == {"id": model_id, "name": "My model"}
    sql = query.call_args.args[0]
    assert '"enabled" = TRUE' in sql
    assert '"apiKey"' not in sql and '"baseUrl"' not in sql


@pytest.mark.asyncio
async def test_selection_never_falls_back_when_an_explicit_model_is_disabled(
    monkeypatch,
):
    model = managed_models.ChatModel(id=str(uuid4()), name="Enabled model")
    monkeypatch.setattr(
        managed_models, "list_chat_models", AsyncMock(return_value=[model])
    )
    assert await managed_models.select_chat_model(None) == model.id
    with pytest.raises(managed_models.ModelUnavailable):
        await managed_models.select_chat_model(str(uuid4()))


def test_transport_preserves_tls_identity_on_validated_ip():
    original = httpx.Request("POST", "https://ai.example:8443/v1/chat/completions")
    request = public_request(original, hostname="ai.example", ip_address="1.1.1.1")
    assert request.url.host == "1.1.1.1"
    assert request.url.port == 8443
    assert request.headers["Host"] == "ai.example:8443"
    assert request.extensions["sni_hostname"] == "ai.example"
    assert original.url.host == "ai.example"
    with pytest.raises(ValueError):
        public_request(
            httpx.Request("GET", "https://other.example"), "ai.example", "1.1.1.1"
        )


def test_http_transport_preserves_host_without_tls_identity():
    original = httpx.Request("GET", "http://ai.example:8080/v1/models")
    original.extensions["sni_hostname"] = "stale.example"
    request = public_request(original, hostname="ai.example", ip_address="1.1.1.1")
    assert request.url.host == "1.1.1.1"
    assert request.url.port == 8080
    assert request.headers["Host"] == "ai.example:8080"
    assert "sni_hostname" not in request.extensions


def test_non_admin_cannot_change_model_availability(monkeypatch):
    app = FastAPI()
    app.include_router(routes.router)
    app.dependency_overrides[get_unbanned_jwt_payload] = lambda: {
        "sub": "member",
        "role": "authenticated",
    }
    update = AsyncMock()
    monkeypatch.setattr(managed_models, "update_model", update)
    with TestClient(app) as client:
        response = client.patch(
            f"/managed-models/admin/{uuid4()}", json={"enabled": True}
        )
    assert response.status_code == 403
    update.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_model_encrypts_key_and_never_returns_it(monkeypatch):
    cryptor = JSONCryptor(Fernet.generate_key().decode())
    monkeypatch.setattr(managed_models, "JSONCryptor", lambda: cryptor)
    data = managed_models.ModelCreate(
        name="My model",
        model="model-id",
        base_url="https://ai.example/v1/",
        api_key="test-only",
    )
    details = managed_models.ModelDetails(
        id=str(uuid4()),
        name=data.name,
        model=data.model,
        base_url=data.base_url,
        enabled=False,
    )
    query = AsyncMock(return_value=[details])
    monkeypatch.setattr(managed_models, "query_raw_with_schema", query)
    result = await managed_models.create_model(data)
    ciphertext = query.call_args.args[-1]
    assert ciphertext != "test-only"
    assert cryptor.decrypt(ciphertext) == {"key": "test-only"}
    assert not result.enabled
    assert "test-only" not in result.model_dump_json()
