from unittest.mock import AsyncMock, Mock

import pytest
from prisma.enums import ReviewStatus

from backend.blocks.ai_image_generator_block import AIImageGeneratorBlock
from backend.blocks.replicate.replicate_block import ReplicateModelBlock
from backend.copilot.capabilities.ranking import ConnectionState
from backend.copilot.capabilities.registry import get_registry
from backend.copilot.gate.subject import NO_OP
from backend.copilot.model import ChatSession

from . import find_capability, run_capability
from .describe_capability import DescribeCapabilityTool
from .find_capability import FindCapabilityTool
from .models import BlockDetailsResponse, CapabilityListResponse, ErrorResponse
from .resume_capability import ResumeCapabilityTool
from .run_capability import RunCapabilityTool

USER = "image-routing-user"
EXPERT = "image-routing-expert"
IMAGE_BLOCK = AIImageGeneratorBlock()
REPLICATE_RUNNER = ReplicateModelBlock()


@pytest.mark.parametrize(
    "context, kind, expert_id, shows_replicate",
    [
        ("direct", None, EXPERT, False),
        ("direct", "tool", EXPERT, False),
        ("graph", "block", EXPERT, True),
        ("direct", "block", None, False),
        ("graph", "block", None, True),
    ],
)
async def test_replicate_search_is_filtered_only_in_direct_chat(
    mocker, context, kind, expert_id, shows_replicate
):
    session = ChatSession.new(USER, dry_run=False, expert_id=expert_id)
    index = get_registry()
    mocker.patch.object(find_capability, "session_registry", return_value=index)
    mocker.patch.object(
        find_capability,
        "load_connection_state",
        return_value=ConnectionState(providers=frozenset({"replicate"})),
    )
    retired_ids = {
        entry.id
        for entry in index.entries
        if entry.kind == "block" and entry.connection.key == "replicate"
    }
    assert {f"block:{IMAGE_BLOCK.id}", f"block:{REPLICATE_RUNNER.id}"} <= retired_ids

    result = await FindCapabilityTool()._execute(
        USER, session, context=context, query="Replicate", kind=kind
    )
    listings = (
        result.capabilities + result.fallback + result.other_kinds
        if isinstance(result, CapabilityListResponse)
        else []
    )
    matches = retired_ids & {entry["id"] for entry in listings}
    assert bool(matches) is shows_replicate


@pytest.mark.parametrize(
    "capability_id, inputs",
    [
        (f"block:{IMAGE_BLOCK.id}", {"prompt": "一只猫"}),
        (IMAGE_BLOCK.id, {"connect": True}),
        (REPLICATE_RUNNER.name, {"model_name": "black-forest-labs/flux-schnell"}),
    ],
)
@pytest.mark.parametrize("expert_id", [EXPERT, pytest.param(None, id="office")])
async def test_chat_cannot_run_or_connect_a_legacy_block(
    mocker, capability_id, inputs, expert_id
):
    credentials = mocker.patch(
        "backend.copilot.tools.helpers.resolve_block_credentials",
        side_effect=AssertionError("A retired block must not resolve credentials"),
    )
    session = ChatSession.new(USER, dry_run=False, expert_id=expert_id)

    result = await RunCapabilityTool()._execute(
        USER, session, id=capability_id, input=inputs
    )

    assert isinstance(result, ErrorResponse)
    assert "OpenAI" in result.message
    credentials.assert_not_awaited()


async def test_retired_block_never_reaches_the_approval_gate(mocker):
    credentials = mocker.patch.object(
        run_capability, "resolve_block_credentials", return_value=({}, [])
    )
    session = ChatSession.new(USER, dry_run=False, expert_id=EXPERT)
    subject = await RunCapabilityTool().gate_subject(
        USER,
        session,
        {
            "id": f"block:{REPLICATE_RUNNER.id}",
            "input": {"model_name": "black-forest-labs/flux-schnell"},
        },
    )
    assert subject is NO_OP
    credentials.assert_not_awaited()


@pytest.mark.parametrize("overrides", [None, {"prompt": "一只狗"}])
async def test_expert_rechecks_old_replicate_approvals_before_resuming(
    mocker, overrides
):
    session = ChatSession.new(USER, dry_run=False, expert_id=EXPERT)
    review_id = f"copilot-node-{IMAGE_BLOCK.id}:ab12"
    review = Mock(
        session_id=session.session_id,
        status=ReviewStatus.APPROVED,
        payload={"prompt": "一只猫"},
    )
    reviews = Mock(
        get_reviews_by_node_exec_ids=AsyncMock(return_value={review_id: review}),
        claim_approved_review=AsyncMock(side_effect=AssertionError("Claimed review")),
    )
    for tool in ("resume_capability", "continue_run_block"):
        mocker.patch(f"backend.copilot.tools.{tool}.review_db", return_value=reviews)
    credentials = mocker.patch(
        "backend.copilot.tools.continue_run_block.resolve_block_credentials",
        side_effect=AssertionError("A retired block must not resolve credentials"),
    )

    result = await ResumeCapabilityTool()._execute(
        USER, session, review_id=review_id, input_overrides=overrides
    )

    assert isinstance(result, ErrorResponse)
    assert "OpenAI" in result.message
    reviews.claim_approved_review.assert_not_awaited()
    credentials.assert_not_awaited()


async def test_expert_can_inspect_legacy_workflow_block_schema_without_credentials(
    mocker,
):
    credentials = mocker.patch(
        "backend.copilot.tools.helpers.resolve_block_credentials",
        side_effect=AssertionError("Schema inspection does not need credentials"),
    )
    session = ChatSession.new(USER, dry_run=False, expert_id=EXPERT)

    result = await DescribeCapabilityTool()._execute(
        USER, session, id=f"block:{IMAGE_BLOCK.id}"
    )

    assert isinstance(result, BlockDetailsResponse)
    assert "for workflows only" in result.message
    assert "prompt" in result.block.inputs["properties"]
    credentials.assert_not_awaited()


@pytest.mark.parametrize("origin", ["automation", None])
async def test_expert_workflow_sessions_keep_their_existing_block_routes(
    mocker, origin
):
    credentials = mocker.patch(
        "backend.copilot.tools.helpers.resolve_block_credentials", return_value=({}, [])
    )
    session = ChatSession.new(USER, dry_run=False, expert_id=EXPERT)
    session.metadata.origin = origin

    result = await RunCapabilityTool()._execute(
        USER, session, id=IMAGE_BLOCK.id, input={}, validate_only=True
    )

    assert isinstance(result, BlockDetailsResponse)
    credentials.assert_awaited_once()
