from functools import partial
from unittest.mock import AsyncMock

import pytest
from cryptography.fernet import Fernet
from prisma import Prisma

from backend.copilot import managed_models as models
from backend.data import db
from backend.util.encryption import JSONCryptor


async def test_image_selection_and_text_catalog_use_only_matching_enabled_routes(
    mocker,
):
    mocker.patch.object(
        models,
        "_TABLE",
        """(SELECT *, model AS name, 'https://gateway.example/v1' AS "baseUrl",
          'ciphertext' AS "apiKey" FROM (VALUES
          ('text', 'qwen', true, 1),
          ('off', 'gpt-image-disabled', false, 2),
          ('alias', 'custom-image-deployment', true, 3),
          ('flare', 'gateway/gpt-image-2.6-flare', true, 4),
          ('sun', 'gateway/gpt-image-2.6-sunburst', true, 5)
        ) AS routes(id, model, enabled, "createdAt")) AS configured""",
    )
    mocker.patch.object(models._config, "managed_image_model_id", "alias")
    async with Prisma(datasource={"url": db.DATABASE_URL}) as client:
        mocker.patch.object(
            models,
            "query_raw_with_schema",
            partial(db.query_raw_with_schema, client=client),
        )
        lookup = models.get_enabled_managed_image_connection
        default = await lookup("", None)
        assert default and default.model == "gateway/gpt-image-2.6-sunburst"
        preferred = await lookup("", "gpt-image-2.6-flare")
        assert preferred and preferred.model == "gateway/gpt-image-2.6-flare"
        pinned = await lookup("alias", None)
        assert pinned and pinned.model == "custom-image-deployment"
        assert await lookup("off", None) is None
        assert await lookup("missing", "gpt-image-2.6-flare") is None
        assert await lookup("alias", "gpt-image-2.6-flare") is None
        assert await lookup("", "qwen") is None
        assert await lookup("", "gpt-image-disabled") is None
        assert [model.id for model in await models.list_chat_models()] == ["text"]


@pytest.mark.parametrize("direct_db", [True, False], ids=["api", "worker"])
async def test_image_model_resolves_admin_key_or_fails_closed(mocker, direct_db):
    cryptor = JSONCryptor(Fernet.generate_key().decode())
    row = models.StoredModelConnection(
        model="my-image-deployment",
        base_url="https://gateway.example/v1",
        encrypted_key=cryptor.encrypt({"key": "test-gateway-key"}),
    )
    mocker.patch.object(models, "JSONCryptor", return_value=cryptor)
    mocker.patch.object(models._config, "managed_image_model_id", "admin-record")
    mocker.patch.object(models, "is_connected", return_value=direct_db)
    local = mocker.patch.object(models, "get_enabled_managed_image_connection")
    rpc = mocker.patch.object(models, "get_database_manager_async_client")
    remote = AsyncMock()
    rpc.return_value.get_enabled_managed_image_connection = remote
    lookup, unused = (local, remote) if direct_db else (remote, local)
    lookup.side_effect = [row, None]

    route = await models.resolve_image_model(None)
    lookup.assert_awaited_once_with("admin-record", None)
    assert route.model == row.model and route.base_url == row.base_url
    assert route.key.get_secret_value() == "test-gateway-key"
    assert "test-gateway-key" not in row.model_dump_json()
    with pytest.raises(models.ModelUnavailable, match="administrator"):
        await models.resolve_image_model("unknown")
    lookup.assert_awaited_with("admin-record", "unknown")
    unused.assert_not_awaited()
