from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin
from models.schedule import Schedule
from models.course import Course
from models.batch import Batch
from engine.suggestions import get_suggestion

router = APIRouter()


def _detect_conflicts(rows, db):
    conflicts = []
    room_seen    = {}  # (day, slot, room_id)    -> course_code
    teacher_seen = {}  # (day, slot, teacher_id)  -> course_code
    batch_seen   = {}  # (day, slot, batch_id)    -> course_code

    course_cache = {}
    batch_cache  = {}

    for row in rows:
        if row.course_id not in course_cache:
            course_cache[row.course_id] = db.query(Course).filter(Course.id == row.course_id).first()
        course = course_cache[row.course_id]
        if not course:
            continue

        if row.batch_id not in batch_cache:
            batch_cache[row.batch_id] = db.query(Batch).filter(Batch.id == row.batch_id).first()
        batch = batch_cache[row.batch_id]

        code = course.code
        day, slot = row.day, row.slot_index

        rk = (day, slot, row.room_id)
        if rk in room_seen:
            conflicts.append({
                "type": "room_double_booking",
                "day": day, "slot": slot,
                "room": str(row.room_id),
                "course_a": room_seen[rk], "course_b": code,
                "suggestion": get_suggestion("no_slot"),
            })
        else:
            room_seen[rk] = code

        tk = (day, slot, course.teacher_id)
        if tk in teacher_seen:
            conflicts.append({
                "type": "teacher_double_booking",
                "day": day, "slot": slot,
                "course_a": teacher_seen[tk], "course_b": code,
                "suggestion": get_suggestion("no_slot"),
            })
        else:
            teacher_seen[tk] = code

        bk = (day, slot, row.batch_id)
        if bk in batch_seen:
            conflicts.append({
                "type": "batch_double_booking",
                "day": day, "slot": slot,
                "batch": batch.section_label if batch else str(row.batch_id),
                "course_a": batch_seen[bk], "course_b": code,
                "suggestion": get_suggestion("no_slot"),
            })
        else:
            batch_seen[bk] = code

    return conflicts


@router.get("/global/all")
def get_global_conflicts(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(Schedule).all()
    conflicts = _detect_conflicts(rows, db)
    return {"conflicts": conflicts}


@router.get("/{batch_id}")
def get_conflicts(batch_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(Schedule).filter(Schedule.batch_id == batch_id).all()
    conflicts = _detect_conflicts(rows, db)
    return {"batch_id": batch_id, "conflicts": conflicts}
