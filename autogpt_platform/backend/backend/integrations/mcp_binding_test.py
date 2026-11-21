from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.blocks.mcp.helpers import auto_lookup_mcp_credential
from backend.copilot.capabilities.resolve import connection_state_from
from backend.data.model import OAuth2Credentials
from backend.integrations.service_identity import service_for_credential

MAIL = "https://mcp-gw.dingtalk.com/oauth/server/mail"
CALENDAR = "https://mcp-gw.dingtalk.com/oauth/server/calendar"
PERSONAL = "https://mcp-gw.dingtalk.com/server/synthetic-endpoint"


def saved_key(service="mcp_dingtalk_mail", url=PERSONAL, **metadata):
    return OAuth2Credentials(
        provider="mcp",
        scopes=[],
        access_token="fixture",
        metadata={
            "mcp_auth_scheme": "query_key",
            "mcp_server_url": url,
            "mcp_catalog_id": service,
            **metadata,
        },
    )


async def test_bound_key_requires_same_service_and_explicit_expert_grant():
    mail = saved_key()
    calendar = saved_key("mcp_dingtalk_calendar", PERSONAL + "-calendar")
    store = MagicMock()
    store.get_creds_by_provider = AsyncMock(return_value=[mail, calendar])
    with patch(
        "backend.integrations.creds_manager.IntegrationCredentialsStore",
        return_value=store,
    ):
        grant = {mail.id}
        assert (
            await auto_lookup_mcp_credential("user", MAIL, grant, match_catalog=True)
            is mail
        )
        assert (
            await auto_lookup_mcp_credential(
                "user", CALENDAR, grant, match_catalog=True
            )
            is None
        )
        assert (
            await auto_lookup_mcp_credential("user", MAIL, set(), match_catalog=True)
            is None
        )
        assert await auto_lookup_mcp_credential("user", MAIL, grant) is None
    assert MAIL in connection_state_from([mail]).server_urls
    assert CALENDAR not in connection_state_from([mail]).server_urls
    assert service_for_credential(mail).service == "dingtalk_mail"


@pytest.mark.parametrize(
    "credential",
    [
        saved_key(None),
        saved_key(mcp_isolated=True),
        saved_key("mcp_notion"),
        saved_key(url="https://example.org/server/synthetic-endpoint"),
        saved_key(url=PERSONAL + "?key=fixture"),
        saved_key(mcp_auth_scheme="bearer"),
    ],
)
def test_unbound_or_invalid_key_never_makes_mail_ready(credential):
    assert MAIL not in connection_state_from([credential]).server_urls
    assert service_for_credential(credential).service != "dingtalk_mail"
