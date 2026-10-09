from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class CallStatus(StrEnum):
    RINGING = "ringing"
    ANSWERED = "answered"
    ENDED = "ended"


class CallKind(StrEnum):
    CALL = "call"  # ikki abonent o'rtasidagi oddiy qo'ng'iroq
    PLAYBACK = "playback"  # avto-qo'ng'iroq: audio ijro etiladi, javob yoziladi


class TranscriptStatus(StrEnum):
    NONE = "none"
    PENDING = "pending"
    DONE = "done"
    FAILED = "failed"


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

    kind: Mapped[str] = mapped_column(String(16), default=CallKind.CALL.value)
    audio_name: Mapped[str | None] = mapped_column(String(128))
    recording_name: Mapped[str | None] = mapped_column(String(160))
    transcript: Mapped[str | None] = mapped_column(Text)
    transcript_status: Mapped[str] = mapped_column(
        String(16), default=TranscriptStatus.NONE.value
    )

    @property
    def has_recording(self) -> bool:
        return bool(self.recording_name)
