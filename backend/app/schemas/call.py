from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

NUMBER_PATTERN = r"^[0-9*#+]{2,32}$"


class OriginateRequest(BaseModel):
    from_extension: str = Field(pattern=NUMBER_PATTERN, examples=["1001"])
    to_number: str = Field(pattern=NUMBER_PATTERN, examples=["1002"])


class OriginateResponse(BaseModel):
    channel_id: str


class CallRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    channel_id: str
    caller: str
    callee: str
    status: str
    created_at: datetime
    answered_at: datetime | None
    ended_at: datetime | None
    duration_seconds: int


class ActiveChannelRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    channel_id: str
    state: str
    caller: str
    callee: str
