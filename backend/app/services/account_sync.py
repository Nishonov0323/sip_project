import asyncio
import logging

from app.db.session import SessionLocal
from app.repositories.extension_repository import ExtensionRepository
from app.services.extension_service import generate_password, sync_accounts
from app.sip.base import SipProvider

logger = logging.getLogger(__name__)


async def sync_on_startup(provider: SipProvider, attempts: int = 15, delay: float = 2.0) -> None:
    """Server ishga tushganda bazadagi hisoblarni SIP serverga yozadi (Asterisk tayyor bo'lguncha qayta uriniladi)."""
    for attempt in range(1, attempts + 1):
        try:
            async with SessionLocal() as session:
                repo = ExtensionRepository(session)
                for ext in await repo.list():
                    if not ext.password:  # parolsiz eski yozuvlar
                        ext.password = generate_password()
                        await repo.add(ext)
                await sync_accounts(repo, provider)
            logger.info("SIP hisoblar sinxronlandi")
            return
        except Exception as exc:
            logger.warning("SIP hisoblarni sinxronlash (%d/%d): %s", attempt, attempts, exc)
            await asyncio.sleep(delay)
    logger.error("SIP hisoblarni sinxronlab bo'lmadi")
