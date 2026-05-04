from fastapi import APIRouter, Depends, HTTPException
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
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
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


@router.get("/pdf/faculty/{faculty_id}")
def export_faculty_pdf(faculty_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    from models.faculty import Faculty
    from models.department import Department
    from models.batch import Batch

    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    dept_ids = [d.id for d in db.query(Department).filter(Department.faculty_id == faculty_id).all()]
    batches = (
        db.query(Batch)
        .filter(Batch.dept_id.in_(dept_ids))
        .order_by(Batch.dept_id, Batch.year)
        .all()
    )

    styles = getSampleStyleSheet()
    slot_labels = [f"{s['start']}\n{s['end']}" for s in SLOTS]
    header = ["Day"] + slot_labels

    tbl_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A2F5E")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (0, -1), colors.HexColor("#f0f4ff")),
        ("FONTSIZE",   (0, 0), (-1, -1), 7),
        ("GRID",       (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("LEADING",    (0, 0), (-1, -1), 9),
    ])

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A3),
                            topMargin=20, bottomMargin=20, leftMargin=20, rightMargin=20)
    story = []

    for batch in batches:
        if story:
            story.append(PageBreak())

        story.append(Paragraph(
            f"{faculty.name}  ·  {batch.section_label}  (Year {batch.year}  ·  {batch.student_count} students)",
            styles["Heading2"]
        ))
        story.append(Spacer(1, 6))

        rows = db.query(Schedule).filter(Schedule.batch_id == batch.id).all()

        if not rows:
            story.append(Paragraph("No sessions scheduled for this batch yet.", styles["Normal"]))
            continue

        course_ids = list({r.course_id for r in rows})
        courses_map = {c.id: c for c in db.query(Course).filter(Course.id.in_(course_ids)).all()}
        teacher_ids = list({c.teacher_id for c in courses_map.values()})
        teachers_map = {t.id: t for t in db.query(Teacher).filter(Teacher.id.in_(teacher_ids)).all()}
        room_ids = list({r.room_id for r in rows})
        rooms_map = {r.id: r for r in db.query(Room).filter(Room.id.in_(room_ids)).all()}

        grid = {}
        for row in rows:
            c = courses_map.get(row.course_id)
            t = teachers_map.get(c.teacher_id) if c else None
            r = rooms_map.get(row.room_id)
            if c and r:
                grid.setdefault(row.day, {})[row.slot_index] = {
                    "code": c.code, "teacher": t.name if t else "—", "room": r.name
                }

        table_data = [header]
        for day in DAYS:
            day_grid = grid.get(day, {})
            row_data = [day]
            for slot in SLOTS:
                cell = day_grid.get(slot["index"])
                row_data.append(f"{cell['code']}\n{cell['teacher']}\n{cell['room']}" if cell else "")
            table_data.append(row_data)

        tbl = Table(table_data, repeatRows=1)
        tbl.setStyle(tbl_style)
        story.append(tbl)

    if not story:
        story.append(Paragraph(f"No batches found for {faculty.name}.", styles["Normal"]))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=timetable_{faculty.code}.pdf"})
