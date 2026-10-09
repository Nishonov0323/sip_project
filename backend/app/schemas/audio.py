from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AudioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    duration_seconds: float
    size_bytes: int
    created_at: datetime
