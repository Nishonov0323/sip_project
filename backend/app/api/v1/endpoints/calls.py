from fastapi import APIRouter, Query, status

from app.api.deps import CallServiceDep
from app.schemas.call import ActiveChannelRead, CallRead, OriginateRequest, OriginateResponse

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("/originate", response_model=OriginateResponse, status_code=status.HTTP_202_ACCEPTED)
async def originate_call(data: OriginateRequest, service: CallServiceDep) -> OriginateResponse:
    channel_id = await service.originate(data)
    return OriginateResponse(channel_id=channel_id)


@router.post("/{channel_id}/hangup", status_code=status.HTTP_204_NO_CONTENT)
async def hangup_call(channel_id: str, service: CallServiceDep) -> None:
    await service.hangup(channel_id)


@router.get("/active", response_model=list[ActiveChannelRead])
async def active_calls(service: CallServiceDep):
    return await service.active_channels()


@router.get("", response_model=list[CallRead])
async def call_history(
    service: CallServiceDep,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return await service.history(limit, offset)

