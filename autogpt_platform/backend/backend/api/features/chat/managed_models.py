from uuid import UUID

from autogpt_libs.auth import get_user_id, requires_admin_user
from fastapi import APIRouter, HTTPException, Request, Security

from backend.copilot import managed_models
from backend.copilot.llm_attribution import is_impersonated_request
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
