from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin
from models.faculty import Faculty
from models.room import Room
from models.course import Course
from models.batch import Batch
from models.teacher import Teacher
from models.department import Department
import pandas as pd
import io

router = APIRouter()


@router.post("/rooms")
async def upload_rooms(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Upload rooms from Excel or CSV.
    Required columns: room_name, building, type, capacity
    - BB building is skipped automatically.
    - 'lab' type is normalized to 'lab_room'.
    - AcB LH1/LH2/LH3 are tagged to Civil Engineering faculty (FCV) automatically.
    """
    content = await file.read()

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    df.columns = [c.lower().strip() for c in df.columns]

    required = {"room_name", "building", "type", "capacity"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {missing}. Required: room_name, building, type, capacity",
        )

    fcv = db.query(Faculty).filter(Faculty.code == "FCV").first()

    inserted = 0
    skipped = []

    for _, row in df.iterrows():
        building = str(row.get("building", "")).strip()

        if building.upper() == "BB":
            continue

        room_name = str(row["room_name"]).strip()
        room_type = str(row["type"]).strip()

        if room_type == "lab":
            room_type = "lab_room"

        if db.query(Room).filter(Room.name == room_name).first():
            skipped.append(room_name)
            continue

        faculty_id = None
        if room_name in ("AcB LH1", "AcB LH2", "AcB LH3") and fcv:
            faculty_id = fcv.id

        db.add(Room(
            name=room_name,
            type=room_type,
            capacity=int(row["capacity"]),
            building=building,
            faculty_id=faculty_id,
        ))
        inserted += 1

    db.commit()
    return {
        "status": "success",
        "inserted": inserted,
        "skipped": skipped,
        "message": f"Inserted {inserted} rooms. Skipped {len(skipped)} duplicates. BB building excluded.",
    }


@router.post("/courses")
async def upload_courses(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Upload courses from Excel or CSV.
    Required columns: course_name, course_code, credit_hours, is_lab,
                      dept_name, batch_section, teacher_name
    Rows with lookup failures are reported in errors — never crashes.
    """
    content = await file.read()

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    df.columns = [c.lower().strip() for c in df.columns]

    required = {"course_name", "course_code", "credit_hours", "is_lab",
                "dept_name", "batch_section", "teacher_name"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")

    inserted = 0
    errors = []

    for i, row in df.iterrows():
        row_num = i + 2

        dept = db.query(Department).filter(
            Department.name == str(row["dept_name"]).strip()
        ).first()
        if not dept:
            errors.append(f"Row {row_num}: Department '{row['dept_name']}' not found")
            continue

        batch = db.query(Batch).filter(
            Batch.section_label == str(row["batch_section"]).strip()
        ).first()
        if not batch:
            errors.append(f"Row {row_num}: Batch section '{row['batch_section']}' not found")
            continue

        teacher = db.query(Teacher).filter(
            Teacher.name == str(row["teacher_name"]).strip()
        ).first()
        if not teacher:
            errors.append(f"Row {row_num}: Teacher '{row['teacher_name']}' not found")
            continue

        is_lab = str(row["is_lab"]).strip().lower() in ("true", "yes", "1", "y")

        if db.query(Course).filter(
            Course.code == str(row["course_code"]).strip(),
            Course.batch_id == batch.id,
        ).first():
            errors.append(
                f"Row {row_num}: Course '{row['course_code']}' for '{row['batch_section']}' already exists"
            )
            continue

        db.add(Course(
            name=str(row["course_name"]).strip(),
            code=str(row["course_code"]).strip(),
            credit_hours=int(row["credit_hours"]),
            is_lab=is_lab,
            batch_id=batch.id,
            teacher_id=teacher.id,
            dept_id=dept.id,
        ))
        inserted += 1

    db.commit()
    return {
        "status": "success",
        "inserted": inserted,
        "errors": errors,
        "message": f"Inserted {inserted} courses. {len(errors)} rows failed.",
    }
