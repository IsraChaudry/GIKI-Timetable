from engine.constants import LAB_MORNING, LAB_AFTERNOON, MAX_BACKTRACKS
from engine.domain_builder import build_domains
from engine.conflict_graph import build_graph
from engine.constraints import all_constraints_pass
from engine.soft_optimizer import optimize
from engine.suggestions import get_suggestion
from models.course import Course
from models.batch import Batch
from models.department import Department
from models.room import Room
from models.schedule import Schedule


def load_courses(scope: str, scope_id: int, db):
    if scope == "batch":
        return db.query(Course).filter(Course.batch_id == scope_id).all()
    elif scope == "dept":
        batches = db.query(Batch).filter(Batch.dept_id == scope_id).all()
        batch_ids = [b.id for b in batches]
        return db.query(Course).filter(Course.batch_id.in_(batch_ids)).all()
    elif scope == "faculty":
        depts = db.query(Department).filter(Department.faculty_id == scope_id).all()
        dept_ids = [d.id for d in depts]
        batches = db.query(Batch).filter(Batch.dept_id.in_(dept_ids)).all()
        batch_ids = [b.id for b in batches]
        return db.query(Course).filter(Course.batch_id.in_(batch_ids)).all()
    return []


def place_lab(course, placed: dict, db):
    dept  = db.query(Department).filter(Department.id == course.dept_id).first()
    batch = db.query(Batch).filter(Batch.id == course.batch_id).first()

    if not dept.lab_day or not dept.lab_window:
        return {"ok": False, "error": f"{course.code}: dept lab schedule not configured"}

    slots = LAB_MORNING if dept.lab_window == "morning" else LAB_AFTERNOON
    day   = dept.lab_day

    lab_rooms = db.query(Room).filter(
        Room.type == "lab_room",
        Room.capacity >= batch.student_count
    ).all()

    for room in lab_rooms:
        if not any((room.id, day, s) in placed for s in slots):
            new_occupied = {(room.id, day, s): True for s in slots}
            return {"ok": True, "room_id": room.id, "day": day,
                    "slots": slots, "occupied": new_occupied}

    return {"ok": False, "error": f"{course.code}: no lab room available on {day}"}


def save_lab_sessions(course, result, db):
    for i, slot in enumerate(result["slots"]):
        row = Schedule(
            course_id=course.id,
            room_id=result["room_id"],
            batch_id=course.batch_id,
            day=result["day"],
            slot_index=slot,
            session_number=i + 1,
            status="draft",
        )
        db.add(row)
    db.commit()


def backtrack(index, nodes, assignments, domains, backtrack_count):
    if index == len(nodes):
        return True

    course = nodes[index]
    sessions_placed = sum(1 for (c, sn) in assignments if c.id == course.id)

    if sessions_placed >= course.credit_hours:
        return backtrack(index + 1, nodes, assignments, domains, backtrack_count)

    for (day, slot, room_id) in domains[course]:
        if all_constraints_pass(course, day, slot, room_id, assignments):
            key = (course, sessions_placed + 1)
            assignments[key] = (day, slot, room_id)
            if backtrack(index, nodes, assignments, domains, backtrack_count):
                return True
            del assignments[key]
            backtrack_count[0] += 1
            if backtrack_count[0] > MAX_BACKTRACKS:
                return False

    return False


def save_lecture_sessions(assignments, db):
    for (course, session_number), (day, slot, room_id) in assignments.items():
        row = Schedule(
            course_id=course.id,
            room_id=room_id,
            batch_id=course.batch_id,
            day=day,
            slot_index=slot,
            session_number=session_number,
            status="draft",
        )
        db.add(row)
    db.commit()


def run_scheduler(scope: str, scope_id: int, db) -> dict:
    courses = load_courses(scope, scope_id, db)
    if not courses:
        return {"status": "error", "message": "No courses found for this scope"}

    batch_ids = list(set(c.batch_id for c in courses))
    db.query(Schedule).filter(
        Schedule.batch_id.in_(batch_ids),
        Schedule.status == "draft"
    ).delete(synchronize_session=False)
    db.commit()

    placed = {}
    errors = []
    for lc in [c for c in courses if c.is_lab]:
        result = place_lab(lc, placed, db)
        if result["ok"]:
            placed.update(result["occupied"])
            save_lab_sessions(lc, result, db)
        else:
            errors.append(result["error"])

    lecture_courses = [c for c in courses if not c.is_lab]
    domains = build_domains(lecture_courses, placed, db)

    empty = [c.code for c, d in domains.items() if not d]
    if empty:
        return {"status": "error", "empty_domains": empty,
                "message": f"No valid slots for: {empty}",
                "suggestion": get_suggestion("no_slot")}

    nodes = build_graph(lecture_courses, domains)
    backtrack_count = [0]
    assignments = {}

    if not backtrack(0, nodes, assignments, domains, backtrack_count):
        return {"status": "failed", "errors": errors,
                "message": "CSP could not find a valid assignment",
                "suggestion": get_suggestion("no_solution")}

    optimize(assignments, db)
    save_lecture_sessions(assignments, db)

    return {"status": "success", "errors": errors, "placed": len(assignments)}
