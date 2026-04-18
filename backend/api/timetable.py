from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin
from models.schedule import Schedule
from models.course import Course
from models.teacher import Teacher
from models.room import Room

router = APIRouter()

@router.get("/{batch_id}")
def get_timetable(batch_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(Schedule).filter(Schedule.batch_id == batch_id).all()
    grid = {}
    for row in rows:
        course  = db.query(Course).filter(Course.id == row.course_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
        room    = db.query(Room).filter(Room.id == row.room_id).first()
        key = f"{row.day}_{row.slot_index}"
        grid[key] = {
            "course_code":        course.code,
            "course_name":        course.name,
            "teacher":            teacher.name,
            "room":               room.name,
            "is_lab":             course.is_lab,
            "session_number":     row.session_number,
            "status":             row.status,
            "cross_listed_code":  course.cross_listed_code,
        }
    return {"batch_id": batch_id, "grid": grid}
