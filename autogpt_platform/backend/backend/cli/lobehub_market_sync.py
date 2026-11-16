"""Import ten validated LobeHub skills and remote MCP servers into local storage."""

import argparse
import asyncio
import hashlib
import io
import json
import os
import re
import tempfile
import time
import zipfile
from asyncio import Semaphore, gather
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import quote, urlsplit

import httpx
import jwt
import yaml

from backend.api.features.store.skill_catalog import publish_catalog
from backend.api.features.store.skill_catalog_release import load_release
from backend.copilot.tools.skills import (
    MAX_PACKAGE_BYTES,
    MAX_PACKAGE_FILE_BYTES,
    MAX_PACKAGE_FILES,
)
from backend.data import db as database
from backend.data.skill_package import file_sha256, package_tree_sha256
from backend.integrations.mcp_catalog import MCPCatalogEntry

MARKET_URL = "https://market.lobehub.com"
_SLUG_RE = re.compile(r"[^a-z0-9-]+")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync the top LobeHub skills and remote MCP servers locally"
    )
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.count <= 10:
        parser.error("--count must be between 1 and 10")
    raise SystemExit(asyncio.run(sync_market(args.count, dry_run=args.dry_run)))


async def sync_market(count: int, *, dry_run: bool = False) -> int:
    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        credentials = await load_or_register_client(client)
        skills = await fetch_top_skills(client, credentials, count)
        packages, categories = await fetch_skill_packages(client, skills)
        mcp_entries = await fetch_top_mcp_entries(client, credentials, count)
    with tempfile.TemporaryDirectory(prefix="lobehub-market-") as directory:
        root = Path(directory)
        write_remote_catalog(root, packages, categories)
        release = load_release(root, allow_noncanonical_categories=True)
    await database.connect()
    try:
        summary = await publish_catalog(
            release,
            repository="LobeHub/market",
            revision=market_revision(skills, mcp_entries),
            dry_run=dry_run,
            seed_experts=False,
            mcp_entries=[entry.model_dump() for entry in mcp_entries],
        )
    finally:
        await database.disconnect()
    print(json.dumps(summary.model_dump(), indent=2))
    return 0


async def load_or_register_client(client: httpx.AsyncClient) -> dict[str, str]:
    client_id = os.environ.get("MARKET_CLIENT_ID")
    client_secret = os.environ.get("MARKET_CLIENT_SECRET")
    if client_id and client_secret:
        return {"client_id": client_id, "client_secret": client_secret}
    path = client_credentials_path()
    if path.is_file():
        stored = json.loads(path.read_text(encoding="utf-8"))
        if stored.get("client_id") and stored.get("client_secret"):
            return stored
    response = await client.post(
        f"{MARKET_URL}/api/v1/clients/register",
        json={
            "clientName": "AutoGPT local marketplace sync",
            "clientType": "cli",
            "description": "Personal local learning and testing",
            "deviceId": "autogpt-local-"
            + hashlib.sha256(str(Path.cwd()).encode()).hexdigest()[:16],
            "metadata": {"clientVersion": "0.1"},
            "platform": os.name,
            "source": "autogpt-local-test",
            "version": "0.1",
        },
    )
    response.raise_for_status()
    registered = response.json()
    credentials = {
        "client_id": registered["client_id"],
        "client_secret": registered["client_secret"],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(credentials), encoding="utf-8")
    if os.name != "nt":
        path.chmod(0o600)
    return credentials


def client_credentials_path() -> Path:
    root = os.environ.get("LOCALAPPDATA") or os.environ.get("XDG_CONFIG_HOME")
    return (
        Path(root or Path.home() / ".config") / "AutoGPT" / "lobehub-market-client.json"
    )


