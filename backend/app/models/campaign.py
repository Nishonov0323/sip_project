from enum import StrEnum

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class CampaignStatus(StrEnum):
    RUNNING = "running"
    FINISHED = "finished"
    CANCELLED = "cancelled"
    INTERRUPTED = "interrupted"  # server qayta ishga tushganda to'xtab qolgan


class TargetStatus(StrEnum):
    PENDING = "pending"
    CALLING = "calling"
    ANSWERED = "answered"  # javob berdi, audio eshittirildi
    NO_ANSWER = "no_answer"  # ko'tarmadi / band
    FAILED = "failed"  # qo'ng'iroq boshlanmadi (masalan, telefon o'chiq)
    CANCELLED = "cancelled"


class Campaign(TimestampMixin, Base):
    """Ommaviy avto-qo'ng'iroq: bir audio ko'p kontaktga ketma-ket eshittiriladi."""

    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    audio_id: Mapped[int | None] = mapped_column(ForeignKey("audio_files.id", ondelete="SET NULL"))
    audio_name: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(16), default=CampaignStatus.RUNNING.value, index=True)


class CampaignTarget(Base):
    """Kampaniyadagi bitta qabul qiluvchi. Ism va raqam kontakt o'chirilsa ham saqlanadi."""

    __tablename__ = "campaign_targets"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True
    )
    contact_id: Mapped[int | None] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"))
    full_name: Mapped[str] = mapped_column(String(128))
    phone: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(16), default=TargetStatus.PENDING.value)
    channel_id: Mapped[str | None] = mapped_column(String(128))
    error: Mapped[str | None] = mapped_column(String(255))
