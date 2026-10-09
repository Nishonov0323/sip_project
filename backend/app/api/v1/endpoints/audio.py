from typing import Annotated

from fastapi import APIRouter, Form, UploadFile, status
from fastapi.responses import FileResponse

from app.api.deps import AudioServiceDep
from app.schemas.audio import AudioRead

router = APIRouter(prefix="/audio", tags=["audio"])


@router.get("", response_model=list[AudioRead])
async def list_audio(service: AudioServiceDep):
    return await service.list()


@router.post("", response_model=AudioRead, status_code=status.HTTP_201_CREATED)
async def upload_audio(
    service: AudioServiceDep,
    file: UploadFile,
    name: Annotated[str | None, Form()] = None,
):
    return await service.upload(file, name)


@router.get("/{audio_id}/file")
async def audio_file(audio_id: int, service: AudioServiceDep) -> FileResponse:
    audio = await service.get(audio_id)
    return FileResponse(service.file_path(audio), media_type="audio/wav", filename=f"{audio.name}.wav")


@router.delete("/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audio(audio_id: int, service: AudioServiceDep) -> None:
    await service.delete(audio_id)