def write_remote_catalog(
    root: Path,
    packages: dict[str, dict[str, bytes | str]],
    categories: dict[str, list[str]],
) -> None:
    manifest_packages = []
    for slug, files in sorted(packages.items()):
        listed = []
        for name, content in sorted(files.items()):
            data = content.encode("utf-8") if isinstance(content, str) else content
            target = root / "skills" / slug / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            listed.append(
                {
                    "path": name,
                    "sha256": file_sha256(data),
                    "executable": False,
                }
            )
        manifest_packages.append(
            {
                "slug": slug,
                "tree_sha256": package_tree_sha256(
                    (item["path"], item["sha256"], False) for item in listed
                ),
                "files": listed,
            }
        )
    catalog = {
        "skills": [
            {
                "slug": slug,
                "categories": categories[slug],
                "required_providers": [],
                "source": "platform",
            }
            for slug in sorted(packages)
        ]
    }
    catalog_bytes = yaml.safe_dump(catalog, sort_keys=False).encode("utf-8")
    (root / "catalog.yml").write_bytes(catalog_bytes)
    (root / "experts").mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema_version": 2,
        "release_key": "lobehub-market-local",
        "provenance": {"catalogue_repository": "LobeHub/market"},
        "catalog_sha256": file_sha256(catalog_bytes),
        "packages": manifest_packages,
        "experts": [],
        "retirements": [],
        "retired_experts": [],
        "system_packages": [],
    }
    (root / "release.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )


async def market_headers(
    client: httpx.AsyncClient, credentials: dict[str, str]
) -> dict[str, str]:
    endpoint = f"{MARKET_URL}/oauth/token"
    now = int(time.time())
    assertion = jwt.encode(
        {
            "iss": credentials["client_id"],
            "sub": credentials["client_id"],
            "aud": endpoint,
            "jti": os.urandom(16).hex(),
            "iat": now,
            "exp": now + 300,
        },
        credentials["client_secret"],
        algorithm="HS256",
    )
    response = await client.post(
        endpoint,
        data={
            "grant_type": "client_credentials",
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": assertion,
        },
    )
    response.raise_for_status()
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def fetch_top_skills(
    client: httpx.AsyncClient, credentials: dict[str, str], count: int
) -> list[dict[str, Any]]:
    response = await client.get(
        f"{MARKET_URL}/api/v1/skills",
        params={
            "page": 1,
            "pageSize": count,
            "sort": "installCount",
            "order": "desc",
            "locale": "en-US",
        },
        headers=await market_headers(client, credentials),
    )
    response.raise_for_status()
    items = response.json().get("items")
    if not isinstance(items, list) or len(items) < count:
        raise ValueError(f"LobeHub returned fewer than {count} skills")
    return items[:count]


async def fetch_skill_packages(
    client: httpx.AsyncClient, skills: list[dict[str, Any]]
) -> tuple[dict[str, dict[str, bytes | str]], dict[str, list[str]]]:
    packages = {}
    categories = {}
    for item in skills:
        identifier = required_text(item, "identifier")
        response = await client.get(
            f"{MARKET_URL}/api/v1/skills/{quote(identifier, safe='')}/download"
        )
        response.raise_for_status()
        files = read_skill_archive(response.content)
        slug = skill_slug(identifier)
        if slug in packages:
            raise ValueError(
                f"LobeHub skill identifiers collide at local slug '{slug}'"
            )
        markdown = files.pop("SKILL.md").decode("utf-8")
        files["SKILL.md"] = normalize_skill_markdown(markdown, slug, item)
        packages[slug] = files
        categories[slug] = category_values(item.get("category"))
    return packages, categories


def read_skill_archive(content: bytes) -> dict[str, bytes]:
    if len(content) > MAX_PACKAGE_BYTES:
        raise ValueError("LobeHub skill archive exceeds the local package size limit")
    files = {}
    total_size = 0
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        for member in archive.infolist():
            path = PurePosixPath(member.filename)
            if (
                member.is_dir()
                or "__MACOSX" in path.parts
                or any(part.startswith(".") for part in path.parts)
            ):
                continue
            if path.is_absolute() or ".." in path.parts or "\\" in member.filename:
                raise ValueError(f"Unsafe path in LobeHub archive: {member.filename}")
            parts = path.parts[1:] if len(path.parts) > 1 else path.parts
            relative = PurePosixPath(*parts).as_posix()
            if len(files) >= MAX_PACKAGE_FILES:
                raise ValueError(
                    "LobeHub skill archive exceeds the local file count limit"
                )
            if member.file_size > MAX_PACKAGE_FILE_BYTES:
                raise ValueError(
                    f"LobeHub file '{relative}' exceeds the local file size limit"
                )
            total_size += member.file_size
            if total_size > MAX_PACKAGE_BYTES:
                raise ValueError(
                    "LobeHub skill archive exceeds the local package size limit"
                )
            if relative in files:
                raise ValueError(f"Duplicate path in LobeHub archive: {relative}")
            files[relative] = archive.read(member)
    if "SKILL.md" not in files:
        raise ValueError("LobeHub skill archive is missing SKILL.md")
    return files


def normalize_skill_markdown(content: str, slug: str, item: dict[str, Any]) -> str:
    match = re.match(r"\A---\r?\n(.*?)\r?\n---\r?\n?(.*)\Z", content, re.DOTALL)
    if not match:
        raise ValueError(f"LobeHub skill '{slug}' has invalid frontmatter")
    metadata = yaml.safe_load(match.group(1))
    if not isinstance(metadata, dict):
        raise TypeError(f"LobeHub skill '{slug}' has invalid metadata")
    metadata["name"] = slug
    metadata["description"] = str(
        metadata.get("description") or item.get("description") or ""
    ).strip()
    if not metadata["description"]:
        raise ValueError(f"LobeHub skill '{slug}' has no description")
    if item.get("homepage"):
        metadata["source_url"] = item["homepage"]
    frontmatter = yaml.safe_dump(metadata, sort_keys=False).strip()
    return f"---\n{frontmatter}\n---\n{match.group(2)}"


async def fetch_top_mcp_entries(
    client: httpx.AsyncClient, credentials: dict[str, str], count: int
) -> list[MCPCatalogEntry]:
    entries = []
    seen = set()
    total_pages = 1
    headers = await market_headers(client, credentials)
    semaphore = Semaphore(10)

    async def fetch_detail(identifier: str) -> dict[str, Any] | None:
        async with semaphore:
            try:
                response = await client.get(
                    f"{MARKET_URL}/api/v1/plugins/{quote(identifier, safe='')}"
                )
                if response.status_code == 404:
                    response = await client.get(
                        f"{MARKET_URL}/api/v1/plugins/{quote(identifier, safe='')}",
                        headers=headers,
                    )
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, ValueError):
                return None

    for page in range(1, 1001):
        response = await client.get(
            f"{MARKET_URL}/api/v1/plugins",
            params={
                "page": page,
                "pageSize": 40,
                "sort": "installCount",
                "order": "desc",
                "locale": "en-US",
            },
            headers=headers,
        )
        response.raise_for_status()
        listing = response.json()
        items = listing.get("items", [])
        total_pages = int(listing.get("totalPages") or total_pages)
        identifiers = []
        for item in items:
            identifier = required_text(item, "identifier")
            if identifier not in seen:
                seen.add(identifier)
                identifiers.append(identifier)
        details = await gather(
            *(fetch_detail(identifier) for identifier in identifiers)
        )
        for detail in details:
            if detail is None:
                continue
            try:
                entry = mcp_entry_from_market(detail)
            except ValueError:
                continue
            if any(existing.name == entry.name for existing in entries):
                continue
            entries.append(entry)
            if len(entries) == count:
                return entries
        if page >= total_pages or not items:
            break
    raise ValueError(f"Only found {len(entries)} remote MCP servers; needed {count}")


