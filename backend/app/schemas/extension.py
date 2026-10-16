from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.call import NUMBER_PATTERN


class ExtensionCreate(BaseModel):
    number: str = Field(pattern=NUMBER_PATTERN, examples=["1001"])
    display_name: str = Field(min_length=1, max_length=128)


class ExtensionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: str
    display_name: str
    password: str
    created_at: datetime
    online: bool = False
