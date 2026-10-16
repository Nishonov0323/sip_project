from fastapi import APIRouter, status

from app.api.deps import ExtensionServiceDep
from app.schemas.extension import ExtensionCreate, ExtensionRead

router = APIRouter(prefix="/extensions", tags=["extensions"])


@router.get("", response_model=list[ExtensionRead])
async def list_extensions(service: ExtensionServiceDep):
    return await service.list()


@router.post("", response_model=ExtensionRead, status_code=status.HTTP_201_CREATED)
async def create_extension(data: ExtensionCreate, service: ExtensionServiceDep):
    return await service.create(data)


@router.post("/{extension_id}/reset-password", response_model=ExtensionRead)
async def reset_extension_password(extension_id: int, service: ExtensionServiceDep):
    return await service.reset_password(extension_id)


@router.delete("/{extension_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_extension(extension_id: int, service: ExtensionServiceDep) -> None:
    await service.delete(extension_id)
