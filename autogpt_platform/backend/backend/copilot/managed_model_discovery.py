import asyncio
from enum import StrEnum

from aiohttp import ClientError
from pydantic import BaseModel, ValidationError

from backend.copilot.managed_models import APIKey, BaseURL, ProviderModelID
from backend.util.request import Requests, ResponseTooLargeError

_TIMEOUT_SECONDS = 10
_MAX_RESPONSE_BYTES = 2 * 1024 * 1024


class ModelDiscoveryRequest(BaseModel):
    base_url: BaseURL
    api_key: APIKey


class DiscoveryFailure(StrEnum):
    INVALID_CONNECTION = "Use a public HTTP or HTTPS Base URL and a valid API key."
    REJECTED_KEY = "The provider rejected the API key for model listing."
    NOT_SUPPORTED = "This Base URL does not offer an OpenAI-compatible model list."
    UNAVAILABLE = "The provider did not return a valid model list."
    TIMED_OUT = "The provider did not respond in time."


class ModelDiscoveryError(Exception):
    def __init__(self, reason: DiscoveryFailure):
        super().__init__(reason.value)
        self.reason = reason


async def discover_model_ids(connection: ModelDiscoveryRequest) -> list[str]:
    key = connection.api_key.get_secret_value()
    if any(not "!" <= character <= "~" for character in key):
        raise ModelDiscoveryError(DiscoveryFailure.INVALID_CONNECTION)

    try:
        async with asyncio.timeout(_TIMEOUT_SECONDS):
            response = await Requests(
                raise_for_status=False,
                retry_max_attempts=1,
                max_response_bytes=_MAX_RESPONSE_BYTES,
            ).get(
                f"{connection.base_url}/models",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Accept": "application/json",
                },
                allow_redirects=False,
            )
    except TimeoutError:
        raise ModelDiscoveryError(DiscoveryFailure.TIMED_OUT) from None
    except (ClientError, OSError, ResponseTooLargeError):
        raise ModelDiscoveryError(DiscoveryFailure.UNAVAILABLE) from None
    except ValueError:
        raise ModelDiscoveryError(DiscoveryFailure.INVALID_CONNECTION) from None

    if response.status in (401, 403):
        raise ModelDiscoveryError(DiscoveryFailure.REJECTED_KEY)
    if response.status in (404, 405, 501):
        raise ModelDiscoveryError(DiscoveryFailure.NOT_SUPPORTED)
    if not response.ok:
        raise ModelDiscoveryError(DiscoveryFailure.UNAVAILABLE)

    try:
        models = _ProviderModelList.model_validate_json(response.content)
    except ValidationError:
        raise ModelDiscoveryError(DiscoveryFailure.UNAVAILABLE) from None
    return sorted({model.id for model in models.data})


class _ProviderModel(BaseModel):
    id: ProviderModelID


class _ProviderModelList(BaseModel):
    data: list[_ProviderModel]
