from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Extension(TimestampMixin, Base):
    """Ichki SIP raqam (abonent)."""

    __tablename__ = "extensions"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(128))
    password: Mapped[str] = mapped_column(String(64), default="")
