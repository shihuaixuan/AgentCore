from unittest.mock import patch

import pytest
from autogpt_libs.auth import get_optional_user_id
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.features.integrations.models import ProviderNamesResponse
from backend.api.features.integrations.router import router, settings
from backend.integrations.mcp_catalog import get_mcp_catalog
from backend.util.settings import BehaveAs

app = FastAPI()
app.include_router(router)
app.dependency_overrides[get_optional_user_id] = lambda: None


@pytest.mark.parametrize("behave_as", [BehaveAs.CLOUD, BehaveAs.LOCAL])
def test_provider_endpoint_only_exposes_connectable_catalog(behave_as: BehaveAs):
    with (
        patch.object(settings.config, "behave_as", behave_as),
        patch("backend.blocks.load_all_blocks"),
        patch(
            "backend.api.features.integrations.router.get_all_provider_names",
            return_value=[
                "notion",
                "slack",
                "google",
                "discord",
                "telegram",
                "smtp",
                "mcp",
            ],
        ),
        patch(
            "backend.api.features.integrations.router.get_provider_description",
            return_value="Native integration",
        ),
        patch(
            "backend.api.features.integrations.router.get_supported_auth_types",
            return_value=["oauth2"],
        ),
    ):
        response = TestClient(app).get("/providers")

    assert response.status_code == 200
    providers = response.json()
    provider_names = {provider["name"] for provider in providers}
    unlisted_catalog = {"mcp_ando", "mcp_bird", "mcp_infobip"}
    assert provider_names.isdisjoint(
        unlisted_catalog | {"slack", "discord", "telegram"}
    )
    assert len(provider_names) == len(providers)
    assert [p["name"] for p in providers if p["mcp_server"] is None] == [
        "notion",
        "google",
        "smtp",
        "mcp",
    ]
    assert {p["name"] for p in providers if p["mcp_server"] is not None} == {
        entry.name for entry in get_mcp_catalog()
    } - unlisted_catalog
    assert {
        "mcp_langfuse",
        "mcp_gitee",
        "mcp_iphouse",
        "mcp_processon",
        "mcp_qcc_company",
        "mcp_wps_yundoc",
    } <= provider_names
    notion = next(
        provider for provider in providers if provider["name"] == "mcp_notion"
    )
    assert notion["display_name"] == "Notion"
    assert notion["supported_auth_types"] == []
    assert notion["mcp_server"]["server_url"] == "https://mcp.notion.com/mcp"
    assert notion["mcp_server"]["connection_mode"] == "hosted"


def test_domestic_office_connectors_have_distinct_setup_cards():
    expected = {
        "mcp_dingtalk_todo": (
            "https://mcp-gw.dingtalk.com/oauth/server/todo",
            ["oauth", "query_key"],
        ),
        "mcp_dingtalk_calendar": (
            "https://mcp-gw.dingtalk.com/oauth/server/calendar",
            ["oauth", "query_key"],
        ),
        "mcp_dingtalk_docs": (
            "https://mcp-gw.dingtalk.com/oauth/server/doc",
            ["oauth", "query_key"],
        ),
        "mcp_dingtalk_mail": (
            "https://mcp-gw.dingtalk.com/oauth/server/mail",
            ["oauth", "query_key"],
        ),
        "mcp_dingtalk_aitable": (
            "https://mcp-gw.dingtalk.com/oauth/server/aitable",
            ["oauth", "query_key"],
        ),
        "mcp_tencent_yuanbao_search": (
            "https://api.wsa.cloud.tencent.com/Mcp",
            ["bearer"],
        ),
    }

    with (
        patch("backend.blocks.load_all_blocks"),
        patch(
            "backend.api.features.integrations.router.get_all_provider_names",
            return_value=[],
        ),
    ):
        response = TestClient(app).get("/providers")

    assert response.status_code == 200
    providers = {provider["name"]: provider for provider in response.json()}
    assert expected.keys() <= providers.keys()
    assert len({providers[name]["service"] for name in expected}) == len(expected)
    for name, (url, methods) in expected.items():
        server = providers[name]["mcp_server"]
        assert server["server_url"] == url
        assert server["auth_methods"] == methods
        assert server["connection_mode"] == "hosted"


def test_catalog_entries_do_not_register_credential_providers():
    credential_providers = set(ProviderNamesResponse().providers)
    catalog_names = {entry.name for entry in get_mcp_catalog()}
    assert credential_providers.isdisjoint(catalog_names)


def test_provider_openapi_exposes_typed_mcp_metadata():
    schemas = app.openapi()["components"]["schemas"]
    metadata = schemas["MCPServerMetadata"]["properties"]
    assert metadata["connection_mode"]["enum"] == ["hosted", "custom"]
    assert metadata["auth_methods"]["minItems"] == 1
    assert "auth_methods" in schemas["MCPServerMetadata"]["required"]
    assert "mcp_server" in schemas["ProviderMetadata"]["properties"]


@pytest.mark.parametrize(
    "provider,display_name,server_url",
    [
        ("linear", "Linear", "https://mcp.linear.app/mcp"),
        ("hubspot", "HubSpot", "https://mcp.hubspot.com"),
    ],
)
def test_provider_listing_carries_the_service_identity(
    provider: str, display_name: str, server_url: str
):
    with (
        patch("backend.blocks.load_all_blocks"),
        patch(
            "backend.api.features.integrations.router.get_all_provider_names",
            return_value=[provider, "google"],
        ),
        patch(
            "backend.api.features.integrations.router.get_provider_description",
            return_value="Native integration",
        ),
        patch(
            "backend.api.features.integrations.router.get_supported_auth_types",
            return_value=["api_key"],
        ),
    ):
        providers = {p["name"]: p for p in TestClient(app).get("/providers").json()}

    assert providers[provider]["service"] == provider
    assert providers[provider]["service_icon"] == provider
    mcp = providers[f"mcp_{provider}"]
    assert mcp["service"] == provider
    assert mcp["service_name"] == display_name
    assert mcp["service_icon"] == provider
    assert mcp["mcp_server"]["server_url"] == server_url
    assert mcp["mcp_server"]["connection_mode"] == "hosted"
    assert "oauth" in mcp["mcp_server"]["auth_methods"]
    assert providers["mcp_sentry"]["service"] == "sentry"
