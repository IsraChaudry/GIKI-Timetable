from database import SessionLocal, engine, Base
from models.faculty import Faculty
from models.department import Department
from models.batch import Batch
from models.teacher import Teacher
from models.room import Room
from models.course import Course
import models  # ensure all models are imported so Base knows them

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Faculties
    fcse = Faculty(name="Faculty of Computer Science & Engineering", code="FCSE")
    ee   = Faculty(name="Faculty of Electrical Engineering", code="EE")
    db.add_all([fcse, ee])
    db.commit()

    # Departments
    cs = Department(name="Computer Science", faculty_id=fcse.id,
                    lab_day="Monday", lab_window="morning")
    db.add(cs)
    db.commit()

    # Batches
    b1 = Batch(year=1, dept_id=cs.id, student_count=60, section_label="CS LH1")
    b2 = Batch(year=2, dept_id=cs.id, student_count=55, section_label="CS LH2")
    db.add_all([b1, b2])
    db.commit()

    # Rooms
    lh1  = Room(name="CS LH1",   type="lecture_hall", capacity=80,  faculty_id=fcse.id)
    lh2  = Room(name="CS LH2",   type="lecture_hall", capacity=80,  faculty_id=fcse.id)
    lab1 = Room(name="CS Lab 1", type="lab_room",     capacity=40,  faculty_id=fcse.id)
    db.add_all([lh1, lh2, lab1])
    db.commit()

    # Teachers
    t1 = Teacher(name="Dr. Omer Bin Saeed", dept_id=cs.id)
    t2 = Teacher(name="Said Nabi",          dept_id=cs.id)
    t3 = Teacher(name="Dr. Zoya",           dept_id=cs.id)
    db.add_all([t1, t2, t3])
    db.commit()

    # Courses (Year 1 batch)
    c1 = Course(name="Data Structures",    code="CS232",   credit_hours=3,
                is_lab=False, batch_id=b1.id, teacher_id=t1.id, dept_id=cs.id)
    c2 = Course(name="Calculus",           code="MATH101", credit_hours=3,
                is_lab=False, batch_id=b1.id, teacher_id=t2.id, dept_id=cs.id)
    c3 = Course(name="Programming Lab",    code="CS232-L", credit_hours=1,
                is_lab=True,  batch_id=b1.id, teacher_id=t3.id, dept_id=cs.id)
    db.add_all([c1, c2, c3])
    db.commit()

    # Link lab to lecture
    c1.lab_course_id = c3.id
    db.commit()

    print("Seed complete.")
    db.close()

if __name__ == "__main__":
    seed()
