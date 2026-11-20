from typing import Annotated
from urllib.parse import urlsplit
from uuid import uuid4

from pydantic import AfterValidator, BaseModel, Field, SecretStr, StringConstraints

from backend.copilot.config import ChatConfig
from backend.data.db import is_connected, query_raw_with_schema
from backend.util.clients import get_database_manager_async_client
from backend.util.encryption import JSONCryptor

_TABLE = '{schema_prefix}"ManagedChatModel"'
_FIELDS = 'id, name, model, "baseUrl" AS base_url, enabled'
_MODEL_SLUG = "lower(regexp_replace(model, '^.*/', ''))"
_IMAGE_ROUTE = f"(id = $1 OR {_MODEL_SLUG} LIKE 'gpt-image-%')"
_config = ChatConfig()


def validate_base_url(value: str) -> str:
    parsed = urlsplit(value)
    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or "\\" in value
        or any(character.isspace() for character in value)
    ):
        raise ValueError(
            "Use an HTTP or HTTPS API base URL without credentials, query or fragment."
        )
    if parsed.port == 0 or parsed.path.rstrip("/").endswith("/chat/completions"):
        raise ValueError("Use the API base URL, not the Chat Completions endpoint.")
    return value.rstrip("/")


ModelName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
]
ProviderModelID = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=240)
]
BaseURL = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=500),
    AfterValidator(validate_base_url),
]
APIKey = Annotated[SecretStr, Field(min_length=1, max_length=4096)]


class ChatModel(BaseModel):
    id: str
    name: str


class ModelDetails(ChatModel):
    model: str
    base_url: str
    enabled: bool


class ModelCreate(BaseModel):
    name: ModelName
    model: ProviderModelID
    base_url: BaseURL
    api_key: APIKey


class ModelUpdate(BaseModel):
    name: ModelName | None = None
    model: ProviderModelID | None = None
    base_url: BaseURL | None = None
    api_key: APIKey | None = None
    enabled: bool | None = None


class StoredModelConnection(BaseModel):
    model: str
    base_url: str
    encrypted_key: str = Field(repr=False)


class ModelRuntime(BaseModel):
    model: str
    base_url: str
    key: SecretStr


class ModelUnavailable(Exception):
    pass


async def list_chat_models() -> list[ChatModel]:
    return await query_raw_with_schema(
        f'SELECT id, name FROM {_TABLE} WHERE "enabled" = TRUE '
        f'AND NOT {_IMAGE_ROUTE} ORDER BY "createdAt", id',
        _config.managed_image_model_id,
        model=ChatModel,
    )


async def select_chat_model(model_id: str | None) -> str:
    models = await list_chat_models()
    if model_id is None and models:
        return models[0].id
    if model_id is not None and any(model.id == model_id for model in models):
        return model_id
    raise ModelUnavailable("No enabled chat model matches this request.")


async def resolve_model(model_id: str) -> ModelRuntime:
    if is_connected():
        row = await get_enabled_managed_model_connection(model_id)
    else:
        # Chat workers rely on the database manager; only ciphertext crosses RPC.
        database_manager = get_database_manager_async_client()
        row = await database_manager.get_enabled_managed_model_connection(model_id)
    if row is None:
        raise ModelUnavailable("This chat model is no longer available.")
    return _runtime(row)


def _runtime(row: StoredModelConnection) -> ModelRuntime:
    key = JSONCryptor().decrypt(row.encrypted_key).get("key")
    if not key:
        raise ModelUnavailable("The configured model has no usable API key.")
    return ModelRuntime(model=row.model, base_url=row.base_url, key=key)


async def resolve_image_model(preferred: str | None) -> ModelRuntime:
    lookup = (
        get_enabled_managed_image_connection
        if is_connected()
        else get_database_manager_async_client().get_enabled_managed_image_connection
    )
    row = await lookup(_config.managed_image_model_id, preferred)
    if row is None:
        raise ModelUnavailable(
            "No matching image model is enabled. Ask your administrator to enable "
            "an OpenAI-compatible image model in Settings → AI Connections."
        )
    return _runtime(row)


async def get_enabled_managed_image_connection(
    pinned_id: str, preferred: str | None
) -> StoredModelConnection | None:
    rows = await query_raw_with_schema(
        f'SELECT model, "baseUrl" AS base_url, "apiKey" AS encrypted_key FROM {_TABLE} '
        f'WHERE "enabled" = TRUE AND {_IMAGE_ROUTE} '
        f"AND ($2::text IS NULL OR lower(model) = lower($2) OR {_MODEL_SLUG} = lower($2)) "
        "AND ($1 = '' OR id = $1) "
        f"ORDER BY ({_MODEL_SLUG} = 'gpt-image-2.6-sunburst') DESC, "
        '"createdAt", id LIMIT 1',
        pinned_id,
        preferred,
        model=StoredModelConnection,
    )
    return rows[0] if rows else None


async def get_enabled_managed_model_connection(
    model_id: str,
) -> StoredModelConnection | None:
    rows = await query_raw_with_schema(
        f'SELECT model, "baseUrl" AS base_url, "apiKey" AS encrypted_key FROM {_TABLE} '
        'WHERE id = $1 AND "enabled" = TRUE',
        model_id,
        model=StoredModelConnection,
    )
    return rows[0] if rows else None


async def list_model_details() -> list[ModelDetails]:
    return await query_raw_with_schema(
        f'SELECT {_FIELDS} FROM {_TABLE} ORDER BY "createdAt", id', model=ModelDetails
    )


async def create_model(data: ModelCreate) -> ModelDetails:
    rows = await query_raw_with_schema(
        f'INSERT INTO {_TABLE} (id, name, model, "baseUrl", "apiKey") '
        f"VALUES ($1, $2, $3, $4, $5) RETURNING {_FIELDS}",
        str(uuid4()),
        data.name,
        data.model,
        data.base_url,
        JSONCryptor().encrypt({"key": data.api_key.get_secret_value()}),
        model=ModelDetails,
    )
    return rows[0]


async def update_model(model_id: str, data: ModelUpdate) -> ModelDetails | None:
    if data.base_url is not None and data.api_key is None:
        raise ValueError("Enter an API key when changing the Base URL.")
    rows = await query_raw_with_schema(
        f"UPDATE {_TABLE} SET name = COALESCE($2::text, name), "
        'model = COALESCE($3::text, model), "baseUrl" = COALESCE($4::text, "baseUrl"), '
        '"apiKey" = COALESCE($5::text, "apiKey"), enabled = COALESCE($6::boolean, enabled) '
        f"WHERE id = $1 RETURNING {_FIELDS}",
        model_id,
        data.name,
        data.model,
        data.base_url,
        (
            JSONCryptor().encrypt({"key": data.api_key.get_secret_value()})
            if data.api_key
            else None
        ),
        data.enabled,
        model=ModelDetails,
    )
    return rows[0] if rows else None
