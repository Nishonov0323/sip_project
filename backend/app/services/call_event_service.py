import logging
from datetime import UTC

from app.db.session import SessionLocal
from app.models.call import Call, CallStatus
from app.repositories.call_repository import CallRepository
from app.services.transcription_service import TranscriptionService
from app.sip.events import SipEvent, SipEventType
from app.ws.manager import ConnectionManager

logger = logging.getLogger(__name__)


class CallEventService:
    """SIP hodisalarini bazaga yozadi va frontend'ga WebSocket orqali uzatadi."""

    def __init__(self, ws_manager: ConnectionManager, transcriber: TranscriptionService) -> None:
        self._ws = ws_manager
        self._transcriber = transcriber

    async def handle(self, event: SipEvent) -> None:
        transcribe_call_id: int | None = None

        async with SessionLocal() as session:
            repo = CallRepository(session)
            call = await repo.get_by_channel_id(event.channel_id)

            if event.type == SipEventType.CALL_STARTED and call is None:
                await repo.add(
                    Call(
                        channel_id=event.channel_id,
                        caller=event.caller,
                        callee=event.callee,
                        status=CallStatus.RINGING.value,
                        kind=event.kind,
                        audio_name=event.audio_name or None,
                    )
                )
            elif call is not None and event.type == SipEventType.CALL_ANSWERED:
                call.status = CallStatus.ANSWERED.value
                call.answered_at = event.timestamp
                await repo.save(call)
            elif call is not None and event.type == SipEventType.CALL_ENDED:
                call.status = CallStatus.ENDED.value
                call.ended_at = event.timestamp
                if call.answered_at:
                    call.duration_seconds = int(
                        (event.timestamp - call.answered_at.astimezone(UTC)).total_seconds()
                    )
                await repo.save(call)
            elif call is not None and event.type == SipEventType.RECORDING_READY:
                call.recording_name = event.recording_name
                await repo.save(call)
                if self._transcriber.enabled:
                    transcribe_call_id = call.id

        await self._ws.broadcast(event.to_dict())
        if transcribe_call_id is not None:
            self._transcriber.schedule(transcribe_call_id)
