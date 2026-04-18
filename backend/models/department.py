from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Department(Base):
    __tablename__ = "departments"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=False)
    lab_day    = Column(String, nullable=True)
    lab_window = Column(String, nullable=True)
