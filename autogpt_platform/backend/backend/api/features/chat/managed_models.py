from uuid import UUID

from autogpt_libs.auth import get_user_id, requires_admin_user
from fastapi import APIRouter, HTTPException, Request, Security

from backend.copilot import managed_models
from backend.copilot.llm_attribution import is_impersonated_request
from backend.copilot.managed_model_discovery import (
    DiscoveryFailure,
    ModelDiscoveryError,
    ModelDiscoveryRequest,
    discover_model_ids,
)
from backend.util.request import validate_url_host

router = APIRouter()
admin = APIRouter(
    prefix="/managed-models/admin", dependencies=[Security(requires_admin_user)]
)


@router.get("/managed-models", dependencies=[Security(get_user_id)])
async def list_managed_chat_models() -> list[managed_models.ChatModel]:
    return await managed_models.list_chat_models()


@admin.get("")
async def list_managed_model_settings() -> list[managed_models.ModelDetails]:
    return await managed_models.list_model_details()


@admin.post("", status_code=201)
async def create_managed_chat_model(
    data: managed_models.ModelCreate, request: Request
) -> managed_models.ModelDetails:
    _require_direct_admin(request)
    await _validate_public_url(data.base_url)
    return await managed_models.create_model(data)


@admin.post("/discover")
async def discover_managed_chat_models(
    data: ModelDiscoveryRequest, request: Request
) -> list[str]:
    _require_direct_admin(request)
    try:
        return await discover_model_ids(data)
    except ModelDiscoveryError as exc:
        status = {
            DiscoveryFailure.INVALID_CONNECTION: 422,
            DiscoveryFailure.REJECTED_KEY: 424,
            DiscoveryFailure.NOT_SUPPORTED: 404,
            DiscoveryFailure.UNAVAILABLE: 502,
            DiscoveryFailure.TIMED_OUT: 504,
        }[exc.reason]
        raise HTTPException(status, exc.reason.value) from None


@admin.patch("/{model_id}")
async def update_managed_chat_model(
    model_id: UUID, data: managed_models.ModelUpdate, request: Request
) -> managed_models.ModelDetails:
    _require_direct_admin(request)
    if data.base_url is not None:
        await _validate_public_url(data.base_url)
    try:
        result = await managed_models.update_model(str(model_id), data)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    if result is None:
        raise HTTPException(404, "Chat model not found.")
    return result


async def _validate_public_url(base_url: str) -> None:
    try:
        await validate_url_host(base_url)
    except ValueError as exc:
        raise HTTPException(
            422, "The Base URL must resolve to a public address."
        ) from exc


def _require_direct_admin(request: Request) -> None:
    if is_impersonated_request(request):
        raise HTTPException(403, "Stop impersonating to change chat model settings.")


async def require_chat_model(model_id: UUID | None) -> str:
    try:
        return await managed_models.select_chat_model(
            str(model_id) if model_id else None
        )
    except managed_models.ModelUnavailable as exc:
        raise HTTPException(409, "No selected model is available for chat.") from exc


router.include_router(admin)
