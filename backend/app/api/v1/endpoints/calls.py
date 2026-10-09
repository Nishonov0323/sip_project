from fastapi import APIRouter, Query, status
from fastapi.responses import FileResponse

from app.api.deps import CallServiceDep
from app.schemas.call import (
    ActiveChannelRead,
    CallRead,
    OriginateRequest,
    OriginateResponse,
    PlaybackRequest,
)

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("/originate", response_model=OriginateResponse, status_code=status.HTTP_202_ACCEPTED)
async def originate_call(data: OriginateRequest, service: CallServiceDep) -> OriginateResponse:
    channel_id = await service.originate(data)
    return OriginateResponse(channel_id=channel_id)


@router.post("/playback", response_model=OriginateResponse, status_code=status.HTTP_202_ACCEPTED)
async def playback_call(data: PlaybackRequest, service: CallServiceDep) -> OriginateResponse:
    """Avto-qo'ng'iroq: raqamga qo'ng'iroq qiladi, audioni ijro etadi va javobni yozib oladi."""
    channel_id = await service.originate_playback(data)
    return OriginateResponse(channel_id=channel_id)


@router.post("/{channel_id}/hangup", status_code=status.HTTP_204_NO_CONTENT)
async def hangup_call(channel_id: str, service: CallServiceDep) -> None:
    await service.hangup(channel_id)


@router.get("/active", response_model=list[ActiveChannelRead])
async def active_calls(service: CallServiceDep):
    return await service.active_channels()


@router.get("/{call_id}/recording")
async def call_recording(call_id: int, service: CallServiceDep) -> FileResponse:
    path = await service.recording_path(call_id)
    return FileResponse(path, media_type="audio/wav", filename=f"call-{call_id}.wav")


@router.post(
    "/{call_id}/transcribe", response_model=CallRead, status_code=status.HTTP_202_ACCEPTED
)
async def transcribe_call(call_id: int, service: CallServiceDep):
    return await service.transcribe(call_id)


@router.get("", response_model=list[CallRead])
async def call_history(
    service: CallServiceDep,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return await service.history(limit, offset)
