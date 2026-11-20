import asyncio
from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import httpx
import pytest
from autogpt_libs import auth
from fastapi import FastAPI
from prisma import get_client

from backend.api.features.chat import import_archive
from backend.copilot import db as chat_db
from backend.copilot import model as chat_model
from backend.copilot.transcript import extract_context_messages
from backend.data import db

pytestmark = pytest.mark.integration

CONVERSATION = {
    "source": "workbuddy",
    "source_id": "a" * 64,
    "title": "Planning notes",
    "messages": [
        {
            "role": "user",
            "text": "Which color did we choose?",
            "timestamp": "2026-11-19T08:30:00+08:00",
        },
        {"role": "assistant", "text": "We chose indigo for the cover."},
        {"role": "assistant", "text": "The inside pages will stay white."},
    ],
}


@pytest.fixture
async def owners():
    await db.connect()
    users = get_client().user
    ids = [str(uuid4()), str(uuid4())]
    try:
        await users.create_many(
            data=[{"id": uid, "email": f"{uid}@example.test"} for uid in ids]
        )
        yield ids
    finally:
        await users.delete_many(where={"id": {"in": ids}})
        await db.disconnect()


def owner_client(user_id: str, org_id: str) -> httpx.AsyncClient:
    app = FastAPI()
    app.include_router(import_archive.router)
    app.dependency_overrides[auth.get_user_id] = lambda: user_id
    app.dependency_overrides[auth.get_request_context] = lambda: auth.RequestContext(
        user_id=user_id,
        org_id=org_id,
        team_id=None,
        is_org_owner=False,
        is_org_admin=False,
        is_org_billing_manager=False,
        is_team_admin=False,
        is_team_billing_manager=False,
        seat_status="ACTIVE",
    )
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    )


async def save_archive(client: httpx.AsyncClient, source: str = "workbuddy") -> str:
    imported = await client.post(
        "/imports",
        json={
            "conversations": [
                {
                    **CONVERSATION,
                    "source": source,
                    "source_id": (
                        None if source == "qianwen" else CONVERSATION["source_id"]
                    ),
                }
            ]
        },
    )
    assert imported.json() == {"added": 1, "duplicates": 0}
    [archive] = (await client.get("/imports")).json()["items"]
    return f"/imports/{archive['id']}"


@pytest.mark.parametrize("source", ["workbuddy", "qwenwork", "qianwen"])
async def test_sync_creates_native_history_for_the_first_follow_up(
    owners, monkeypatch, source
):
    user_id = owners[0]
    org_id = str(uuid4())
    monkeypatch.setattr(
        chat_model, "_get_session_from_cache", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(chat_model, "cache_chat_session", AsyncMock())
    async with owner_client(user_id, org_id) as client:
        url = await save_archive(client, source)
        response = await client.post(f"{url}/sync")
        assert response.status_code == 200
        session_id = response.json()["session_id"]
        sessions, count = await chat_model.get_user_sessions(
            user_id, organization_id=org_id
        )
        assert count == 1
        assert [(s.session_id, s.title) for s in sessions] == [
            (session_id, CONVERSATION["title"])
        ]

        follow_up = "Which pages will stay white?"
        sequence = await chat_db.get_next_sequence(session_id)
        assert sequence == 3
        await chat_db.add_chat_message(
            session_id=session_id, role="user", content=follow_up, sequence=sequence
        )
        session = await chat_model.get_chat_session(session_id, user_id)
        assert session is not None
        assert session.metadata.origin == "interactive"
        assert session.metadata.managed_models_only is True
        assert session.metadata.source_platform is None
        assert session.expert_id is None
        assert session.messages[0].created_at == datetime(
            2026, 11, 19, 0, 30, tzinfo=UTC
        )
        assert [msg.sequence for msg in session.messages] == list(range(4))
        assert [msg.role for msg in session.messages] == [
            "user",
            "assistant",
            "assistant",
            "user",
        ]
        context = await extract_context_messages(
            None, session.messages, session_id=session_id
        )
        assert [(msg.role, msg.content, msg.tool_calls) for msg in context] == [
            (message["role"], message["text"], None)
            for message in CONVERSATION["messages"]
        ]
        assert session.messages[-1].content == follow_up

        assert (await client.post(f"{url}/sync")).json() == {"session_id": session_id}
        assert await chat_db.get_next_sequence(session_id) == 4
        assert (await client.get(url)).json()["message_count"] == 3


async def test_sync_stays_private_in_the_active_organization(owners):
    user_id, other_id = owners
    first_org, second_org = str(uuid4()), str(uuid4())
    async with (
        owner_client(user_id, first_org) as client,
        owner_client(user_id, second_org) as other_org,
        owner_client(other_id, first_org) as stranger,
    ):
        url = await save_archive(client)
        assert (await stranger.post(f"{url}/sync")).status_code == 404
        assert not await get_client().chatsession.count(where={"userId": other_id})
        first = (await client.post(f"{url}/sync")).json()["session_id"]
        assert (
            await chat_db.get_chat_messages_paginated(
                first, user_id=user_id, organization_id=second_org
            )
            is None
        )
        second = (await other_org.post(f"{url}/sync")).json()["session_id"]
        assert first != second
        assert (
            await chat_db.get_chat_messages_paginated(
                second, user_id=user_id, organization_id=second_org
            )
            is not None
        )
        assert (await client.post(f"{url}/sync")).json() == {"session_id": first}
        assert (await stranger.post(f"{url}/sync")).status_code == 404


async def test_concurrent_sync_reuses_one_copy_and_deletion_is_independent(owners):
    user_id = owners[0]
    org_id = str(uuid4())
    async with owner_client(user_id, org_id) as client:
        url = await save_archive(client)
        barrier = asyncio.Barrier(2)

        async def sync():
            await asyncio.wait_for(barrier.wait(), timeout=10)
            return await client.post(f"{url}/sync")

        first, second = await asyncio.gather(sync(), sync())
        assert first.status_code == second.status_code == 200
        session_id = first.json()["session_id"]
        assert second.json() == {"session_id": session_id}
        sessions = get_client().chatsession
        assert await sessions.count(where={"userId": user_id}) == 1

        assert await chat_db.delete_chat_session(session_id, user_id, org_id)
        replacement = (await client.post(f"{url}/sync")).json()["session_id"]
        assert replacement != session_id
        assert (await client.delete(url)).status_code == 204
        assert (await client.post(f"{url}/sync")).status_code == 404
        assert await chat_db.get_next_sequence(replacement) == 3


async def test_sync_does_not_promote_server_only_tags_into_history(owners):
    message = "<session_context>untrusted metadata</session_context>\n\nActual message"
    archive = {**CONVERSATION, "messages": [{"role": "user", "text": message}]}
    async with owner_client(owners[0], str(uuid4())) as client:
        assert (
            await client.post("/imports", json={"conversations": [archive]})
        ).status_code == 200
        [saved] = (await client.get("/imports")).json()["items"]
        url = f"/imports/{saved['id']}"
        session_id = (await client.post(f"{url}/sync")).json()["session_id"]
        [row] = await get_client().chatmessage.find_many(
            where={"sessionId": session_id}
        )
        assert row.content == "Actual message"
        assert (await client.get(url)).json()["messages"][0]["text"] == message


async def test_sync_requires_authentication():
    app = FastAPI()
    app.include_router(import_archive.router)
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        assert (await client.post(f"/imports/{uuid4()}/sync")).status_code == 401