def mcp_entry_from_market(item: dict[str, Any]) -> MCPCatalogEntry:
    options = item.get("deploymentOptions")
    if not isinstance(options, list):
        raise TypeError("MCP deployment options are missing")
    for option in options:
        if not isinstance(option, dict):
            continue
        connection = option.get("connection")
        if not isinstance(connection, dict) or connection.get("type") != "http":
            continue
        url = connection.get("url")
        if not isinstance(url, str) or "{{" in url or "}" in url:
            continue
        try:
            parsed = urlsplit(url)
            hostname = parsed.hostname
            port = parsed.port
        except ValueError:
            continue
        if (
            parsed.scheme != "https"
            or not hostname
            or parsed.username
            or parsed.password
            or parsed.query
            or parsed.fragment
            or port not in (None, 443)
            or hostname.lower().startswith(("your-", "example."))
        ):
            continue
        setup = str(option.get("description") or "Connect to this remote MCP service.")[
            :4000
        ]
        docs = item.get("homepage") or url
        return MCPCatalogEntry.model_validate(
            {
                "name": mcp_slug(required_text(item, "identifier")),
                "display_name": required_text(item, "name")[:120],
                "description": required_text(item, "description")[:4000],
                "mcp_server": {
                    "server_url": url,
                    "documentation_url": docs,
                    "setup_instructions": setup,
                    "connection_mode": "hosted",
                    "auth_methods": _auth_methods(setup),
                },
            }
        )
    raise ValueError("No remote HTTPS endpoint without templated credentials")


def category_values(category: object) -> list[str]:
    if isinstance(category, str) and category.strip():
        return [category.strip().lower()]
    if isinstance(category, list):
        return list(
            dict.fromkeys(
                value.strip().lower()
                for value in category
                if isinstance(value, str) and value.strip()
            )
        )
    return ["uncategorized"]


def _auth_methods(setup: str) -> list[str]:
    text = setup.lower()
    methods = []
    if "oauth" in text or "sign in" in text or "authorize" in text:
        methods.append("oauth")
    if "api key" in text or "api-key" in text or "bearer" in text or "token" in text:
        methods.append("bearer")
    if "basic auth" in text or "username and password" in text:
        methods.append("basic")
    if "no authentication" in text or "no auth" in text or "public endpoint" in text:
        methods.append("none")
    return list(dict.fromkeys(methods)) or ["oauth", "bearer"]


def skill_slug(identifier: str) -> str:
    value = _SLUG_RE.sub("-", identifier.lower()).strip("-")[:55].rstrip("-")
    return f"lobehub-{value}"


def mcp_slug(identifier: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "_", identifier.lower()).strip("_")[:54]
    return f"mcp_{value}"


def required_text(data: dict[str, Any], key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"LobeHub record is missing '{key}'")
    return value.strip()


def market_revision(
    skills: list[dict[str, Any]], entries: list[MCPCatalogEntry]
) -> str:
    snapshot = {
        "skills": [(item["identifier"], item.get("version")) for item in skills],
        "mcps": [entry.name for entry in entries],
    }
    return hashlib.sha1(json.dumps(snapshot, sort_keys=True).encode()).hexdigest()
