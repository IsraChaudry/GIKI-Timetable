from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.batch import Batch
from schemas.batch import BatchCreate, BatchRead
from auth import require_admin

router = APIRouter()

@router.get("/", response_model=List[BatchRead])
def list_all(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Batch).all()

@router.post("/", response_model=BatchRead)
def create(data: BatchCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = Batch(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/{id}", response_model=BatchRead)
def get_one(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = db.query(Batch).filter(Batch.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj

@router.put("/{id}", response_model=BatchRead)
def update(id: int, data: BatchCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = db.query(Batch).filter(Batch.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = db.query(Batch).filter(Batch.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
