import io
import zipfile

import pytest

from backend.cli.lobehub_market_sync import (
    category_values,
    mcp_entry_from_market,
    read_skill_archive,
)


def test_skill_categories_keep_lobehub_categories():
    assert category_values("web-frontend-development") == ["web-frontend-development"]


def test_skill_archive_requires_skill_markdown():
    archive = io.BytesIO()
    with zipfile.ZipFile(archive, "w") as output:
        output.writestr("package/README.md", "readme")

    with pytest.raises(ValueError, match="SKILL.md"):
        read_skill_archive(archive.getvalue())


def test_remote_mcp_entry_uses_public_https_endpoint():
    entry = mcp_entry_from_market(
        {
            "identifier": "vendor-search",
            "name": "Vendor Search",
            "description": "Search things",
            "category": "search",
            "homepage": "https://vendor.example/docs",
            "deploymentOptions": [
                {
                    "connection": {
                        "type": "http",
                        "url": "https://mcp.vendor.example/mcp",
                    },
                    "description": "Connect over HTTP",
                }
            ],
        }
    )

    assert entry.name == "mcp_vendor_search"
    assert entry.mcp_server.server_url == "https://mcp.vendor.example/mcp"
    assert entry.mcp_server.auth_methods == ["oauth", "bearer"]


def test_mcp_entry_ignores_localhost_endpoint():
    with pytest.raises(ValueError, match="public HTTPS"):
        mcp_entry_from_market(
            {
                "identifier": "unsafe",
                "name": "Unsafe",
                "description": "Unsafe local endpoint",
                "deploymentOptions": [
                    {
                        "connection": {"type": "http", "url": "https://localhost/mcp"},
                        "description": "Local only",
                    }
                ],
            }
        )
