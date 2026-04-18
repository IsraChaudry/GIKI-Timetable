from sqlalchemy import Column, Integer, String
from database import Base

class Faculty(Base):
    __tablename__ = "faculties"
    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
