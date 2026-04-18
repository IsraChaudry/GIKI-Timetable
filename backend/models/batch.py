from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Batch(Base):
    __tablename__ = "batches"
    id            = Column(Integer, primary_key=True, index=True)
    year          = Column(Integer, nullable=False)
    dept_id       = Column(Integer, ForeignKey("departments.id"), nullable=False)
    student_count = Column(Integer, nullable=False)
    section_label = Column(String, nullable=False)
