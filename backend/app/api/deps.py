from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.services.audio_service import AudioService
from app.services.call_service import CallService
from app.services.extension_service import ExtensionService
from app.services.transcription_service import TranscriptionService
from app.sip.base import SipProvider


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


def get_sip_provider(request: Request) -> SipProvider:
    return request.app.state.sip_provider


SessionDep = Annotated[AsyncSession, Depends(get_session)]
ProviderDep = Annotated[SipProvider, Depends(get_sip_provider)]


def get_transcriber(request: Request) -> TranscriptionService:
    return request.app.state.transcriber


TranscriberDep = Annotated[TranscriptionService, Depends(get_transcriber)]


def get_call_service(
    session: SessionDep, provider: ProviderDep, transcriber: TranscriberDep
) -> CallService:
    return CallService(session, provider, transcriber)


def get_audio_service(session: SessionDep) -> AudioService:
    return AudioService(session)


def get_extension_service(session: SessionDep) -> ExtensionService:
    return ExtensionService(session)


CallServiceDep = Annotated[CallService, Depends(get_call_service)]
ExtensionServiceDep = Annotated[ExtensionService, Depends(get_extension_service)]
AudioServiceDep = Annotated[AudioService, Depends(get_audio_service)]
