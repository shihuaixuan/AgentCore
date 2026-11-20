from contextlib import asynccontextmanager
from types import SimpleNamespace
from unittest.mock import AsyncMock

from autogpt_libs import auth
from fastapi import FastAPI
from fastapi.testclient import TestClient
from prisma.errors import PrismaError

from backend.api.features.chat import import_archive, import_archive_sync
from backend.api.features.chat.import_archive_models import ConversationToImport
from backend.api.middleware.body_limit import RequestBodyLimitMiddleware


def conversation(source="workbuddy", source_id="a" * 64):
    return {
        "source": source,
        "source_id": source_id,
        "title": "Example chat",
        "messages": [
            {"role": "user", "text": "What is the plan?"},
            {"role": "assistant", "text": "Write the outline first."},
        ],
    }


def make_client(authenticate=True):
    app = FastAPI()
    app.include_router(import_archive.router)
    app.add_middleware(RequestBodyLimitMiddleware)
    if authenticate:
        app.dependency_overrides[auth.get_request_context] = (
            lambda: auth.RequestContext(
                user_id="owner",
                org_id="active-org",
                team_id="ignored-team",
                is_org_owner=False,
                is_org_admin=False,
                is_org_billing_manager=False,
                is_team_admin=False,
                is_team_billing_manager=False,
                seat_status="ACTIVE",
            )
        )
    return TestClient(app)


def test_bulk_endpoint_authenticates_and_restricts_the_batch(monkeypatch):
    sync = AsyncMock(return_value=(1, 1))
    monkeypatch.setattr(import_archive, "sync_native_chats", sync)
    batch = {"conversations": [conversation(), conversation("qwenwork")]}
    with make_client(authenticate=False) as client:
        assert client.post("/imports/sync", json=batch).status_code == 401
    with make_client() as client:
        assert (
            client.post(
                "/imports/sync",
                json={"conversations": [conversation("qianwen", None)]},
            ).status_code
            == 422
        )
        assert (
            client.post(
                "/imports/sync", json={"conversations": [conversation()] * 26}
            ).status_code
            == 422
        )
        assert (
            client.post(
                "/imports/sync",
                content=b" " * (4 * 1024 * 1024 + 1),
                headers={"Content-Type": "application/json"},
            ).status_code
            == 413
        )
        sync.assert_not_awaited()
        response = client.post("/imports/sync", json=batch)
    assert response.status_code == 200
    assert response.json() == {"added": 1, "duplicates": 1}
    owner, organization, imported = sync.await_args.args
    assert (owner, organization) == ("owner", "active-org")
    assert [chat.source for chat in imported] == ["workbuddy", "qwenwork"]


async def test_bulk_writes_messages_only_for_new_sessions(monkeypatch):
    sessions = AsyncMock()
    messages = AsyncMock()

    @asynccontextmanager
    async def transaction():
        yield SimpleNamespace(chatsession=sessions, chatmessage=messages)

    async def find_inserted(*, where):
        ids = where["id"]["in"]
        assert len(ids) == 2
        return [SimpleNamespace(id=ids[-1])]

    sessions.create_many.return_value = 1
    sessions.find_many.side_effect = find_inserted
    monkeypatch.setattr(import_archive_sync, "transaction", transaction)
    chats = [
        ConversationToImport.model_validate(conversation(source))
        for source in ["workbuddy", "qwenwork", "workbuddy"]
    ]
    assert await import_archive_sync.sync_native_chats("owner", "org", chats) == (1, 2)
    session_rows = sessions.create_many.await_args.kwargs["data"]
    assert sessions.create_many.await_args.kwargs["skip_duplicates"] is True
    assert {row["importedSourceKey"] for row in session_rows} == {
        f"workbuddy:{'a' * 64}",
        f"qwenwork:{'a' * 64}",
    }
    for row in session_rows:
        assert row["userId"] == "owner"
        assert row["organizationId"] == "org"
        assert row.get("teamId") is None
        assert row.get("importedChatId") is None
    history = messages.create_many.await_args.kwargs["data"]
    assert [
        (row["sessionId"], row["sequence"], row["role"], row["content"])
        for row in history
    ] == [
        (session_rows[-1]["id"], 0, "user", "What is the plan?"),
        (session_rows[-1]["id"], 1, "assistant", "Write the outline first."),
    ]


def test_bulk_message_write_failure_exits_the_transaction_and_returns_503(
    monkeypatch, caplog
):
    sessions = AsyncMock()
    sessions.create_many.return_value = 1
    messages = AsyncMock()
    error = PrismaError("Private transcript should not be logged")
    messages.create_many.side_effect = error
    rollback = AsyncMock()

    @asynccontextmanager
    async def transaction():
        try:
            yield SimpleNamespace(chatsession=sessions, chatmessage=messages)
        except PrismaError as failure:
            await rollback(failure)
            raise

    monkeypatch.setattr(import_archive_sync, "transaction", transaction)
    with make_client() as client:
        response = client.post(
            "/imports/sync", json={"conversations": [conversation()]}
        )

    sessions.create_many.assert_awaited_once()
    messages.create_many.assert_awaited_once()
    rollback.assert_awaited_once_with(error)
    assert response.status_code == 503
    assert "Private transcript" not in response.text
    assert "Private transcript" not in caplog.text
