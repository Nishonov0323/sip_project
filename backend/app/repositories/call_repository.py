from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.call import Call


class CallRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, call_id: int) -> Call | None:
        return await self._session.get(Call, call_id)

    async def get_by_channel_id(self, channel_id: str) -> Call | None:
        result = await self._session.execute(select(Call).where(Call.channel_id == channel_id))
        return result.scalar_one_or_none()

    async def list_recent(self, limit: int = 50, offset: int = 0) -> list[Call]:
        result = await self._session.execute(
            select(Call).order_by(Call.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars())

    async def add(self, call: Call) -> Call:
        self._session.add(call)
        await self._session.commit()
        await self._session.refresh(call)
        return call

    async def save(self, call: Call) -> Call:
        await self._session.commit()
        await self._session.refresh(call)
        return call
