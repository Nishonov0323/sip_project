from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ServiceUnavailableError
from app.models.call import Call, TranscriptStatus
from app.repositories.audio_repository import AudioRepository
from app.repositories.call_repository import CallRepository
from app.repositories.extension_repository import ExtensionRepository
from app.schemas.call import OriginateRequest, PlaybackRequest
from app.services.transcription_service import TranscriptionService
from app.sip.base import ChannelInfo, SipProvider


class CallService:
    def __init__(
        self,
        session: AsyncSession,
        provider: SipProvider,
        transcriber: TranscriptionService,
    ) -> None:
        self._calls = CallRepository(session)
        self._extensions = ExtensionRepository(session)
        self._audio = AudioRepository(session)
        self._provider = provider
        self._transcriber = transcriber

    async def originate(self, data: OriginateRequest) -> str:
        if await self._extensions.get_by_number(data.from_extension) is None:
            raise NotFoundError(f"Extension {data.from_extension} topilmadi")
        return await self._provider.originate(data.from_extension, data.to_number)

    async def originate_playback(self, data: PlaybackRequest) -> str:
        audio = await self._audio.get(data.audio_id)
        if audio is None:
            raise NotFoundError("Audio topilmadi")
        return await self._provider.originate_playback(data.to_number, audio.filename, audio.name)

    async def hangup(self, channel_id: str) -> None:
        await self._provider.hangup(channel_id)

    async def active_channels(self) -> list[ChannelInfo]:
        return await self._provider.list_active_channels()

    async def history(self, limit: int, offset: int) -> list[Call]:
        return await self._calls.list_recent(limit=limit, offset=offset)

    async def recording_path(self, call_id: int) -> Path:
        call = await self._get(call_id)
        if not call.recording_name:
            raise NotFoundError("Bu qo'ng'iroq uchun yozuv yo'q")
        path = self._transcriber.recording_path(call.recording_name)
        if not path.is_file():
            raise NotFoundError("Yozuv fayli topilmadi")
        return path

    async def transcribe(self, call_id: int) -> Call:
        if not self._transcriber.enabled:
            raise ServiceUnavailableError(
                "Matnga o'tkazish sozlanmagan: backend/.env ichida STT_API_KEY ni kiriting"
            )
        call = await self._get(call_id)
        await self.recording_path(call_id)  # yozuv mavjudligini tekshiradi
        if call.transcript_status != TranscriptStatus.PENDING.value:
            call.transcript_status = TranscriptStatus.PENDING.value
            call = await self._calls.save(call)
            self._transcriber.schedule(call.id)
        return call

    async def _get(self, call_id: int) -> Call:
        call = await self._calls.get(call_id)
        if call is None:
            raise NotFoundError("Qo'ng'iroq topilmadi")
        return call
