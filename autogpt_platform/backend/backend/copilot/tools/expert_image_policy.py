from backend.copilot.context import get_current_permissions, is_unattended_turn
from backend.copilot.expert_kickoff import is_expert_kickoff_turn
from backend.copilot.model import ChatSession
from backend.copilot.permissions import GENERATE_OPENAI_IMAGE_TOOL
from backend.integrations.providers import ProviderName

from .capability_gates import gate_denied

EXPERT_IMAGE_ONLY = "OpenAI image generation is only available in an expert chat."


def replicate_block_is_workflow_only(
    session: ChatSession, provider: str | None
) -> bool:
    """Retire Replicate's direct expert-chat route without changing workflows."""
    return provider == ProviderName.REPLICATE and _is_interactive_expert_chat(session)


def expert_image_prompt(user_id: str | None, session: ChatSession) -> str:
    if (
        not user_id
        or user_id != session.user_id
        or not _is_interactive_expert_chat(session)
        or is_expert_kickoff_turn(session)
    ):
        return ""
    heading = "\n\n### Image generation and editing in expert chat\n"
    no_fallback = (
        "Do not load or save a skill for this image step, even if one matches, "
        "and do not switch providers or use another integration, block, workflow, "
        "or script as a fallback."
    )
    if not openai_image_is_visible(session) or gate_denied("run_capability"):
        return (
            heading
            + "If the user asks to generate or edit an image in this chat, say that "
            "OpenAI image generation is unavailable on this turn. "
            + no_fallback
        )
    return (
        heading
        + "When the user asks to generate or edit an image now, in any language, call "
        f'`run_capability(id="tool:{GENERATE_OPENAI_IMAGE_TOOL}", input={{"prompt": "..."}})` '
        "directly. Use their description and relevant context; use reasonable defaults "
        "unless they ask for specific image settings. For edits, include the source "
        "`workspace://` image references in `reference_images`. Skip capability "
        "discovery for this step. Show the Markdown image from the result. If the "
        "tool returns a setup or approval card, show it and wait. Report failures. "
        + no_fallback
    )


def openai_image_is_visible(session: ChatSession) -> bool:
    return (
        not gate_denied(GENERATE_OPENAI_IMAGE_TOOL)
        and image_turn_error(session) is None
    )


def image_turn_error(session: ChatSession) -> str | None:
    if not _is_expert_chat(session):
        return EXPERT_IMAGE_ONLY
    if (
        session.dry_run
        or session.metadata.origin != "interactive"
        or is_unattended_turn()
    ):
        return "OpenAI image generation requires a live expert chat. No image was generated."
    permissions = get_current_permissions()
    if permissions is not None and not permissions.is_provider_allowed("openai"):
        return "This session's permissions do not allow using the OpenAI connection."
    return None


def _is_interactive_expert_chat(session: ChatSession) -> bool:
    return _is_expert_chat(session) and session.metadata.origin == "interactive"


def _is_expert_chat(session: ChatSession) -> bool:
    return (
        bool(session.expert_id)
        and not session.external_caller
        and not session.metadata.builder_graph_id
    )
