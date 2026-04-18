from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin
from models.schedule import Schedule
from models.course import Course
from models.teacher import Teacher
from models.room import Room
from engine.constants import SLOTS, DAYS
from reportlab.lib.pagesizes import landscape, A3
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
import io

router = APIRouter()

@router.get("/pdf/{batch_id}")
def export_pdf(batch_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(Schedule).filter(Schedule.batch_id == batch_id).all()

    grid = {}
    for row in rows:
        course  = db.query(Course).filter(Course.id == row.course_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
        room    = db.query(Room).filter(Room.id == row.room_id).first()
        grid.setdefault(row.day, {})[row.slot_index] = {
            "code": course.code, "teacher": teacher.name,
            "room": room.name,   "is_lab": course.is_lab,
        }

    slot_labels = [f"{s['start']}\n{s['end']}" for s in SLOTS]
    header = ["Day / Room"] + slot_labels
    table_data = [header]

    for day in DAYS:
        day_grid = grid.get(day, {})
        row_data = [day]
        for slot in SLOTS:
            si = slot["index"]
            cell = day_grid.get(si)
            if cell:
                row_data.append(f"{cell['code']}\n{cell['teacher']}")
            else:
                row_data.append("")
        table_data.append(row_data)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A3))
    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A2F5E")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("FONTSIZE",   (0, 0), (-1, -1), 7),
        ("GRID",       (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
    ]))
    doc.build([table])
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=timetable_{batch_id}.pdf"})
