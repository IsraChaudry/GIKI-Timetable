from database import SessionLocal, engine, Base
import models.faculty, models.department, models.batch
import models.teacher, models.room, models.course, models.schedule
from models.faculty import Faculty
from models.department import Department


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Faculty).count() > 0:
        print("Already seeded. Skipping.")
        db.close()
        return

    # ── FACULTIES ────────────────────────────────────────────────
    fcse = Faculty(name="Faculty of Computer Science & Engineering",   code="FCSE")
    fee  = Faculty(name="Faculty of Electrical Engineering",           code="FEE")
    fbs  = Faculty(name="Faculty of Basic Sciences",                   code="FBS")
    fme  = Faculty(name="Faculty of Mechanical Engineering",           code="FME")
    fmce = Faculty(name="Faculty of Materials & Chemical Engineering", code="FMCE")
    fcv  = Faculty(name="Faculty of Civil Engineering",                code="FCV")
    db.add_all([fcse, fee, fbs, fme, fmce, fcv])
    db.commit()

    # ── DEPARTMENTS ──────────────────────────────────────────────

    # FCSE — 6 departments
    cs  = Department(name="Computer Science",        faculty_id=fcse.id, lab_day="Monday",    lab_window="morning")
    cyb = Department(name="Cyber Security",          faculty_id=fcse.id, lab_day="Tuesday",   lab_window="morning")
    ds  = Department(name="Data Science",            faculty_id=fcse.id, lab_day="Wednesday", lab_window="morning")
    ai  = Department(name="Artificial Intelligence", faculty_id=fcse.id, lab_day="Thursday",  lab_window="morning")
    cpe = Department(name="Computer Engineering",    faculty_id=fcse.id, lab_day="Monday",    lab_window="afternoon")
    swe = Department(name="Software Engineering",    faculty_id=fcse.id, lab_day="Tuesday",   lab_window="afternoon")

    # FEE — 1 department
    ee  = Department(name="Electrical Engineering",  faculty_id=fee.id,  lab_day="Wednesday", lab_window="morning")

    # FBS — 1 department
    bsc = Department(name="Basic Sciences",          faculty_id=fbs.id,  lab_day="Thursday",  lab_window="morning")

    # FME — 1 department
    mec = Department(name="Mechanical Engineering",  faculty_id=fme.id,  lab_day="Monday",    lab_window="afternoon")

    # FMCE — 2 departments
    che = Department(name="Chemical Engineering",    faculty_id=fmce.id, lab_day="Tuesday",   lab_window="afternoon")
    mat = Department(name="Materials Engineering",   faculty_id=fmce.id, lab_day="Wednesday", lab_window="afternoon")

    # FCV — 1 department
    civ = Department(name="Civil Engineering",       faculty_id=fcv.id,  lab_day="Thursday",  lab_window="afternoon")

    db.add_all([cs, cyb, ds, ai, cpe, swe, ee, bsc, mec, che, mat, civ])
    db.commit()

    print("Seed complete.")
    print(f"Faculties:   {db.query(Faculty).count()}")
    print(f"Departments: {db.query(Department).count()}")
    print()
    print("Next steps:")
    print("  1. POST /api/upload/rooms     — upload rooms.xlsx  (BB excluded automatically)")
    print("  2. POST /api/batches/         — add batches per dept (year 1-4, section_label, student_count)")
    print("  3. POST /api/teachers/        — add teachers per dept")
    print("  4. POST /api/upload/courses   — upload courses.xlsx")
    print("  5. POST /api/scheduler/generate — generate timetable")
    db.close()


if __name__ == "__main__":
    seed()
