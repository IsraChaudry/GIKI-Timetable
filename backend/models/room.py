from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Room(Base):
    __tablename__ = "rooms"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    type       = Column(String, nullable=False)
    capacity   = Column(Integer, nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=False)
