from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class ContactGroup(TimestampMixin, Base):
    """Kontaktlar guruhi (kategoriya): masalan, "Nafaqadagilar"."""

    __tablename__ = "contact_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)


class Contact(TimestampMixin, Base):
    """Telefon raqami bor odam — avto-qo'ng'iroq (kampaniya) qabul qiluvchisi."""

    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(128), index=True)
    phone: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    profession: Mapped[str | None] = mapped_column(String(96), index=True)
    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("contact_groups.id", ondelete="SET NULL"), index=True
    )

    group: Mapped[ContactGroup | None] = relationship(lazy="joined")

    @property
    def group_name(self) -> str | None:
        return self.group.name if self.group else None
