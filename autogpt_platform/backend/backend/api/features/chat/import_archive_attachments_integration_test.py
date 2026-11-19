import json
from types import SimpleNamespace
from unittest.mock import AsyncMock
from urllib.parse import unquote
from uuid import uuid4

import httpx
import pytest
from autogpt_libs import auth
from prisma import get_client
from prisma.actions import ImportedChatAttachmentActions
from prisma.errors import PrismaError

from backend.api.features.chat import import_archive
from backend.api.features.chat.import_archive_attachments_test import (
    CONVERSATION,
    IMPORT_URL,
    MIB,
    archive_app,
    conversation_part,
)
from backend.data import db

pytestmark = pytest.mark.integration


@pytest.fixture
async def owners(monkeypatch):
    await db.connect()
    users = get_client().user
    ids = [str(uuid4()), str(uuid4())]
    try:
        await users.create_many(
            data=[{"id": uid, "email": f"{uid}@example.test"} for uid in ids]
        )
        scanner = SimpleNamespace(
            scan_file=AsyncMock(return_value=SimpleNamespace(is_clean=True)),
            settings=SimpleNamespace(
                clamav_service_enabled=True, mark_failed_scans_as_clean=False
            ),
        )
        monkeypatch.setattr(
            import_archive, "get_virus_scanner", lambda: scanner, raising=False
        )
        yield ids
    finally:
        await users.delete_many(where={"id": {"in": ids}})
        await db.disconnect()


def owner_client(user_id: str) -> httpx.AsyncClient:
    app = archive_app()
    app.dependency_overrides[auth.get_user_id] = lambda: user_id
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    )


async def test_existing_chat_backfill_download_owner_scope_and_cascade(owners):
    owner, stranger = owners
    async with owner_client(owner) as client, owner_client(stranger) as other:
        initial = await client.post("/imports", json={"conversations": [CONVERSATION]})
        assert initial.json() == {"added": 1, "duplicates": 0}
        chat_id = (await client.get("/imports")).json()["items"][0]["id"]
        chat_url = f"/imports/{chat_id}"
        assert (await client.get(chat_url)).json()["attachments"] == []

        parts = [
            conversation_part(),
            ("files", (r"C:\private\资料.html", b"\xff\x00x", "text/html")),
        ]
        for _ in range(2):
            upload = await client.post(IMPORT_URL, files=parts)
            assert upload.json() == {"added": 0, "duplicates": 1}
        attachments = (await client.get(chat_url)).json()["attachments"]
        [attachment] = attachments
        assert attachment == {"id": attachment["id"], "name": "资料.html", "size": 3}
        file_url = f"{chat_url}/attachments/{attachment['id']}"
        response = await client.get(file_url)
        assert response.content == b"\xff\x00x"
        assert response.headers["content-type"] == "application/octet-stream"
        assert (
            unquote(response.headers["content-disposition"])
            == "attachment; filename*=UTF-8''资料.html"
        )
        assert response.headers["x-content-type-options"] == "nosniff"
        assert {"private", "no-store"} <= set(
            response.headers["cache-control"].replace(" ", "").split(",")
        )

        assert (await other.get(chat_url)).status_code == 404
        assert (await other.get(file_url)).status_code == 404
        assert (
            await client.get(f"/imports/{uuid4()}/attachments/{attachment['id']}")
        ).status_code == 404
        assert (await client.delete(chat_url)).status_code == 204
        assert (await client.get(file_url)).status_code == 404
        assert not await get_client().importedchatattachment.count(
            where={"id": attachment["id"]}
        )


async def test_cumulative_archive_byte_cap_only_counts_new_attachments(owners):
    async with owner_client(owners[0]) as client:
        # Both files have the same display name but distinct content.
        first = ("files", ("same", b"a" * (5 * MIB)))
        second = ("files", ("same", b"b" * (5 * MIB)))
        response = await client.post(
            IMPORT_URL, files=[conversation_part(), first, first]
        )
        assert response.json() == {"added": 1, "duplicates": 0}
        response = await client.post(IMPORT_URL, files=[conversation_part(), second])
        assert response.json() == {"added": 0, "duplicates": 1}
        response = await client.post(
            IMPORT_URL, files=[conversation_part(), ("files", ("over", b"x"))]
        )
        assert response.status_code == 413
        response = await client.post(IMPORT_URL, files=[conversation_part(), first])
        assert response.json() == {"added": 0, "duplicates": 1}
        chat_id = (await client.get("/imports")).json()["items"][0]["id"]
        attachments = (await client.get(f"/imports/{chat_id}")).json()["attachments"]
        assert [(row["name"], row["size"]) for row in attachments] == [
            ("same", 5 * MIB)
        ] * 2


async def test_over_cap_batch_does_not_partially_append(owners):
    async with owner_client(owners[0]) as client:
        parts = [("files", (f"{index}.txt", b"x")) for index in range(11)]
        assert (
            await client.post(IMPORT_URL, files=[conversation_part(), *parts[:9]])
        ).status_code == 200
        assert (
            await client.post(IMPORT_URL, files=[conversation_part(), *parts[9:]])
        ).status_code == 413
        chat_id = (await client.get("/imports")).json()["items"][0]["id"]
        attachments = (await client.get(f"/imports/{chat_id}")).json()["attachments"]
        assert {attachment["name"] for attachment in attachments} == {
            f"{index}.txt" for index in range(9)
        }


async def test_attachment_write_failure_rolls_back_new_conversation(
    owners, monkeypatch
):
    monkeypatch.setattr(
        ImportedChatAttachmentActions,
        "create_many",
        AsyncMock(side_effect=PrismaError("attachment write failed")),
    )
    async with owner_client(owners[0]) as client:
        conversation = {**CONVERSATION, "source_id": "b" * 64}
        response = await client.post(
            IMPORT_URL,
            files=[
                conversation_part(json.dumps(conversation)),
                ("files", ("fixture", b"bytes")),
            ],
        )
        assert response.status_code == 503
        assert (await client.get("/imports")).json()["items"] == []
