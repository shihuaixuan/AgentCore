import json
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from autogpt_libs import auth
from fastapi import FastAPI
from fastapi.testclient import TestClient
from prisma.errors import PrismaError

from backend.api.features.chat import import_archive
from backend.api.middleware.body_limit import RequestBodyLimitMiddleware

MIB = 1024 * 1024
CONVERSATION = {
    "source": "workbuddy",
    "source_id": "a" * 64,
    "title": "Archive fixture",
    "messages": [{"role": "user", "text": "private transcript fixture"}],
}
IMPORT_URL = "/imports/with-attachments"


def archive_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(RequestBodyLimitMiddleware)
    app.include_router(import_archive.router)
    return app


def conversation_part(value: str = json.dumps(CONVERSATION)):
    return ("conversation", (None, value))


@pytest.fixture
def client():
    app = archive_app()
    app.dependency_overrides[auth.get_user_id] = lambda: "owner"
    with TestClient(app) as client:
        yield client


@pytest.fixture
def archive_boundary(monkeypatch):
    save = AsyncMock(return_value=(0, 1))
    scan = AsyncMock(return_value=SimpleNamespace(is_clean=True))
    scanner = SimpleNamespace(
        scan_file=scan,
        settings=SimpleNamespace(
            clamav_service_enabled=True, mark_failed_scans_as_clean=False
        ),
    )
    monkeypatch.setattr(
        import_archive, "save_conversation_with_attachments", save, raising=False
    )
    monkeypatch.setattr(
        import_archive, "get_virus_scanner", lambda: scanner, raising=False
    )
    return save, scanner


def test_multipart_scans_and_saves_under_authenticated_owner(client, archive_boundary):
    save, scanner = archive_boundary
    response = client.post(
        IMPORT_URL,
        files=[conversation_part(), ("files", (r"C:\private\资料.txt", b"\xffbytes"))],
    )
    assert response.status_code == 200
    assert response.json() == {"added": 0, "duplicates": 1}
    scanner.scan_file.assert_awaited_once_with(b"\xffbytes")
    owner, conversation, attachments = save.await_args.args
    assert owner == "owner"
    assert conversation.model_dump(exclude_none=True) == CONVERSATION
    assert [(item.name, item.content) for item in attachments] == [
        ("资料.txt", b"\xffbytes")
    ]


def test_multipart_authenticates_before_reading_body():
    def unreadable_body():
        raise AssertionError("An unauthenticated body must not be read")
        yield b""

    with TestClient(archive_app()) as client:
        response = client.post(IMPORT_URL, content=unreadable_body())
    assert response.status_code == 401


@pytest.mark.parametrize(
    ("parts", "status"),
    [
        ([conversation_part("malformed private JSON")], 422),
        (
            [
                conversation_part(
                    json.dumps({**CONVERSATION, "source": "qianwen", "source_id": None})
                )
            ],
            422,
        ),
        ([conversation_part(), conversation_part()], 400),
        (
            [
                ("conversation", ("unexpected-file", b"data")),
                conversation_part(),
                ("files", ("file", b"data")),
            ],
            422,
        ),
        ([conversation_part(), ("files", (None, r"C:\PRIVATE\path-only.txt"))], 400),
        ([conversation_part(), ("unexpected", ("actual.txt", b"data"))], 422),
        ([conversation_part(), ("files", ("large.txt", b"a" * (5 * MIB + 1)))], 413),
        ([conversation_part(), *[("files", ("file", b"a" * (4 * MIB)))] * 3], 413),
        ([conversation_part(), *[("files", ("file", b"a"))] * 11], 400),
    ],
)
def test_invalid_multipart_is_rejected_before_scanning_or_writing(
    client, archive_boundary, caplog, parts, status
):
    save, scanner = archive_boundary
    response = client.post(IMPORT_URL, files=parts)
    assert response.status_code == status
    assert "private" not in (response.text + caplog.text).lower()
    scanner.scan_file.assert_not_awaited()
    save.assert_not_awaited()


def test_chunked_multipart_has_a_16_mib_ceiling(client, archive_boundary):
    save, scanner = archive_boundary
    declared = client.post(
        IMPORT_URL,
        headers={
            "Content-Type": "multipart/form-data; boundary=fixture",
            "Content-Length": str(16 * MIB + 1),
        },
        content=b"",
    )
    assert declared.status_code == 413

    def body():
        yield b'--fixture\r\nContent-Disposition: form-data; name="files"; filename="file"\r\n\r\n'
        for _ in range(16):
            yield b"a" * MIB

    streamed = client.post(
        IMPORT_URL,
        headers={"Content-Type": "multipart/form-data; boundary=fixture"},
        content=body(),
    )
    assert streamed.status_code == 413
    scanner.scan_file.assert_not_awaited()
    save.assert_not_awaited()


@pytest.mark.parametrize(
    ("failure", "status"),
    [("detected", 422), ("unavailable", 503), ("disabled", 503), ("fail-open", 503)],
)
def test_rejected_scan_cannot_save_anything(
    client, archive_boundary, caplog, failure, status
):
    save, scanner = archive_boundary
    if failure == "detected":
        scanner.scan_file.side_effect = [
            SimpleNamespace(is_clean=True),
            SimpleNamespace(is_clean=False),
        ]
    elif failure == "unavailable":
        scanner.scan_file.side_effect = RuntimeError("private scanner detail")
    elif failure == "disabled":
        scanner.settings.clamav_service_enabled = False
    else:
        scanner.settings.mark_failed_scans_as_clean = True
    response = client.post(
        IMPORT_URL,
        files=[
            conversation_part(),
            ("files", ("private-first", b"one")),
            ("files", ("private-second", b"two")),
        ],
    )
    assert response.status_code == status
    assert "private" not in (response.text + caplog.text).lower()
    save.assert_not_awaited()


def test_multipart_database_errors_do_not_echo_parameters(
    client, archive_boundary, caplog
):
    save, _ = archive_boundary
    save.side_effect = PrismaError("private transcript and attachment payload")
    response = client.post(
        IMPORT_URL, files=[conversation_part(), ("files", ("fixture.txt", b"data"))]
    )
    assert response.status_code == 503
    assert "private" not in (response.text + caplog.text).lower()


def test_truncated_multipart_does_not_save_completed_parts(client, archive_boundary):
    save, _ = archive_boundary
    response = client.post(
        IMPORT_URL,
        headers={"Content-Type": "multipart/form-data; boundary=fixture"},
        content=(
            b'--fixture\r\nContent-Disposition: form-data; name="conversation"\r\n\r\n'
            + json.dumps(CONVERSATION).encode()
            + b'\r\n--fixture\r\nContent-Disposition: form-data; name="files"; filename="one"'
            b'\r\n\r\none\r\n--fixture\r\nContent-Disposition: form-data; name="files"; filename="two"'
            b"\r\n\r\ntruncated"
        ),
    )
    assert response.status_code == 400
    save.assert_not_awaited()


def test_multipart_conversation_over_4_mib_is_rejected(client, archive_boundary):
    response = client.post(
        IMPORT_URL,
        files=[
            conversation_part(json.dumps(CONVERSATION).ljust(4 * MIB + 1)),
            ("files", ("file", b"data")),
        ],
    )
    assert response.status_code == 413


def test_empty_attachment_rejected_before_scan(client, archive_boundary):
    _, scanner = archive_boundary
    response = client.post(
        IMPORT_URL, files=[conversation_part(), ("files", ("empty.txt", b""))]
    )
    assert response.status_code == 422
    scanner.scan_file.assert_not_awaited()
