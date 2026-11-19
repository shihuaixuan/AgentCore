"""Export local WorkBuddy 5.x text conversations without changing the source."""

import argparse
import hashlib
import json
import sqlite3
import sys
from contextlib import closing
from datetime import UTC, datetime
from pathlib import Path

MAX_TRANSCRIPT_BYTES = 32 * 1024 * 1024
MAX_REQUEST_BYTES = 4 * 1024 * 1024
MAX_TEXT_LENGTH = 100_000
MAX_MESSAGES = 500


def export_workbuddy(root: Path, account: str | None = None) -> list[dict]:
    with closing(
        sqlite3.connect(
            (root / "workbuddy.db").resolve().as_uri() + "?mode=ro", uri=True
        )
    ) as database:
        database.execute("PRAGMA query_only=ON")
        accounts = [
            row[0]
            for row in database.execute(
                "SELECT DISTINCT user_id FROM sessions "
                "WHERE deleted_at IS NULL AND user_id IS NOT NULL AND user_id != ''"
            )
        ]
        if account is None:
            if len(accounts) > 1:
                raise ValueError(
                    "Multiple WorkBuddy accounts found; pass --account with one of: "
                    + ", ".join(accounts)
                )
            if not accounts:
                return []
            account = accounts[0]
        sessions = dict(
            database.execute(
                "SELECT id, COALESCE(NULLIF(custom_title, ''), title) FROM sessions "
                "WHERE deleted_at IS NULL AND user_id = ?",
                (account,),
            )
        )

    projects = (root / "projects").resolve()
    transcripts: dict[str, list[dict]] = {}
    for path in sorted(projects.glob("*/*.jsonl")):
        if path.stem not in sessions or not path.resolve().is_relative_to(projects):
            continue
        if path.stem in transcripts:
            raise ValueError("Multiple files match the same WorkBuddy session.")
        messages = read_messages(path)
        if messages:
            transcripts[path.stem] = messages
    conversations = [
        {
            "source": "workbuddy",
            "source_id": hashlib.sha256(
                f"{account}\0{session_id}".encode()
            ).hexdigest(),
            "title": (sessions[session_id] or "WorkBuddy").strip()[:200] or "WorkBuddy",
            "messages": messages,
        }
        for session_id, messages in transcripts.items()
    ]
    for conversation in conversations:
        title = conversation["title"]
        validate_text(title)
        body = json.dumps(
            {"conversations": [conversation]}, ensure_ascii=False, separators=(",", ":")
        )
        if len(body.encode("utf-8")) > MAX_REQUEST_BYTES:
            raise ValueError(
                "A WorkBuddy conversation exceeds the 4 MiB per-request limit."
            )
    return conversations


def read_messages(path: Path) -> list[dict]:
    messages: dict[str, dict] = {}
    with path.open("rb") as transcript:
        if path.stat().st_size > MAX_TRANSCRIPT_BYTES:
            raise ValueError("A WorkBuddy transcript exceeds the supported file size.")
        for index, line in enumerate(transcript, start=1):
            if not line.strip():
                continue
            try:
                event = json.loads(line.decode("utf-8-sig"))
            except (UnicodeError, ValueError):
                raise ValueError(
                    f"Malformed WorkBuddy transcript at line {index}. "
                    "If WorkBuddy is still writing, wait for the task to finish and retry."
                ) from None
            if not isinstance(event, dict) or event.get("sessionId") != path.stem:
                continue
            parsed = parse_message(event)
            if parsed is not None:
                message_id, message = parsed
                messages[message_id] = message
                if len(messages) > MAX_MESSAGES:
                    raise ValueError(
                        "A WorkBuddy conversation exceeds 500 text messages."
                    )
    return list(messages.values())


def parse_message(event: dict) -> tuple[str, dict] | None:
    role = event.get("role")
    message_id = event.get("id")
    content = event.get("content")
    if (
        event.get("type") != "message"
        or role not in ("user", "assistant")
        or not isinstance(message_id, str)
        or not message_id
        or not isinstance(content, list)
    ):
        return None
    block_type = "input_text" if role == "user" else "output_text"
    text = "\n".join(
        block["text"]
        for block in content
        if isinstance(block, dict)
        and block.get("type") in (block_type, "text")
        and isinstance(block.get("text"), str)
        and block["text"].strip()
    )
    if not text:
        return None
    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError("A WorkBuddy message exceeds 100,000 characters.")
    validate_text(text)
    return message_id, {
        "role": role,
        "text": text,
        "timestamp": normalize_timestamp(event.get("timestamp")),
    }


def normalize_timestamp(value: object) -> str | None:
    try:
        if isinstance(value, str):
            parsed = datetime.fromisoformat(value)
            if parsed.tzinfo is None:
                return None
            parsed.astimezone(UTC)
            return parsed.isoformat()
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            seconds = value / 1000 if abs(value) >= 100_000_000_000 else value
            return datetime.fromtimestamp(seconds, UTC).isoformat()
    except (ValueError, OverflowError, OSError):
        return None
    return None


def validate_text(text: str) -> None:
    if "\x00" in text:
        raise ValueError("WorkBuddy text contains a null character.")
    try:
        text.encode("utf-8")
    except UnicodeEncodeError:
        raise ValueError("WorkBuddy text is not valid Unicode.") from None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.home() / ".workbuddy")
    parser.add_argument("--account", help="Source account ID when multiple are present")
    parser.add_argument("--output", type=Path, required=True, help="New JSON file")
    args = parser.parse_args()
    try:
        conversations = export_workbuddy(args.root, args.account)
        if not conversations:
            raise ValueError("No readable, non-deleted text conversations found.")
        data = json.dumps(
            {"version": 1, "conversations": conversations}, ensure_ascii=False
        ).encode("utf-8")
        with args.output.open("xb") as output:
            output.write(data)
    except (sqlite3.Error, OSError, ValueError) as error:
        print(f"Export failed: {error}", file=sys.stderr)
        return 1
    print(
        f"Exported {len(conversations)} conversations. The file contains private text."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
