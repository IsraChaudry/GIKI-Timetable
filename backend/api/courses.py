from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.course import Course
from schemas.course import CourseCreate, CourseRead
from auth import require_admin

router = APIRouter()

@router.get("/", response_model=List[CourseRead])
def list_all(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Course).all()

@router.post("/", response_model=CourseRead)
def create(data: CourseCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = Course(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/{id}", response_model=CourseRead)
def get_one(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = db.query(Course).filter(Course.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj

@router.put("/{id}", response_model=CourseRead)
def update(id: int, data: CourseCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = db.query(Course).filter(Course.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = db.query(Course).filter(Course.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
