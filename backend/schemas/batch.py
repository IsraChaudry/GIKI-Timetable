from pydantic import BaseModel

class BatchBase(BaseModel):
    year: int
    dept_id: int
    student_count: int
    section_label: str

class BatchCreate(BatchBase):
    pass

class BatchRead(BatchBase):
    id: int
    class Config:
        from_attributes = True
