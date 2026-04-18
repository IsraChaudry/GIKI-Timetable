from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Schedule(Base):
    __tablename__ = "schedules"
    id             = Column(Integer, primary_key=True, index=True)
    course_id      = Column(Integer, ForeignKey("courses.id"), nullable=False)
    room_id        = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    batch_id       = Column(Integer, ForeignKey("batches.id"), nullable=False)
    day            = Column(String, nullable=False)
    slot_index     = Column(Integer, nullable=False)
    session_number = Column(Integer, nullable=False)
    status         = Column(String, default="draft")
