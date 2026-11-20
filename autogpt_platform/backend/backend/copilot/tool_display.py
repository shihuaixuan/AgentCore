"""Presentation metadata published by the current tool execution."""

from collections.abc import Callable, Iterator
from contextlib import contextmanager
from contextvars import ContextVar

_display_callback: ContextVar[Callable[[str], None] | None] = ContextVar(
    "tool_display_callback", default=None
)
_sub_session_callback: ContextVar[Callable[[str], None] | None] = ContextVar(
    "tool_sub_session_callback", default=None
)


@contextmanager
def tool_display_context(
    on_display_name: Callable[[str], None],
    *,
    on_sub_session: Callable[[str], None] | None = None,
) -> Iterator[None]:
    """Scope display updates to one tool task, including parallel executions."""
    token = _display_callback.set(on_display_name)
    sub_session_token = _sub_session_callback.set(on_sub_session)
    try:
        yield
    finally:
        _sub_session_callback.reset(sub_session_token)
        _display_callback.reset(token)


def emit_tool_display_name(display_name: str) -> None:
    """Publish a resolved name without coupling tools to the stream transport."""
    callback = _display_callback.get()
    name = display_name.strip()
    if callback is not None and name:
        callback(name)


def emit_tool_sub_session(session_id: str) -> None:
    """Expose the admitted child thread to the parent tool's activity row."""
    if callback := _sub_session_callback.get():
        callback(session_id)


def tool_calls_for_provider(tool_calls: list[dict]) -> list[dict]:
    """Keep UI metadata out of the provider's tool-call protocol."""
    return [
        {
            key: value
            for key, value in call.items()
            if key not in {"display_name", "sub_session_id"}
        }
        for call in tool_calls
    ]
