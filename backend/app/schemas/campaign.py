from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.contact import ContactFilter


class CampaignCreate(BaseModel):
    """Qabul qiluvchilar: aniq `contact_ids` yoki `filter` bo'yicha topilgan hammasi."""

    name: str | None = Field(default=None, max_length=128)
    audio_id: int
    contact_ids: list[int] | None = None
    filter: ContactFilter | None = None

    @model_validator(mode="after")
    def _one_source(self):
        if bool(self.contact_ids) == bool(self.filter):
            raise ValueError("contact_ids yoki filter dan faqat bittasini bering")
        return self


class TargetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contact_id: int | None
    full_name: str
    phone: str
    status: str
    channel_id: str | None
    error: str | None
    call_id: int | None = None
    has_recording: bool = False
    transcript: str | None = None
    duration_seconds: int = 0


class CampaignRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    audio_name: str
    status: str
    created_at: datetime
    total: int = 0
    done: int = 0  # yakunlangan (javob berdi + ko'tarmadi + xato + bekor)
    answered: int = 0


class CampaignDetail(CampaignRead):
    targets: list[TargetRead]
