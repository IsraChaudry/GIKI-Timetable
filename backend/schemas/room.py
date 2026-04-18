from pydantic import BaseModel

class RoomBase(BaseModel):
    name: str
    type: str
    capacity: int
    faculty_id: int

class RoomCreate(RoomBase):
    pass

class RoomRead(RoomBase):
    id: int
    class Config:
        from_attributes = True
