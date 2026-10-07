from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.extension import Extension
from app.repositories.extension_repository import ExtensionRepository
from app.schemas.extension import ExtensionCreate


class ExtensionService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = ExtensionRepository(session)

    async def list(self) -> list[Extension]:
        return await self._repo.list()

    async def create(self, data: ExtensionCreate) -> Extension:
        if await self._repo.get_by_number(data.number):
            raise ConflictError(f"Raqam {data.number} allaqachon mavjud")
        return await self._repo.add(
            Extension(number=data.number, display_name=data.display_name)
        )

    async def delete(self, extension_id: int) -> None:
        extension = await self._repo.get(extension_id)
        if extension is None:
            raise NotFoundError("Extension topilmadi")
        await self._repo.delete(extension)
