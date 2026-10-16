import logging
import secrets
import string

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.extension import Extension
from app.repositories.extension_repository import ExtensionRepository
from app.schemas.extension import ExtensionCreate, ExtensionRead
from app.sip.base import SipAccount, SipProvider

logger = logging.getLogger(__name__)

_ALPHABET = string.ascii_letters + string.digits


def generate_password(length: int = 12) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


async def sync_accounts(repo: ExtensionRepository, provider: SipProvider) -> None:
    """Bazadagi barcha hisoblarni SIP serverga yozadi."""
    accounts = [SipAccount(e.number, e.display_name, e.password) for e in await repo.list()]
    await provider.sync_accounts(accounts)


class ExtensionService:
    def __init__(self, session: AsyncSession, provider: SipProvider) -> None:
        self._repo = ExtensionRepository(session)
        self._provider = provider

    async def list(self) -> list[ExtensionRead]:
        try:
            online = await self._provider.online_numbers()
        except Exception:  # SIP server o'chiq bo'lsa ham ro'yxat ochilsin
            logger.warning("Online holatni olib bo'lmadi", exc_info=True)
            online = set()
        return [
            ExtensionRead.model_validate(e).model_copy(update={"online": e.number in online})
            for e in await self._repo.list()
        ]

    async def create(self, data: ExtensionCreate) -> Extension:
        if await self._repo.get_by_number(data.number):
            raise ConflictError(f"Raqam {data.number} allaqachon mavjud")
        extension = await self._repo.add(
            Extension(
                number=data.number, display_name=data.display_name, password=generate_password()
            )
        )
        await sync_accounts(self._repo, self._provider)
        return extension

    async def reset_password(self, extension_id: int) -> Extension:
        extension = await self._repo.get(extension_id)
        if extension is None:
            raise NotFoundError("SIP hisob topilmadi")
        extension.password = generate_password()
        extension = await self._repo.add(extension)
        await sync_accounts(self._repo, self._provider)
        return extension

    async def delete(self, extension_id: int) -> None:
        extension = await self._repo.get(extension_id)
        if extension is None:
            raise NotFoundError("SIP hisob topilmadi")
        await self._repo.delete(extension)
        await sync_accounts(self._repo, self._provider)
