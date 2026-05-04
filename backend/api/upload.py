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
import re

router = APIRouter()

# Maps CSV program code → department name in DB
PROGRAM_TO_DEPT = {
    'bai':  'Artificial Intelligence',
    'bcs':  'Computer Science',
    'bcs1': 'Computer Science',
    'bcs2': 'Computer Science',
    'cys':  'Cyber Security',
    'bds':  'Data Science',
    'ds':   'Data Science',
    'se':   'Software Engineering',
    'bce':  'Computer Engineering',
    'bee':  'Electrical Engineering',
    'bee1': 'Electrical Engineering',
    'bee2': 'Electrical Engineering',
    'eee':  'Electrical Engineering',
    'eee1': 'Electrical Engineering',
    'eee2': 'Electrical Engineering',
    'eep':  'Electrical Engineering',
    'bsc':  'Basic Sciences',
    'bes':  'Basic Sciences',
    'es':   'Basic Sciences',
    'bme':  'Mechanical Engineering',
    'bme1': 'Mechanical Engineering',
    'bme2': 'Mechanical Engineering',
    'cme':  'Chemical Engineering',
    'mte':  'Materials Engineering',
    'mtm':  'Materials Engineering',
    'mtn':  'Materials Engineering',
    'cve':  'Civil Engineering',
}

# Programs not in GIKI DB — skip silently
SKIP_PROGRAMS = {'mgs', 'mgs1', 'mgs2', 'mgs3', 'af'}


def extract_year(code: str):
    """Return the first digit in a course code as the academic year (1–4)."""
    m = re.search(r'([1-4])', str(code))
    return int(m.group(1)) if m else None


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
    - 'lab' type is normalised to 'lab_room'.
    - AcB LH1/LH2/LH3 are tagged to Civil Engineering faculty (FCV) automatically.
    """
    content = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(content)) if file.filename.endswith(".csv") \
            else pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    df.columns = [c.lower().strip() for c in df.columns]

    missing = {"room_name", "building", "type", "capacity"} - set(df.columns)
    if missing:
        raise HTTPException(status_code=400,
            detail=f"Missing columns: {missing}. Required: room_name, building, type, capacity")

    fcv = db.query(Faculty).filter(Faculty.code == "FCV").first()
    inserted, skipped = 0, []

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

        faculty_id = fcv.id if (room_name in ("AcB LH1", "AcB LH2", "AcB LH3") and fcv) else None

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
    Upload courses from CSV or Excel.
    Expected columns: code, title, credit_hours, type, program, section, instructor

    Year is derived from the first digit of the course code:
      1xx → Year 1,  2xx → Year 2,  3xx → Year 3,  4xx → Year 4

    Teachers are auto-created if they do not exist in the database.
    Programs not in the GIKI department list (MGS, ES, AF) are skipped silently.
    """
    content = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(content)) if file.filename.endswith(".csv") \
            else pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    # Normalise column names and rename to internal names
    df.columns = [str(c).replace('﻿', '').strip().lower() for c in df.columns]
    df = df.rename(columns={
        'code':       'course_code',
        'title':      'course_name',
        'section':    'section',
        'program':    'program',
        'department': 'program',
        'instructor': 'teacher_name',
        'type':       'type_raw',
    })

    required = {"course_name", "course_code", "credit_hours", "type_raw", "program"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400,
            detail=f"Missing columns: {missing}. Found: {list(df.columns)}")

    if 'teacher_name' not in df.columns:
        raise HTTPException(status_code=400,
            detail="Missing 'instructor' column.")

    inserted, skipped_programs, errors = 0, set(), []

    # Cache depts and teachers to avoid repeated DB hits
    dept_cache    = {}
    teacher_cache = {}
    # In-memory dedup: (course_code, batch_id) — prevents duplicates within
    # the same upload since uncommitted inserts are invisible to db.query()
    seen_courses = set()

    for i, row in df.iterrows():
        row_num = i + 2

        program = str(row.get("program", "")).strip().lower()

        # Skip programs not in GIKI
        if program in SKIP_PROGRAMS:
            skipped_programs.add(program.upper())
            continue

        # Resolve department
        dept_name = PROGRAM_TO_DEPT.get(program)
        if not dept_name:
            errors.append(f"Row {row_num}: Unknown program '{row['program']}'")
            continue

        if dept_name not in dept_cache:
            dept_cache[dept_name] = db.query(Department).filter(
                Department.name == dept_name
            ).first()
        dept = dept_cache[dept_name]
        if not dept:
            errors.append(f"Row {row_num}: Department '{dept_name}' not in database")
            continue

        # Resolve year from course code
        course_code = str(row["course_code"]).strip()
        year = extract_year(course_code)
        if not year:
            errors.append(f"Row {row_num}: Cannot determine year from code '{course_code}'")
            continue

        # Find all batches for this dept + year (departments with sections have multiple)
        target_batches = db.query(Batch).filter(
            Batch.dept_id == dept.id,
            Batch.year == year,
        ).all()
        if not target_batches:
            errors.append(
                f"Row {row_num}: No batch found for '{dept_name}' year {year} "
                f"(code '{course_code}')"
            )
            continue

        # Resolve teacher — auto-create if missing
        teacher_name = str(row.get("teacher_name", "")).strip()
        if not teacher_name or teacher_name.lower() == "nan":
            errors.append(f"Row {row_num}: Missing instructor for '{course_code}'")
            continue

        cache_key = (teacher_name, dept.id)
        if cache_key not in teacher_cache:
            teacher = db.query(Teacher).filter(Teacher.name == teacher_name).first()
            if not teacher:
                teacher = Teacher(name=teacher_name, dept_id=dept.id)
                db.add(teacher)
                db.flush()
            teacher_cache[cache_key] = teacher
        teacher = teacher_cache[cache_key]

        # Resolve is_lab from type column
        type_val = str(row["type_raw"]).strip().lower()
        is_lab = type_val in ("lab", "laboratory", "true", "yes", "1", "y")

        # Create the course for every section batch (single-section depts have one
        # batch per year; multi-section depts like EE have A and B).
        for batch in target_batches:
            dedup_key = (course_code, batch.id)
            if dedup_key in seen_courses:
                continue
            if db.query(Course).filter(
                Course.code == course_code,
                Course.batch_id == batch.id,
            ).first():
                seen_courses.add(dedup_key)
                continue
            seen_courses.add(dedup_key)

            db.add(Course(
                name=str(row["course_name"]).strip(),
                code=course_code,
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
        "skipped_programs": sorted(skipped_programs),
        "errors": errors,
        "message": (
            f"Inserted {inserted} courses. "
            f"Skipped programs: {sorted(skipped_programs) or 'none'}. "
            f"{len(errors)} rows failed."
        ),
    }
