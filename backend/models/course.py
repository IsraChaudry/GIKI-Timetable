from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database import Base

class Course(Base):
    __tablename__ = "courses"
    id                = Column(Integer, primary_key=True, index=True)
    name              = Column(String, nullable=False)
    code              = Column(String, nullable=False)
    credit_hours      = Column(Integer, nullable=False)
    is_lab            = Column(Boolean, default=False)
    batch_id          = Column(Integer, ForeignKey("batches.id"), nullable=False)
    teacher_id        = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    dept_id           = Column(Integer, ForeignKey("departments.id"), nullable=False)
    lab_course_id     = Column(Integer, ForeignKey("courses.id"), nullable=True)
    cross_listed_code = Column(String, nullable=True)
    allow_saturday    = Column(Boolean, default=False)
