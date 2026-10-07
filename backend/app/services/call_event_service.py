import logging
from datetime import UTC, datetime

from app.db.session import SessionLocal
from app.models.call import Call, CallStatus
from app.repositories.call_repository import CallRepository
from app.sip.events import SipEvent, SipEventType
from app.ws.manager import ConnectionManager

logger = logging.getLogger(__name__)


class CallEventService:
    """SIP hodisalarini bazaga yozadi va frontend'ga WebSocket orqali uzatadi."""

    def __init__(self, ws_manager: ConnectionManager) -> None:
        self._ws = ws_manager

    async def handle(self, event: SipEvent) -> None:
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

        await self._ws.broadcast(event.to_dict())
