import asyncio
import logging
import wave
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import FileTooLargeError, InvalidFileError, NotFoundError
from app.models.audio import AudioFile
from app.repositories.audio_repository import AudioRepository

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".m4a", ".aac", ".flac", ".webm", ".opus"}
CHUNK = 1024 * 1024


def sounds_path() -> Path:
    return Path(settings.sounds_dir)


class AudioService:
    """Audio yuklaydi va Asterisk tushunadigan formatga (8kHz, mono, 16-bit WAV) o'tkazadi."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = AudioRepository(session)

    async def list(self) -> list[AudioFile]:
        return await self._repo.list()

    async def get(self, audio_id: int) -> AudioFile:
        audio = await self._repo.get(audio_id)
        if audio is None:
            raise NotFoundError("Audio topilmadi")
        return audio

    def file_path(self, audio: AudioFile) -> Path:
        return sounds_path() / f"{audio.filename}.wav"

    async def upload(self, file: UploadFile, name: str | None) -> AudioFile:
        original = file.filename or "audio"
        ext = Path(original).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise InvalidFileError(
                f"Format qo'llab-quvvatlanmaydi ({ext or 'noma’lum'}). "
                f"Ruxsat etilgan: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        folder = sounds_path()
        folder.mkdir(parents=True, exist_ok=True)
        stem = uuid4().hex
        raw = folder / f"{stem}.upload{ext}"
        target = folder / f"{stem}.wav"

        try:
            await self._save_limited(file, raw)
            await self._convert(raw, target)
            target.chmod(0o644)
            info = self._wav_info(target)
        except Exception:
            target.unlink(missing_ok=True)
            raise
        finally:
            raw.unlink(missing_ok=True)

        display = (name or Path(original).stem).strip()[:128] or "Audio"
        return await self._repo.add(
            AudioFile(
                name=display,
                filename=stem,
                duration_seconds=info[0],
                size_bytes=target.stat().st_size,
            )
        )

    async def delete(self, audio_id: int) -> None:
        audio = await self.get(audio_id)
        self.file_path(audio).unlink(missing_ok=True)
        await self._repo.delete(audio)

    async def _save_limited(self, file: UploadFile, dest: Path) -> None:
        limit = settings.max_upload_mb * 1024 * 1024
        written = 0
        with dest.open("wb") as out:
            while chunk := await file.read(CHUNK):
                written += len(chunk)
                if written > limit:
                    raise FileTooLargeError(f"Fayl {settings.max_upload_mb} MB dan katta")
                out.write(chunk)
        if written == 0:
            raise InvalidFileError("Fayl bo'sh")

    async def _convert(self, src: Path, dest: Path) -> None:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-y", "-i", str(src), "-vn", "-ar", "8000", "-ac", "1",
            "-c:a", "pcm_s16le", str(dest),
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            logger.warning("ffmpeg xatosi: %s", stderr.decode(errors="replace")[-500:])
            raise InvalidFileError("Audio faylni o'qib bo'lmadi (buzilgan yoki audio emas)")

    @staticmethod
    def _wav_info(path: Path) -> tuple[float]:
        with wave.open(str(path), "rb") as wav:
            return (wav.getnframes() / float(wav.getframerate() or 1),)
