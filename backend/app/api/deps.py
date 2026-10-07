from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.services.call_service import CallService
from app.services.extension_service import ExtensionService
from app.sip.base import SipProvider


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


def get_sip_provider(request: Request) -> SipProvider:
    return request.app.state.sip_provider


SessionDep = Annotated[AsyncSession, Depends(get_session)]
ProviderDep = Annotated[SipProvider, Depends(get_sip_provider)]


def get_call_service(session: SessionDep, provider: ProviderDep) -> CallService:
    return CallService(session, provider)


def get_extension_service(session: SessionDep) -> ExtensionService:
    return ExtensionService(session)


CallServiceDep = Annotated[CallService, Depends(get_call_service)]
ExtensionServiceDep = Annotated[ExtensionService, Depends(get_extension_service)]
