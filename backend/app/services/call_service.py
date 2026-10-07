from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.call import Call
from app.repositories.call_repository import CallRepository
from app.repositories.extension_repository import ExtensionRepository
from app.schemas.call import OriginateRequest
from app.sip.base import ChannelInfo, SipProvider


class CallService:
    def __init__(self, session: AsyncSession, provider: SipProvider) -> None:
        self._calls = CallRepository(session)
        self._extensions = ExtensionRepository(session)
        self._provider = provider

    async def originate(self, data: OriginateRequest) -> str:
        if await self._extensions.get_by_number(data.from_extension) is None:
            raise NotFoundError(f"Extension {data.from_extension} topilmadi")
        return await self._provider.originate(data.from_extension, data.to_number)

    async def hangup(self, channel_id: str) -> None:
        await self._provider.hangup(channel_id)

    async def active_channels(self) -> list[ChannelInfo]:
        return await self._provider.list_active_channels()

    async def history(self, limit: int, offset: int) -> list[Call]:
        return await self._calls.list_recent(limit=limit, offset=offset)
