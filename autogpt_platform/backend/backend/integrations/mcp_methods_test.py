import pytest
from pydantic import SecretStr

from backend.integrations.mcp_catalog import get_mcp_catalog


def test_dingtalk_link_is_split_before_storage():
    server = next(entry.mcp_server for entry in get_mcp_catalog() if entry.name == "mcp_dingtalk_mail")
    assert [method.id for method in server.methods] == ["oauth", "query_key"]
    from backend.integrations.mcp_methods import prepare_method

    url = "https://mcp-gw.dingtalk.com/server/test_1"
    prepared = prepare_method(server, "query_key", values={"url": SecretStr(url + "?key=fake%2Bkey")})
    assert prepared.secret == SecretStr("fake+key")
    assert prepared.server_url == url
    assert "fake" not in repr(prepared)
