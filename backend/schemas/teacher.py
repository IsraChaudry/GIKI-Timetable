from pydantic import BaseModel

class TeacherBase(BaseModel):
    name: str
    dept_id: int

class TeacherCreate(TeacherBase):
    pass

class TeacherRead(TeacherBase):
    id: int
    class Config:
        from_attributes = True
