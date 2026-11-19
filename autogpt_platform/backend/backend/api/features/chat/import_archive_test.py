from unittest.mock import AsyncMock

import pytest
from autogpt_libs import auth
from fastapi import FastAPI
from fastapi.testclient import TestClient
from prisma.errors import PrismaError
from pydantic import ValidationError

from backend.api.features.chat import import_archive
from backend.api.features.chat.import_archive_models import (
    ConversationToImport,
    ImportedMessage,
)


def test_import_validates_roles_and_uses_authenticated_owner(monkeypatch):
    archive = AsyncMock(return_value=(1, 0))
    monkeypatch.setattr(import_archive, "save_conversations", archive)
    app = FastAPI()
    app.dependency_overrides[auth.get_user_id] = lambda: "authenticated-user"
    app.include_router(import_archive.router)
    conversation = {
        "source": "qianwen",
        "title": "Fixture",
        "messages": [{"role": "tool", "text": "not an archived message"}],
    }
    with TestClient(app) as client:
        assert (
            client.post("/imports", json={"conversations": [conversation]}).status_code
            == 422
        )
        archive.assert_not_awaited()
        conversation["messages"][0]["role"] = "assistant"
        response = client.post("/imports", json={"conversations": [conversation]})
        assert response.status_code == 200
        assert response.json() == {"added": 1, "duplicates": 0}
        assert archive.await_args.args[0] == "authenticated-user"


def test_without_an_authenticated_owner_no_archive_is_returned(monkeypatch):
    query = AsyncMock()
    monkeypatch.setattr(import_archive, "query_raw_with_schema", query)
    app = FastAPI()
    app.include_router(import_archive.router)
    with TestClient(app) as client:
        assert client.get("/imports").status_code == 401
    query.assert_not_awaited()


def test_database_errors_do_not_echo_archive_contents(monkeypatch, caplog):
    private_text = "private synthetic transcript"
    monkeypatch.setattr(
        import_archive,
        "save_conversations",
        AsyncMock(side_effect=PrismaError(private_text)),
    )
    app = FastAPI()
    app.dependency_overrides[auth.get_user_id] = lambda: "authenticated-user"
    app.include_router(import_archive.router)
    with TestClient(app) as client:
        response = client.post(
            "/imports",
            json={
                "conversations": [
                    {
                        "source": "qianwen",
                        "title": "Fixture",
                        "messages": [{"role": "user", "text": private_text}],
                    }
                ]
            },
        )
    assert response.status_code == 503
    assert private_text not in response.text
    assert private_text not in caplog.text


@pytest.mark.parametrize(
    "fields",
    [
        {"text": "invalid\x00text"},
        {"text": "invalid\ud800text"},
        {"timestamp": "2026-11-19T12:30:00"},
    ],
)
def test_postgres_unsafe_text_and_naive_dates_are_rejected(fields):
    with pytest.raises(ValidationError):
        ImportedMessage.model_validate({"role": "user", "text": "okay", **fields})


def test_qianwen_fingerprint_ignores_title_and_line_ending_convention():
    def chat(title: str, text: str, role: str = "user") -> ConversationToImport:
        return ConversationToImport.model_validate(
            {
                "source": "qianwen",
                "title": title,
                "messages": [{"role": role, "text": text}],
            }
        )

    original = chat("Original", "line 1\r\nline 2")
    assert original.fingerprint() == chat("Renamed", "line 1\nline 2").fingerprint()
    assert (
        original.fingerprint()
        != chat("Original", "line 1\nline 2", "assistant").fingerprint()
    )
