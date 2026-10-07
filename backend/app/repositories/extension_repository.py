from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.extension import Extension


class ExtensionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, extension_id: int) -> Extension | None:
        return await self._session.get(Extension, extension_id)

    async def get_by_number(self, number: str) -> Extension | None:
        result = await self._session.execute(select(Extension).where(Extension.number == number))
        return result.scalar_one_or_none()

    async def list(self) -> list[Extension]:
        result = await self._session.execute(select(Extension).order_by(Extension.number))
        return list(result.scalars())

    async def add(self, extension: Extension) -> Extension:
        self._session.add(extension)
        await self._session.commit()
        await self._session.refresh(extension)
        return extension

    async def delete(self, extension: Extension) -> None:
        await self._session.delete(extension)
        await self._session.commit()
