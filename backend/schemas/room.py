from pydantic import BaseModel
from typing import Optional

class RoomBase(BaseModel):
    name: str
    type: str
    capacity: int
    building: Optional[str] = None
    faculty_id: Optional[int] = None

class RoomCreate(RoomBase):
    pass

class RoomRead(RoomBase):
    id: int
    class Config:
        from_attributes = True
