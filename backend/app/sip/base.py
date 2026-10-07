from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.sip.events import SipEventHandler


@dataclass(slots=True)
class ChannelInfo:
    channel_id: str
    state: str
    caller: str = ""
    callee: str = ""


class SipProvider(ABC):
    """SIP server bilan ishlash uchun umumiy interfeys.

    Yangi server (masalan, FreeSWITCH) qo'shish uchun shu klassdan meros olinadi.
    """

    name: str

    def __init__(self) -> None:
        self._handlers: list[SipEventHandler] = []

    def subscribe(self, handler: SipEventHandler) -> None:
        self._handlers.append(handler)

    @abstractmethod
    async def start(self) -> None: ...

    @abstractmethod
    async def stop(self) -> None: ...

    @abstractmethod
    async def originate(self, from_extension: str, to_number: str) -> str:
        """Qo'ng'iroq boshlaydi va channel_id qaytaradi."""

    @abstractmethod
    async def hangup(self, channel_id: str) -> None: ...

    @abstractmethod
    async def list_active_channels(self) -> list[ChannelInfo]: ...
