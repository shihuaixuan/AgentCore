"""Human review for MCP calls made through ``run_capability``.

With the Auto Mode gate off, an opted-in catalog server uses its effect map
and asks about tools that are not known reads. Other catalog servers keep
their legacy behavior, and uncatalogued servers ask when a tool looks like
a write. With the gate on, ``gate/subject.py`` classifies the call instead.

Records reuse the block review table with a synthetic node id so the
existing approval UI, the pending-review feed and ``resume_capability`` all
work unchanged.
"""

import re
import uuid
from typing import Any

from pydantic import BaseModel

from backend.copilot.constants import (
    COPILOT_NODE_EXEC_ID_SEPARATOR,
    COPILOT_SYNTHETIC_ID_PREFIX,
)
from backend.data.db_accessors import review_db
from backend.integrations.mcp_catalog import mcp_effect_map_for_url
from backend.util.json import same_json

COPILOT_MCP_NODE_PREFIX = f"{COPILOT_SYNTHETIC_ID_PREFIX}mcp-"

_WRITE_VERBS = re.compile(
    r"(^|[_\-.\s])(create|update|delete|remove|send|post|write|set|add|upload|"
    r"publish|archive|merge|close|assign|move|rename|execute|run|trigger|"
    r"cancel|approve|reject|pay|transfer|invite|grant|revoke|reset)([_\-.\s]|$)",
    re.IGNORECASE,
)
_READ_VERBS = re.compile(
    r"(^|[_\-.\s])(get|list|search|find|read|fetch|query|describe|show|"
    r"lookup|check|count|view)([_\-.\s]|$)",
    re.IGNORECASE,
)


class MCPReviewPayload(BaseModel):
    """What ``resume_capability`` needs to replay an approved MCP call."""

    server_url: str
    tool: str
    arguments: dict[str, Any]
    connection_id: str | None = None
    credential_id: str | None = None


def looks_like_write(tool_name: str) -> bool:
    if _READ_VERBS.search(tool_name) and not _WRITE_VERBS.search(tool_name):
        return False
    return bool(_WRITE_VERBS.search(tool_name)) or not _READ_VERBS.search(tool_name)


def needs_review(server_url: str, tool_name: str, *, catalog_server: bool) -> bool:
    effects = mcp_effect_map_for_url(server_url)
    if effects and effects.review_when_gate_inactive:
        return effects.effect_of(tool_name) != "read"
    return not catalog_server and looks_like_write(tool_name)


def is_mcp_review_id(review_id: str) -> bool:
    return review_id.startswith(COPILOT_MCP_NODE_PREFIX)


def mcp_review_node_id(host: str) -> str:
    return f"{COPILOT_MCP_NODE_PREFIX}{host}"


async def open_mcp_review(
    *,
    user_id: str,
    session_id: str,
    host: str,
    payload: MCPReviewPayload,
    organization_id: str | None,
    team_id: str | None,
) -> str:
    """Store a WAITING review for the call and return its review id.

    An identical pending call (same server, tool and arguments) reuses its
    review so a retried ``run_capability`` does not stack approvals.
    """
    node_id = mcp_review_node_id(host)
    data = payload.model_dump(exclude_none=True)
    for review in await review_db().get_pending_reviews_for_chat_session(
        session_id, user_id
    ):
        try:
            previous = MCPReviewPayload.model_validate(review.payload).model_dump(
                exclude_none=True
            )
        except (ValueError, TypeError):
            continue
        if (
            review.node_id == node_id
            and review.status.value == "WAITING"
            and same_json(previous, data)
        ):
            return review.node_exec_id
    review_id = f"{node_id}{COPILOT_NODE_EXEC_ID_SEPARATOR}{uuid.uuid4().hex[:8]}"
    await review_db().get_or_create_human_review(
        user_id=user_id,
        node_exec_id=review_id,
        chat_session_id=session_id,
        input_data=data,
        message=f"Run MCP tool '{payload.tool}' on {host} with the shown arguments?",
        editable=True,
        organization_id=organization_id,
        team_id=team_id,
    )
    return review_id
