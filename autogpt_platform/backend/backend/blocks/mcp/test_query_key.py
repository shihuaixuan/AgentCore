import asyncio
import logging
from unittest.mock import AsyncMock, patch

import aiohttp
import pytest
from aiohttp import web
from aiohttp.test_utils import TestServer
from pydantic import SecretStr
from yarl import URL

from backend.blocks.mcp import client, helpers
from backend.blocks.mcp.block import MCPToolBlock
from backend.blocks.mcp.client import MCPCallResult, MCPClient, MCPClientError
from backend.data.model import OAuth2Credentials
from backend.util.request import EndpointAuth, HTTPClientError

ENDPOINT = "https://mcp-gw.dingtalk.com/server/Test_1-id"
KEY = SecretStr("synthetic+key &value")


@pytest.mark.parametrize(
    "url,allowed",
    [
        (ENDPOINT, True),
        (ENDPOINT.replace(".com/", ".com:443/"), True),
        (ENDPOINT.replace("https:", "http:"), False),
        (ENDPOINT.removeprefix("https://"), False),
        (ENDPOINT.replace(".com/", ".com.example/"), False),
        (ENDPOINT.replace(".com/", ".com:444/"), False),
        (ENDPOINT.replace(".com/", ".com:/"), False),
        (ENDPOINT.replace("://", "://user@"), False),
        (ENDPOINT.replace("/server/", "/Server/"), False),
        (ENDPOINT.replace("/server/", "\\server/"), False),
        (ENDPOINT.replace("Test_1-id", ".."), False),
        (ENDPOINT.replace("Test_1-id", "%2e%2e"), False),
        (ENDPOINT.replace("Test_1-id", ""), False),
        (ENDPOINT + "\n", False),
        (ENDPOINT + "/", False),
        (ENDPOINT + "/other", False),
        (ENDPOINT + "%2Fother", False),
        (ENDPOINT + "?key=not-a-credential", False),
        (ENDPOINT + "?", False),
        (ENDPOINT + "#", False),
    ],
)
def test_key_endpoints(url: str, allowed: bool):
    assert client.is_dingtalk_key_endpoint(url) is allowed
    if allowed:
        assert MCPClient(url, query_key=KEY).server_url == url
    else:
        with pytest.raises(ValueError):
            MCPClient(url, query_key=KEY)


async def test_saved_query_key_reaches_block_client_only_as_a_secret():
    credential = OAuth2Credentials(
        provider="mcp",
        scopes=[],
        access_token=KEY,
        metadata={"mcp_auth_scheme": "query_key", "mcp_server_url": ENDPOINT},
    )
    assert helpers.mcp_authorization_header(credential) is None
    assert helpers.mcp_query_key(credential) == KEY
    with patch("backend.blocks.mcp.helpers.MCPClient") as constructor:
        constructor.return_value = AsyncMock()
        constructor.return_value.call_tool.return_value = MCPCallResult()
        outputs = [
            output
            async for output in MCPToolBlock().run(
                MCPToolBlock.Input(server_url=ENDPOINT, selected_tool="test"),
                user_id="test-user",
                credentials=credential,
            )
        ]
    assert outputs == [("result", None)]
    constructor.assert_called_once_with(
        ENDPOINT,
        endpoint_auth=EndpointAuth(endpoint=ENDPOINT, token=KEY, query="key"),
        follow_redirects=False,
    )


def test_no_ambiguous_or_inline_credentials():
    with pytest.raises(ValueError):
        MCPClient(ENDPOINT, authorization="Bearer test", query_key=KEY)
    with pytest.raises(ValueError):
        MCPClient(ENDPOINT, query_key=SecretStr(""))
    with pytest.raises(ValueError) as exc:
        MCPClient(ENDPOINT + "?key=synthetic")
    assert "synthetic" not in str(exc.value)


@pytest.fixture
async def gateway(monkeypatch, caplog):
    """Use real aiohttp requests, routed exclusively to the in-process peer."""
    calls = []
    traces = []
    replies = []

    async def handle(request):
        rpc = await request.json() if request.method == "POST" else {}
        calls.append(
            (rpc.get("method", request.method), request.query, request.headers)
        )
        return replies.pop(0)

    async def record_trace(session, context, params):
        traces.append(str(params.url))

    trace = aiohttp.TraceConfig()
    trace.on_request_start.append(record_trace)
    trace.on_request_end.append(record_trace)
    app = web.Application(handler_args={"access_log": None})
    app.router.add_route("*", "/{tail:.*}", handle)
    request = aiohttp.ClientSession.request
    caplog.set_level(logging.DEBUG)
    session_class = aiohttp.ClientSession
    async with TestServer(app) as peer:

        def local_request(session, method, url, **kwargs):
            assert URL(url).origin() == URL(ENDPOINT).origin()
            assert "synthetic" not in repr((url, kwargs))
            return request(session, method, peer.make_url(URL(url).path_qs), **kwargs)

        monkeypatch.setattr(aiohttp.ClientSession, "request", local_request)
        monkeypatch.setattr(
            aiohttp,
            "ClientSession",
            lambda **kwargs: session_class(trace_configs=[trace], **kwargs),
        )
        monkeypatch.setattr(
            "backend.util.request._resolve_host", AsyncMock(return_value=["192.0.2.1"])
        )
        yield replies, calls, traces
    assert not replies
    assert all(
        "synthetic" not in record.getMessage() for record in caplog.get_records("call")
    )
    assert "synthetic" not in str(traces)


