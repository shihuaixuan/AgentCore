import json
import sqlite3
from contextlib import closing

import pytest

from scripts.export_workbuddy_chats import export_workbuddy, read_messages


def test_exports_live_text_only_and_preserves_source_order(tmp_path):
    projects = tmp_path / "projects" / "fixture"
    projects.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(tmp_path / "workbuddy.db")) as database, database:
        database.execute(
            "CREATE TABLE sessions (id TEXT, user_id TEXT, title TEXT, "
            "custom_title TEXT, deleted_at INTEGER)"
        )
        database.executemany(
            "INSERT INTO sessions VALUES (?, ?, ?, ?, ?)",
            [
                ("live", "owner", "Original", "Renamed", None),
                ("deleted", "owner", "Removed", None, 100),
            ],
        )
    records = [
        {
            "id": "input",
            "type": "message",
            "role": "user",
            "content": [
                {"type": "input_text", "text": "你好"},
                {"type": "image", "data": "ignore"},
            ],
        },
        {"id": "tool", "type": "tool_result", "output": "private"},
        {
            "id": "output",
            "type": "message",
            "role": "assistant",
            "content": [{"type": "output_text", "text": "你好！"}],
        },
    ]
    for session_id in ("live", "deleted"):
        (projects / f"{session_id}.jsonl").write_text(
            "\n".join(
                json.dumps(
                    {
                        "sessionId": session_id,
                        "timestamp": "2026-11-19T00:00:00Z",
                        **row,
                    }
                )
                for row in records
            )
            + "\n",
            encoding="utf-8",
        )
    conversations = export_workbuddy(tmp_path, "owner")
    assert len(conversations) == 1
    assert conversations[0]["source"] == "workbuddy"
    assert conversations[0]["title"] == "Renamed"
    assert conversations[0]["messages"] == [
        {"role": "user", "text": "你好", "timestamp": "2026-11-19T00:00:00+00:00"},
        {
            "role": "assistant",
            "text": "你好！",
            "timestamp": "2026-11-19T00:00:00+00:00",
        },
    ]


@pytest.mark.parametrize(
    "invalid", ['{"incomplete":', '"before\\u0000after"', '"before\\ud800after"']
)
def test_bad_workbuddy_transcript_is_not_partially_exported(tmp_path, invalid):
    transcript = tmp_path / "example.jsonl"
    if invalid.startswith('"'):
        invalid = (
            '{"sessionId":"example","id":"m","type":"message","role":"user","content":[{"type":"input_text","text":'
            + invalid
            + "}]}"
        )
    transcript.write_text(invalid, encoding="utf-8")
    with pytest.raises(ValueError):
        read_messages(transcript)
