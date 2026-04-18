from pydantic import BaseModel
from typing import Optional

class CourseBase(BaseModel):
    name: str
    code: str
    credit_hours: int
    is_lab: bool = False
    batch_id: int
    teacher_id: int
    dept_id: int
    lab_course_id: Optional[int] = None
    cross_listed_code: Optional[str] = None
    allow_saturday: bool = False

class CourseCreate(CourseBase):
    pass

class CourseRead(CourseBase):
    id: int
    class Config:
        from_attributes = True