async def test_key_is_only_on_mcp_wire_messages(gateway):
    replies, calls, traces = gateway
    replies.extend(
        [
            web.json_response({"error": {"code": -32601}}),
            web.json_response(
                {"result": {}}, headers={"Mcp-Session-Id": "test-session"}
            ),
            web.Response(status=202),
            web.json_response({"result": {"tools": []}}),
            web.json_response({"result": {"content": []}}),
            web.Response(status=204),
            web.Response(status=401),
            web.json_response({"authorization_servers": []}),
        ]
    )
    client = MCPClient(ENDPOINT, query_key=KEY)
    await client.initialize()
    await client.list_tools()
    await client.call_tool("example", {})
    await client.close()
    await client.discover_auth()
    assert [method for method, _, _ in calls] == [
        "server/discover",
        "initialize",
        "notifications/initialized",
        "tools/list",
        "tools/call",
        "DELETE",
        "ping",
        "GET",
    ]
    assert all(
        list(query.items()) == [("key", KEY.get_secret_value())]
        for _, query, _ in calls[:-2]
    )
    assert all(not query for _, query, _ in calls[-2:])
    assert all("Authorization" not in headers for _, _, headers in calls)
    assert len(traces) == 4
    assert client.server_url == ENDPOINT


@pytest.mark.parametrize("status", [200, 307, 401])
async def test_reflected_key_does_not_escape_or_redirect(gateway, status):
    replies, calls, traces = gateway
    keyed = str(URL(ENDPOINT).with_query(key=KEY.get_secret_value()))
    replies.append(
        web.json_response(
            {"error": {"code": -32000, "message": keyed}},
            status=status,
            headers={"Location": keyed},
            reason="synthetic",
        )
    )
    with pytest.raises((ValueError, HTTPClientError)) as exc:
        await MCPClient(ENDPOINT, query_key=KEY).initialize()
    if status == 401:
        assert isinstance(exc.value, HTTPClientError)
        assert exc.value.status_code == 401
        assert not exc.value.body
    assert exc.value.__context__ is None
    assert "synthetic" not in str(exc.value)
    assert len(calls) == 1
    assert not traces


async def test_response_metadata_contains_no_wire_url(gateway):
    replies, _, _ = gateway
    replies.append(
        web.Response(
            headers={
                "Location": str(URL(ENDPOINT).with_query(key=KEY.get_secret_value()))
            }
        )
    )
    mcp = MCPClient(ENDPOINT, query_key=KEY)
    response = await mcp._post({"method": "ping"}, mcp._build_headers())
    assert response.url == ENDPOINT
    assert (
        str(response.request_info.url)
        == str(response.request_info.real_url)
        == ENDPOINT
    )
    assert "Location" not in response.headers


async def test_json_escaped_key_in_protocol_error_is_not_returned(gateway):
    replies, _, _ = gateway
    replies.append(
        web.Response(
            body=rb'{"error":{"code":-32022,"message":"\u0073ynthetic+key &value"}}',
            content_type="application/json",
        )
    )
    with pytest.raises(
        MCPClientError, match="response contained the query credential"
    ) as exc:
        await MCPClient(ENDPOINT, query_key=KEY).initialize()
    assert "synthetic" not in str(exc.value)


@pytest.mark.parametrize("error", [OSError, asyncio.CancelledError])
async def test_wire_exception_frames_do_not_escape(monkeypatch, error):
    monkeypatch.setattr(
        "backend.util.request._resolve_host", AsyncMock(return_value=["192.0.2.1"])
    )

    async def fail_with_wire_url(connector, request, **kwargs):
        assert request.url.query["key"] == KEY.get_secret_value()
        raise error(str(request.url))

    monkeypatch.setattr(aiohttp.TCPConnector, "connect", fail_with_wire_url)
    with pytest.raises(
        asyncio.CancelledError if error is asyncio.CancelledError else ValueError
    ) as exc:
        await MCPClient(ENDPOINT, query_key=KEY).initialize()
    assert exc.value.__context__ is None
    assert exc.value.__cause__ is None
    assert "synthetic" not in str(exc.value)
