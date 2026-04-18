from pydantic import BaseModel
from typing import Optional

class DepartmentBase(BaseModel):
    name: str
    faculty_id: int
    lab_day: Optional[str] = None
    lab_window: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentRead(DepartmentBase):
    id: int
    class Config:
        from_attributes = True
