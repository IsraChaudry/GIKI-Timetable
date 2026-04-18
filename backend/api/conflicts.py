from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin
from models.schedule import Schedule
from models.course import Course
from engine.suggestions import get_suggestion

router = APIRouter()

@router.get("/{batch_id}")
def get_conflicts(batch_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(Schedule).filter(Schedule.batch_id == batch_id).all()
    conflicts = []
    seen = {}
    for row in rows:
        course = db.query(Course).filter(Course.id == row.course_id).first()
        key = (row.day, row.slot_index, row.room_id)
        if key in seen:
            conflicts.append({
                "type": "room_double_booking",
                "day": row.day,
                "slot": row.slot_index,
                "course_a": seen[key],
                "course_b": course.code,
                "suggestion": get_suggestion("no_slot"),
            })
        seen[key] = course.code
    return {"batch_id": batch_id, "conflicts": conflicts}
