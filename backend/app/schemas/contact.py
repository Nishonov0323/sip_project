import re
from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from app.schemas.call import NUMBER_PATTERN

_PHONE_NOISE = re.compile(r"[\s\-().]")


def normalize_phone(value: str) -> str:
    """"+998 90 123-45-67" -> "+998901234567"."""
    value = _PHONE_NOISE.sub("", value)
    if not re.fullmatch(NUMBER_PATTERN, value):
        raise ValueError("Telefon raqami noto'g'ri")
    return value


Phone = Annotated[str, AfterValidator(normalize_phone)]


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class GroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    contact_count: int = 0


class ContactCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=128)
    phone: Phone
    profession: str | None = Field(default=None, max_length=96)
    group_id: int | None = None


class ContactUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=128)
    phone: Phone | None = None
    profession: str | None = Field(default=None, max_length=96)
    group_id: int | None = None


class ContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    phone: str
    profession: str | None
    group_id: int | None
    group_name: str | None
    created_at: datetime


class ContactFilter(BaseModel):
    """Kontaktlarni saralash: barcha shartlar birga (AND) qo'llanadi."""

    q: str | None = Field(default=None, max_length=128)  # ism yoki raqam bo'yicha qidiruv
    group_ids: list[int] = Field(default_factory=list)  # shu guruhlardan birortasi
    professions: list[str] = Field(default_factory=list)  # shu kasblardan birortasi


class ContactPage(BaseModel):
    items: list[ContactRead]
    total: int


class AssignGroupRequest(BaseModel):
    contact_ids: list[int] = Field(min_length=1)
    group_id: int | None = None  # None — guruhdan chiqarish


class ImportResult(BaseModel):
    created: int
    updated: int
    skipped: int
    errors: list[str]
