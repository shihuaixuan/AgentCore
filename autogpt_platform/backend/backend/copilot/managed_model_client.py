from contextlib import asynccontextmanager

import httpx
from openai import AsyncOpenAI

from backend.copilot.managed_models import ModelRuntime, ModelUnavailable
from backend.util.request import validate_url_host


def public_request(
    request: httpx.Request, hostname: str, ip_address: str
) -> httpx.Request:
    if request.url.scheme != "https" or request.url.host != hostname:
        raise ValueError("Managed chat requests must stay on the configured host.")
    return httpx.Request(
        request.method,
        request.url.copy_with(host=ip_address),
        headers=request.headers,
        stream=request.stream,
        extensions={**request.extensions, "sni_hostname": hostname},
    )


class _PinnedTransport(httpx.AsyncHTTPTransport):
    def __init__(self, hostname: str, ip_address: str):
        super().__init__(trust_env=False)
        self.hostname = hostname
        self.ip_address = ip_address

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        return await super().handle_async_request(
            public_request(request, self.hostname, self.ip_address)
        )


@asynccontextmanager
async def managed_model_client(route: ModelRuntime):
    try:
        parsed, _, addresses = await validate_url_host(route.base_url)
    except ValueError:
        raise ModelUnavailable("The chat model endpoint is unavailable.") from None
    if not parsed.hostname or not addresses:
        raise ModelUnavailable("The chat model endpoint is unavailable.")
    async with AsyncOpenAI(
        api_key=route.key.get_secret_value(),
        base_url=route.base_url,
        http_client=httpx.AsyncClient(
            transport=_PinnedTransport(parsed.hostname, addresses[0]),
            follow_redirects=False,
            trust_env=False,
            timeout=httpx.Timeout(120.0, connect=10.0),
        ),
    ) as client:
        yield client
