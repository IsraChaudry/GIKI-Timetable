from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Teacher(Base):
    __tablename__ = "teachers"
    id      = Column(Integer, primary_key=True, index=True)
    name    = Column(String, nullable=False)
    dept_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
