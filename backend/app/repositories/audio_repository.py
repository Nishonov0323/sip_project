from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audio import AudioFile


class AudioRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, audio_id: int) -> AudioFile | None:
        return await self._session.get(AudioFile, audio_id)

    async def list(self) -> list[AudioFile]:
        result = await self._session.execute(select(AudioFile).order_by(AudioFile.id.desc()))
        return list(result.scalars())

    async def add(self, audio: AudioFile) -> AudioFile:
        self._session.add(audio)
        await self._session.commit()
        await self._session.refresh(audio)
        return audio

    async def delete(self, audio: AudioFile) -> None:
        await self._session.delete(audio)
        await self._session.commit()
