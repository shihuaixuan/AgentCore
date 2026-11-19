"""Turn a typed ``expert=<job title>`` (or a legacy name) into an expert.

Experts are DM-only: a server turn runs as the server-link owner but anyone
in the server types it, so it stays on Otto. A name that matches nothing, or
more than one expert, gets one short reply and no turn.
"""

import logging
from collections import Counter

from backend.platform_linking.models import BotExpert

from .adapters.base import MessageContext, PlatformAdapter
from .bot_backend import BotBackend
from .options import TurnOptions

logger = logging.getLogger(__name__)

SERVER_EXPERTS_REPLY = (
    "Experts only work in DMs for now. Message me directly to use one, "
    "or ask again without `expert=` to talk to Otto."
)


async def resolve_turn_options(
    api: BotBackend, ctx: MessageContext, adapter: PlatformAdapter
) -> TurnOptions | None:
    """``ctx.options`` with the expert resolved to an id, or None when the
    user was told why the turn can't run."""
    options = ctx.options
    if options.expert_name is None and options.expert_id is None:
        return options
    if not ctx.is_dm:
        await reply_in_place(ctx, adapter, SERVER_EXPERTS_REPLY)
        return None
    if options.expert_id is not None:
        return options
    try:
        experts = await api.list_user_experts(ctx.platform, ctx.user_id, ctx.server_id)
    except Exception:
        logger.exception("Failed to list experts for user %s", ctx.user_id)
        await reply_in_place(
            ctx, adapter, "Couldn't load your experts right now. Try again soon."
        )
        return None
    name = options.expert_name or ""
    matches = match_experts(experts, name)
    if len(matches) == 1:
        return options.model_copy(
            update={"expert_id": matches[0].id, "expert_name": matches[0].display_title}
        )
    await reply_in_place(ctx, adapter, no_single_match_reply(name, experts, matches))
    return None


def match_experts(experts: list[BotExpert], name: str) -> list[BotExpert]:
    """Match exact professions or legacy aliases before trying prefixes."""
    wanted = name.strip().casefold()
    if not wanted:
        return []
    labels = expert_labels(experts)
    exact = [
        expert
        for expert in experts
        if wanted
        in (
            expert.name.casefold(),
            expert.display_title.casefold(),
            labels[expert.id].casefold(),
        )
    ]
    if exact:
        return exact
    return [
        expert
        for expert in experts
        if expert.name.casefold().startswith(wanted)
        or expert.display_title.casefold().startswith(wanted)
    ]


def expert_labels(
    experts: list[BotExpert], *, max_length: int | None = None
) -> dict[str, str]:
    titles = Counter(expert.display_title.casefold() for expert in experts)
    positions: Counter[str] = Counter()
    labels: dict[str, str] = {}
    for expert in sorted(experts, key=lambda expert: expert.id):
        title = expert.display_title
        key = title.casefold()
        positions[key] += 1
        suffix = f" ({positions[key]})" if titles[key] > 1 else ""
        if max_length is not None:
            title = title[: max_length - len(suffix)]
        labels[expert.id] = title + suffix
    return labels


def no_single_match_reply(
    name: str, experts: list[BotExpert], matches: list[BotExpert]
) -> str:
    if matches:
        return f"More than one expert matches: {_names(matches, experts)}."
    if not experts:
        return "You haven't hired any experts yet. Hire one in AutoGPT first."
    return f'No expert called "{name}". Your experts: {_names(experts, experts)}.'


def _names(matches: list[BotExpert], experts: list[BotExpert]) -> str:
    labels = expert_labels(experts)
    return ", ".join(labels[expert.id] for expert in matches)


async def reply_in_place(
    ctx: MessageContext, adapter: PlatformAdapter, text: str
) -> None:
    """Answer where the message was, without opening a thread for it."""
    if ctx.channel_type == "channel":
        await adapter.send_reply(ctx.channel_id, text, ctx.message_id)
        return
    await adapter.send_message(ctx.channel_id, text)
