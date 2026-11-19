"""Routing and attribution for a user-selected recipient of one chat turn."""

from typing import Annotated, Literal
from uuid import UUID, uuid5

from pydantic import BaseModel, Field, TypeAdapter


class OttoRecipient(BaseModel):
    type: Literal["otto"]


class ExpertRecipient(BaseModel):
    type: Literal["expert"]
    expert_id: str = Field(min_length=1, max_length=128)


TurnRecipient = Annotated[OttoRecipient | ExpertRecipient, Field(discriminator="type")]
TURN_RECIPIENT_ADAPTER = TypeAdapter[TurnRecipient](TurnRecipient)

# These tools resume work or apply choices stored against the conversation's
# original execution scope. They need a recipient-aware storage contract first.
RECIPIENT_OVERRIDE_DISABLED_TOOLS = frozenset(
    {
        "ask_question",
        "browser_act",
        "browser_navigate",
        "browser_screenshot",
        "confirm_expert_change",
        "confirm_expert_soul_update",
        "connect_integration",
        "enter_agent_building_mode",
        "expert_onboarding",
        "resume_capability",
        "schedule_followup",
        "start_desktop",
    }
)


class ReplyRecipient(BaseModel):
    id: str | None
    name: str
    avatar_url: str | None = None


def recipient_expert_id(recipient: TurnRecipient) -> str | None:
    return recipient.expert_id if recipient.type == "expert" else None


def is_personal_chat_scope(
    session_scope: tuple[str | None, str | None],
    personal_scope: tuple[str | None, str | None],
) -> bool:
    organization_id, team_id = session_scope
    personal_org_id, default_team_id = personal_scope
    # Ordinary chats opened from personal org-home have no team header.
    return (
        organization_id is not None
        and organization_id == personal_org_id
        and (team_id is None or team_id == default_team_id)
    )


_WORKSPACE_NAMESPACE = UUID("93bd88cd-36a1-4472-9db8-dfdba4a1b73b")


def turn_workspace_id(session_id: str, expert_id: str | None) -> str:
    """A separate file directory for each visiting expert in a conversation."""
    return str(uuid5(_WORKSPACE_NAMESPACE, f"{session_id}:{expert_id or 'otto'}"))
