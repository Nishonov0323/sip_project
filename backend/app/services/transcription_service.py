import asyncio
import logging
from pathlib import Path

import httpx

from app.core.config import Settings
from app.db.session import SessionLocal
from app.models.call import TranscriptStatus
from app.repositories.call_repository import CallRepository
from app.ws.manager import ConnectionManager

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Yozuvni OpenAI-mos STT API (Whisper) orqali matnga o'tkazadi — fonda."""

    def __init__(self, settings: Settings, ws: ConnectionManager) -> None:
        self._settings = settings
        self._ws = ws
        self._tasks: set[asyncio.Task] = set()

    @property
    def enabled(self) -> bool:
        return bool(self._settings.stt_api_key)

    def recording_path(self, recording_name: str) -> Path:
        base = Path(self._settings.recordings_dir).resolve()
        path = (base / f"{recording_name}.wav").resolve()
        if base not in path.parents:  # path traversal'dan himoya
            raise ValueError("Noto'g'ri yozuv nomi")
        return path

    def schedule(self, call_id: int) -> None:
        task = asyncio.create_task(self.run(call_id), name=f"transcribe-{call_id}")
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def run(self, call_id: int) -> None:
        async with SessionLocal() as session:
            repo = CallRepository(session)
            call = await repo.get(call_id)
            if call is None or not call.recording_name:
                return
            call.transcript_status = TranscriptStatus.PENDING.value
            await repo.save(call)
            await self._ws.broadcast(self._event(call.channel_id))

            try:
                call.transcript = await self._transcribe(self.recording_path(call.recording_name))
                call.transcript_status = TranscriptStatus.DONE.value
            except Exception:
                logger.exception("Matnga o'tkazish xatosi (call %s)", call_id)
                call.transcript_status = TranscriptStatus.FAILED.value
            await repo.save(call)
            await self._ws.broadcast(self._event(call.channel_id))

    @staticmethod
    def _event(channel_id: str) -> dict:
        return {"type": "transcript_updated", "channel_id": channel_id}

    async def _transcribe(self, path: Path) -> str:
        s = self._settings
        data = {"model": s.stt_model, "response_format": "json"}
        if s.stt_language:
            data["language"] = s.stt_language
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(
                f"{s.stt_base_url.rstrip('/')}/audio/transcriptions",
                headers={"Authorization": f"Bearer {s.stt_api_key}"},
                files={"file": (path.name, path.read_bytes(), "audio/wav")},
                data=data,
            )
        resp.raise_for_status()
        return (resp.json().get("text") or "").strip()
