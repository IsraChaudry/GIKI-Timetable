from pydantic import BaseModel

class FacultyBase(BaseModel):
    name: str
    code: str

class FacultyCreate(FacultyBase):
    pass

class FacultyRead(FacultyBase):
    id: int
    class Config:
        from_attributes = True
