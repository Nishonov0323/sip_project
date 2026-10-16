import csv
import io

from pydantic import TypeAdapter, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, InvalidFileError, NotFoundError
from app.models.contact import Contact, ContactGroup
from app.repositories.contact_repository import ContactRepository
from app.schemas.contact import (
    AssignGroupRequest,
    ContactCreate,
    ContactFilter,
    ContactUpdate,
    GroupCreate,
    ImportResult,
    Phone,
)

MAX_IMPORT_BYTES = 5 * 1024 * 1024
MAX_IMPORT_ERRORS = 20

# CSV sarlavhalari (kichik harfda). Birinchi mos kelgani olinadi.
_COLUMNS = {
    "full_name": ("full_name", "name", "ism", "fio", "f.i.o", "ismi"),
    "phone": ("phone", "telefon", "raqam", "tel", "number"),
    "group": ("group", "guruh", "kategoriya", "category"),
    "profession": ("profession", "kasb", "kasbi", "job"),
}
_phone_adapter = TypeAdapter(Phone)


class ContactService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = ContactRepository(session)

    # --- guruhlar ---------------------------------------------------------
    async def list_groups(self) -> list[dict]:
        return [
            {"id": g.id, "name": g.name, "contact_count": n}
            for g, n in await self._repo.list_groups()
        ]

    async def create_group(self, data: GroupCreate) -> ContactGroup:
        name = data.name.strip()
        if await self._repo.get_group_by_name(name):
            raise ConflictError(f"'{name}' guruhi allaqachon mavjud")
        return await self._repo.add_group(ContactGroup(name=name))

    async def delete_group(self, group_id: int) -> None:
        group = await self._repo.get_group(group_id)
        if group is None:
            raise NotFoundError("Guruh topilmadi")
        await self._repo.delete_group(group)  # kontaktlar guruhsiz qoladi (SET NULL)

    # --- kontaktlar -------------------------------------------------------
    async def search(self, f: ContactFilter, limit: int, offset: int) -> tuple[list[Contact], int]:
        return await self._repo.search(f, limit, offset)

    async def professions(self) -> list[str]:
        return await self._repo.professions()

    async def create(self, data: ContactCreate) -> Contact:
        await self._check_group(data.group_id)
        if await self._repo.get_by_phone(data.phone):
            raise ConflictError(f"{data.phone} raqami allaqachon mavjud")
        return await self._repo.add(
            Contact(
                full_name=data.full_name.strip(),
                phone=data.phone,
                profession=(data.profession or "").strip() or None,
                group_id=data.group_id,
            )
        )

    async def update(self, contact_id: int, data: ContactUpdate) -> Contact:
        contact = await self._get(contact_id)
        changes = data.model_dump(exclude_unset=True)
        if "group_id" in changes:
            await self._check_group(changes["group_id"])
        if "phone" in changes and changes["phone"] != contact.phone:
            if await self._repo.get_by_phone(changes["phone"]):
                raise ConflictError(f"{changes['phone']} raqami allaqachon mavjud")
        for key, value in changes.items():
            if key in ("full_name", "profession") and isinstance(value, str):
                value = value.strip() or None
            if key == "full_name" and value is None:
                continue
            setattr(contact, key, value)
        return await self._repo.save(contact)

    async def delete(self, contact_id: int) -> None:
        await self._repo.delete(await self._get(contact_id))

    async def assign_group(self, data: AssignGroupRequest) -> int:
        await self._check_group(data.group_id)
        return await self._repo.assign_group(data.contact_ids, data.group_id)

    # --- CSV import -------------------------------------------------------
    async def import_csv(self, raw: bytes) -> ImportResult:
        if len(raw) > MAX_IMPORT_BYTES:
            raise InvalidFileError("Fayl juda katta (5 MB gacha)")
        try:
            text = raw.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise InvalidFileError("Fayl UTF-8 kodlashda bo'lishi kerak") from exc

        sample = text[:2048]
        delimiter = ";" if sample.count(";") > sample.count(",") else ","
        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        if not reader.fieldnames:
            raise InvalidFileError("Fayl bo'sh")
        headers = {h.strip().lower(): h for h in reader.fieldnames if h}
        cols = {
            key: next((headers[n] for n in names if n in headers), None)
            for key, names in _COLUMNS.items()
        }
        if cols["phone"] is None or cols["full_name"] is None:
            raise InvalidFileError(
                "Sarlavhada kamida 'ism' va 'telefon' ustunlari bo'lishi kerak "
                "(ixtiyoriy: 'guruh', 'kasb')"
            )

        def cell(row: dict, key: str) -> str:
            col = cols[key]
            return (row.get(col) or "").strip() if col else ""

        groups: dict[str, ContactGroup] = {}
        created = updated = skipped = 0
        errors: list[str] = []

        def fail(line: int, why: str) -> None:
            nonlocal skipped
            skipped += 1
            if len(errors) < MAX_IMPORT_ERRORS:
                errors.append(f"{line}-qator: {why}")

        for row in reader:
            line = reader.line_num
            name, phone_raw = cell(row, "full_name"), cell(row, "phone")
            if not name or not phone_raw:
                fail(line, "ism yoki telefon bo'sh")
                continue
            try:
                phone = _phone_adapter.validate_python(phone_raw)
            except ValidationError:
                fail(line, f"telefon noto'g'ri ({phone_raw})")
                continue

            group = None
            if group_name := cell(row, "group")[:64]:
                key = group_name.lower()
                if key not in groups:
                    groups[key] = await self._repo.get_group_by_name(
                        group_name
                    ) or await self._repo.add_group(ContactGroup(name=group_name))
                group = groups[key]
            profession = cell(row, "profession")[:96] or None

            contact = await self._repo.get_by_phone(phone)
            if contact is None:
                await self._repo.add(
                    Contact(
                        full_name=name[:128],
                        phone=phone,
                        profession=profession,
                        group_id=group.id if group else None,
                    )
                )
                created += 1
            else:
                contact.full_name = name[:128]
                if profession:
                    contact.profession = profession
                if group:
                    contact.group_id = group.id
                await self._repo.save(contact)
                updated += 1

        return ImportResult(created=created, updated=updated, skipped=skipped, errors=errors)

    async def _get(self, contact_id: int) -> Contact:
        contact = await self._repo.get(contact_id)
        if contact is None:
            raise NotFoundError("Kontakt topilmadi")
        return contact

    async def _check_group(self, group_id: int | None) -> None:
        if group_id is not None and await self._repo.get_group(group_id) is None:
            raise NotFoundError("Guruh topilmadi")
