from pydantic import BaseModel

class ScheduleBase(BaseModel):
    course_id: int
    room_id: int
    batch_id: int
    day: str
    slot_index: int

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleRead(ScheduleBase):
    id: int
    class Config:
        from_attributes = True
