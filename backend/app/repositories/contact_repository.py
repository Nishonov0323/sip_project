from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import Contact, ContactGroup
from app.schemas.contact import ContactFilter


def _apply(stmt, f: ContactFilter):
    if f.q:
        like = f"%{f.q.strip()}%"
        stmt = stmt.where(or_(Contact.full_name.ilike(like), Contact.phone.ilike(like)))
    if f.group_ids:
        stmt = stmt.where(Contact.group_id.in_(f.group_ids))
    if f.professions:
        stmt = stmt.where(Contact.profession.in_(f.professions))
    return stmt


class ContactRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # --- kontaktlar -------------------------------------------------------
    async def get(self, contact_id: int) -> Contact | None:
        return await self._session.get(Contact, contact_id)

    async def get_by_phone(self, phone: str) -> Contact | None:
        result = await self._session.execute(select(Contact).where(Contact.phone == phone))
        return result.scalar_one_or_none()

    async def search(self, f: ContactFilter, limit: int, offset: int) -> tuple[list[Contact], int]:
        total = await self._session.scalar(_apply(select(func.count(Contact.id)), f))
        stmt = _apply(select(Contact), f).order_by(Contact.full_name, Contact.id)
        result = await self._session.execute(stmt.limit(limit).offset(offset))
        return list(result.scalars().unique()), total or 0

    async def find_all(self, f: ContactFilter) -> list[Contact]:
        stmt = _apply(select(Contact), f).order_by(Contact.full_name, Contact.id)
        return list((await self._session.execute(stmt)).scalars().unique())

    async def get_many(self, ids: list[int]) -> list[Contact]:
        stmt = select(Contact).where(Contact.id.in_(ids)).order_by(Contact.full_name, Contact.id)
        return list((await self._session.execute(stmt)).scalars().unique())

    async def professions(self) -> list[str]:
        stmt = (
            select(Contact.profession)
            .where(Contact.profession.is_not(None), Contact.profession != "")
            .distinct()
            .order_by(Contact.profession)
        )
        return list((await self._session.execute(stmt)).scalars())

    async def add(self, contact: Contact) -> Contact:
        self._session.add(contact)
        await self._session.commit()
        await self._session.refresh(contact)
        return contact

    async def save(self, contact: Contact) -> Contact:
        await self._session.commit()
        await self._session.refresh(contact)
        return contact

    async def delete(self, contact: Contact) -> None:
        await self._session.delete(contact)
        await self._session.commit()

    async def assign_group(self, ids: list[int], group_id: int | None) -> int:
        result = await self._session.execute(
            update(Contact).where(Contact.id.in_(ids)).values(group_id=group_id)
        )
        await self._session.commit()
        return result.rowcount or 0

    async def commit(self) -> None:
        await self._session.commit()

    # --- guruhlar ---------------------------------------------------------
    async def get_group(self, group_id: int) -> ContactGroup | None:
        return await self._session.get(ContactGroup, group_id)

    async def get_group_by_name(self, name: str) -> ContactGroup | None:
        result = await self._session.execute(
            select(ContactGroup).where(func.lower(ContactGroup.name) == name.lower())
        )
        return result.scalar_one_or_none()

    async def list_groups(self) -> list[tuple[ContactGroup, int]]:
        stmt = (
            select(ContactGroup, func.count(Contact.id))
            .outerjoin(Contact, Contact.group_id == ContactGroup.id)
            .group_by(ContactGroup.id)
            .order_by(ContactGroup.name)
        )
        return [(g, n) for g, n in (await self._session.execute(stmt)).all()]

    async def add_group(self, group: ContactGroup) -> ContactGroup:
        self._session.add(group)
        await self._session.commit()
        await self._session.refresh(group)
        return group

    async def delete_group(self, group: ContactGroup) -> None:
        await self._session.delete(group)
        await self._session.commit()
