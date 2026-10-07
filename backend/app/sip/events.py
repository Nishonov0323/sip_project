from collections.abc import Awaitable, Callable
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from enum import StrEnum


class SipEventType(StrEnum):
    CALL_STARTED = "call_started"
    CALL_ANSWERED = "call_answered"
    CALL_ENDED = "call_ended"


@dataclass(slots=True)
class SipEvent:
    """Provider'dan mustaqil (Asterisk/FreeSWITCH) umumiy SIP hodisa."""

    type: SipEventType
    channel_id: str
    caller: str = ""
    callee: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))

    def to_dict(self) -> dict:
        data = asdict(self)
        data["type"] = self.type.value
        data["timestamp"] = self.timestamp.isoformat()
        return data


SipEventHandler = Callable[[SipEvent], Awaitable[None]]
