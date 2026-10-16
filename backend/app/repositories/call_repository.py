from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.call import Call


@dataclass(slots=True)
class CallFilter:
    q: str | None = None  # raqam, audio nomi yoki matn bo'yicha qidiruv
    status: str | None = None  # ringing | answered | completed | missed
    kind: str | None = None  # call | playback
    has_recording: bool | None = None
    created_from: datetime | None = None  # shu vaqtdan boshlab (kiritilgan vaqt zonasi bilan)
    created_before: datetime | None = None  # shu vaqtgacha (o'zi kirmaydi)


def _apply(stmt: Select, f: CallFilter) -> Select:
    if f.q:
        like = f"%{f.q.strip()}%"
        stmt = stmt.where(
            or_(
                Call.caller.ilike(like),
                Call.callee.ilike(like),
                Call.audio_name.ilike(like),
                Call.transcript.ilike(like),
            )
        )
    if f.status == "completed":
        stmt = stmt.where(Call.status == "ended", Call.answered_at.is_not(None))
    elif f.status == "missed":
        stmt = stmt.where(Call.status == "ended", Call.answered_at.is_(None))
    elif f.status:
        stmt = stmt.where(Call.status == f.status)
    if f.kind:
        stmt = stmt.where(Call.kind == f.kind)
    if f.has_recording is True:
        stmt = stmt.where(Call.recording_name.is_not(None))
    elif f.has_recording is False:
        stmt = stmt.where(Call.recording_name.is_(None))
    if f.created_from:
        stmt = stmt.where(Call.created_at >= f.created_from)
    if f.created_before:
        stmt = stmt.where(Call.created_at < f.created_before)
    return stmt


class CallRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, call_id: int) -> Call | None:
        return await self._session.get(Call, call_id)

    async def get_by_channel_id(self, channel_id: str) -> Call | None:
        result = await self._session.execute(select(Call).where(Call.channel_id == channel_id))
        return result.scalar_one_or_none()

    async def list_recent(
        self, limit: int = 50, offset: int = 0, filters: CallFilter | None = None
    ) -> list[Call]:
        stmt = select(Call).order_by(Call.created_at.desc()).limit(limit).offset(offset)
        result = await self._session.execute(_apply(stmt, filters or CallFilter()))
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
