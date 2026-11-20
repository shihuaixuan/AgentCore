from backend.copilot.context import get_current_permissions, is_unattended_turn
from backend.copilot.expert_kickoff import is_expert_kickoff_turn
from backend.copilot.model import ChatSession
from backend.copilot.permissions import GENERATE_OPENAI_IMAGE_TOOL
from backend.integrations.providers import ProviderName

from .capability_gates import gate_denied


def replicate_block_is_workflow_only(
    session: ChatSession, provider: str | None
) -> bool:
    """Keep Replicate in workflows, not in direct image chats."""
    return provider == ProviderName.REPLICATE and _is_image_chat(session)


def expert_image_prompt(user_id: str | None, session: ChatSession) -> str:
    if (
        not user_id
        or user_id != session.user_id
        or not _is_image_chat(session)
        or is_expert_kickoff_turn(session)
    ):
        return ""
    heading = "\n\n### Image generation and editing in this chat\n"
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
        "tool requests approval, wait for it. Use the administrator's image model; "
        "omit model unless the user names one. Never ask for a personal OpenAI "
        "connection or key. Report configuration errors to the user. "
        + no_fallback
    )


def openai_image_is_visible(session: ChatSession) -> bool:
    return (
        not gate_denied(GENERATE_OPENAI_IMAGE_TOOL)
        and image_turn_error(session) is None
    )


def image_turn_error(session: ChatSession) -> str | None:
    if not _is_image_chat(session) or session.dry_run or is_unattended_turn():
        return "OpenAI image generation requires a live interactive chat. No image was generated."
    permissions = get_current_permissions()
    if permissions is not None and not permissions.is_provider_allowed("openai"):
        return "This session's permissions do not allow using the managed OpenAI-compatible image model."
    return None


def _is_image_chat(session: ChatSession) -> bool:
    return (
        session.metadata.origin == "interactive"
        and not session.external_caller
        and not session.metadata.builder_graph_id
        and (
            session.expert_id is not None
            or (
                not session.metadata.source_platform
                and not session.metadata.delegated_by_session_id
            )
        )
    )
