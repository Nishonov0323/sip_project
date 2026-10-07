from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class CallStatus(StrEnum):
    RINGING = "ringing"
    ANSWERED = "answered"
    ENDED = "ended"


class Call(TimestampMixin, Base):
    """Qo'ng'iroq tarixi (CDR)."""

    __tablename__ = "calls"

    id: Mapped[int] = mapped_column(primary_key=True)
    channel_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    caller: Mapped[str] = mapped_column(String(64), default="")
    callee: Mapped[str] = mapped_column(String(64), default="")
    status: Mapped[str] = mapped_column(String(16), default=CallStatus.RINGING.value, index=True)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[int] = mapped_column(default=0)
