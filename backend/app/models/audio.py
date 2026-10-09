from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class AudioFile(TimestampMixin, Base):
    """Yuklangan audio (avto-qo'ng'iroqda ijro etiladi). Diskda 8kHz mono WAV ko'rinishida."""

    __tablename__ = "audio_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    filename: Mapped[str] = mapped_column(String(64), unique=True)  # kengaytmasiz nom
    duration_seconds: Mapped[float] = mapped_column(default=0.0)
    size_bytes: Mapped[int] = mapped_column(default=0)
