from typing import Annotated

from fastapi import APIRouter, Query, UploadFile, status

from app.api.deps import ContactServiceDep
from app.schemas.contact import (
    AssignGroupRequest,
    ContactCreate,
    ContactFilter,
    ContactPage,
    ContactRead,
    ContactUpdate,
    GroupCreate,
    GroupRead,
    ImportResult,
)

router = APIRouter(tags=["contacts"])


@router.get("/contact-groups", response_model=list[GroupRead])
async def list_groups(service: ContactServiceDep):
    return await service.list_groups()


@router.post("/contact-groups", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
async def create_group(data: GroupCreate, service: ContactServiceDep):
    return await service.create_group(data)


@router.delete("/contact-groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int, service: ContactServiceDep) -> None:
    await service.delete_group(group_id)


@router.get("/contacts", response_model=ContactPage)
async def list_contacts(
    service: ContactServiceDep,
    q: str | None = None,
    group_id: Annotated[list[int] | None, Query()] = None,
    profession: Annotated[list[str] | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    f = ContactFilter(q=q, group_ids=group_id or [], professions=profession or [])
    items, total = await service.search(f, limit, offset)
    return ContactPage(items=items, total=total)


@router.get("/contacts/professions", response_model=list[str])
async def list_professions(service: ContactServiceDep):
    return await service.professions()


@router.post("/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
async def create_contact(data: ContactCreate, service: ContactServiceDep):
    return await service.create(data)


@router.post("/contacts/import", response_model=ImportResult)
async def import_contacts(file: UploadFile, service: ContactServiceDep):
    return await service.import_csv(await file.read())


@router.post("/contacts/assign-group")
async def assign_group(data: AssignGroupRequest, service: ContactServiceDep) -> dict[str, int]:
    return {"updated": await service.assign_group(data)}


@router.patch("/contacts/{contact_id}", response_model=ContactRead)
async def update_contact(contact_id: int, data: ContactUpdate, service: ContactServiceDep):
    return await service.update(contact_id, data)


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(contact_id: int, service: ContactServiceDep) -> None:
    await service.delete(contact_id)
