import os
import pandas as pd
from database import SessionLocal, engine, Base
import models.faculty, models.department, models.batch
import models.teacher, models.room, models.course, models.schedule
from models.faculty import Faculty
from models.department import Department
from models.room import Room
from models.batch import Batch

ROOMS_FILE = os.path.join(
    os.path.dirname(__file__), "..", "Data", "rooms.xlsx"
)


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

    # ── ROOMS (from rooms.xlsx) ──────────────────────────────────
    fcv_id = fcv.id
    rooms_path = os.path.abspath(ROOMS_FILE)

    if not os.path.exists(rooms_path):
        print(f"WARNING: rooms.xlsx not found at {rooms_path} — skipping rooms.")
    else:
        df = pd.read_excel(rooms_path)
        df.columns = [c.lower().strip() for c in df.columns]

        acb_civil = {"AcB LH1", "AcB LH2", "AcB LH3"}
        inserted_rooms = 0

        for _, row in df.iterrows():
            building = str(row.get("building", "")).strip()
            if building.upper() == "BB":
                continue

            room_name = str(row["room_name"]).strip()
            room_type = str(row["type"]).strip()
            if room_type == "lab":
                room_type = "lab_room"

            faculty_id = fcv_id if room_name in acb_civil else None

            db.add(Room(
                name=room_name,
                type=room_type,
                capacity=int(row["capacity"]),
                building=building,
                faculty_id=faculty_id,
            ))
            inserted_rooms += 1

        db.commit()

    # ── BATCHES ──────────────────────────────────────────────────
    # 4 active batches × 12 departments = 48 batches
    # Batch 21 = Year 4, Batch 22 = Year 3, Batch 23 = Year 2, Batch 24 = Year 1

    batch_data = [
        # (batch_number, year, student_count, dept, section_label)
        # FCSE — Computer Science
        (32, 4, 45, cs,  "BCS-32"),
        (33, 3, 50, cs,  "BCS-33"),
        (34, 2, 55, cs,  "BCS-34"),
        (35, 1, 60, cs,  "BCS-35"),
        # FCSE — Cyber Security
        (32, 4, 45, cyb, "CYS-32"),
        (33, 3, 50, cyb, "CYS-33"),
        (34, 2, 55, cyb, "CYS-34"),
        (35, 1, 60, cyb, "CYS-35"),
        # FCSE — Data Science
        (32, 4, 45, ds,  "BDS-32"),
        (33, 3, 50, ds,  "BDS-33"),
        (34, 2, 55, ds,  "BDS-34"),
        (35, 1, 60, ds,  "BDS-35"),
        # FCSE — Artificial Intelligence
        (32, 4, 45, ai,  "BAI-32"),
        (33, 3, 50, ai,  "BAI-33"),
        (34, 2, 55, ai,  "BAI-34"),
        (35, 1, 60, ai,  "BAI-35"),
        # FCSE — Computer Engineering
        (32, 4, 45, cpe, "BCE-32"),
        (33, 3, 50, cpe, "BCE-33"),
        (34, 2, 55, cpe, "BCE-34"),
        (35, 1, 60, cpe, "BCE-35"),
        # FCSE — Software Engineering
        (32, 4, 45, swe, "SE-32"),
        (33, 3, 50, swe, "SE-33"),
        (34, 2, 55, swe, "SE-34"),
        (35, 1, 60, swe, "SE-35"),
        # FEE — Electrical Engineering (two sections per year, 50 students each)
        # Splitting into A/B keeps each section under 50 seats, so they use
        # medium LH/ACB rooms and leave the 4 large quiz halls for FME.
        (32, 4, 50, ee,  "BEE-32A"),
        (32, 4, 50, ee,  "BEE-32B"),
        (33, 3, 50, ee,  "BEE-33A"),
        (33, 3, 50, ee,  "BEE-33B"),
        (34, 2, 50, ee,  "BEE-34A"),
        (34, 2, 50, ee,  "BEE-34B"),
        (35, 1, 50, ee,  "BEE-35A"),
        (35, 1, 50, ee,  "BEE-35B"),
        # FBS — Basic Sciences
        (32, 4, 45, bsc, "BSC-32"),
        (33, 3, 50, bsc, "BSC-33"),
        (34, 2, 55, bsc, "BSC-34"),
        (35, 1, 60, bsc, "BSC-35"),
        # FME — Mechanical Engineering (two sections per year, 50 students each)
        (32, 4, 50, mec, "BME-32A"),
        (32, 4, 50, mec, "BME-32B"),
        (33, 3, 50, mec, "BME-33A"),
        (33, 3, 50, mec, "BME-33B"),
        (34, 2, 50, mec, "BME-34A"),
        (34, 2, 50, mec, "BME-34B"),
        (35, 1, 50, mec, "BME-35A"),
        (35, 1, 50, mec, "BME-35B"),
        # FMCE — Chemical Engineering
        (32, 4, 50, che, "CME-32"),
        (33, 3, 50, che, "CME-33"),
        (34, 2, 55, che, "CME-34"),
        (35, 1, 60, che, "CME-35"),
        # FMCE — Materials Engineering
        (32, 4, 45, mat, "MTE-32"),
        (33, 3, 50, mat, "MTE-33"),
        (34, 2, 55, mat, "MTE-34"),
        (35, 1, 60, mat, "MTE-35"),
        # FCV — Civil Engineering
        (32, 4, 45, civ, "CVE-32"),
        (33, 3, 50, civ, "CVE-33"),
        (34, 2, 55, civ, "CVE-34"),
        (35, 1, 60, civ, "CVE-35"),
    ]

    batches = [
        Batch(year=year, dept_id=dept.id, student_count=count, section_label=label)
        for (_, year, count, dept, label) in batch_data
    ]
    db.add_all(batches)
    db.commit()

    print("Seed complete.")
    print(f"Faculties:   {db.query(Faculty).count()}")
    print(f"Departments: {db.query(Department).count()}")
    print(f"Rooms:       {db.query(Room).count()}")
    print(f"Batches:     {db.query(Batch).count()}")
    print()
    print("Next steps:")
    print("  1. POST /api/teachers/                          — add teachers per dept")
    print("  2. POST /api/upload/courses                     — upload courses.xlsx")
    print("  3. POST /api/scheduler/generate?scope=faculty&id=1 — generate full FCSE timetable")
    db.close()


if __name__ == "__main__":
    seed()
