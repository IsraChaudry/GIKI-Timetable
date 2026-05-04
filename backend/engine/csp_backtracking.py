from engine.constants import LAB_MORNING, LAB_AFTERNOON, MAX_BACKTRACKS, TWO_CREDIT_DAY_PAIRS
from engine.domain_builder import build_domains
from engine.conflict_graph import build_graph
from engine.soft_optimizer import optimize
from engine.suggestions import get_suggestion
from models.course import Course
from models.batch import Batch
from models.department import Department
from models.room import Room
from models.schedule import Schedule


def course_matches_scope(course, scope: str, scope_id: int, db):
    if scope == "batch":
        return course.batch_id == scope_id
    elif scope == "dept":
        batch = db.query(Batch).filter(Batch.id == course.batch_id).first()
        return batch.dept_id == scope_id if batch else False
    elif scope == "faculty":
        batch = db.query(Batch).filter(Batch.id == course.batch_id).first()
        dept = db.query(Department).filter(Department.id == batch.dept_id).first() if batch else None
        return dept.faculty_id == scope_id if dept else False
    return False


def load_courses(scope: str, scope_id: int, db):
    query = db.query(Course)
    if scope == "batch":
        return query.filter(Course.batch_id == scope_id).all()
    if scope == "dept":
        batch_ids = [b.id for b in db.query(Batch).filter(Batch.dept_id == scope_id).all()]
        return query.filter(Course.batch_id.in_(batch_ids)).all() if batch_ids else []
    if scope == "faculty":
        dept_ids = [d.id for d in db.query(Department).filter(Department.faculty_id == scope_id).all()]
        batch_ids = [b.id for b in db.query(Batch).filter(Batch.dept_id.in_(dept_ids)).all()]
        return query.filter(Course.batch_id.in_(batch_ids)).all() if batch_ids else []
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
        db.add(Schedule(
            course_id=course.id,
            room_id=result["room_id"],
            batch_id=course.batch_id,
            day=result["day"],
            slot_index=slot,
            session_number=i + 1,
            status="draft",
        ))
    db.commit()


def _ps_add(ps, course, day, slot, room_id):
    ps['teacher'].setdefault(course.teacher_id, set()).add((day, slot))
    ps['room'].setdefault(room_id, set()).add((day, slot))
    ps['batch'].setdefault(course.batch_id, set()).add((day, slot))
    ps['course'].setdefault(course.id, set()).add(day)


def _ps_remove(ps, course, day, slot, room_id):
    ps['teacher'][course.teacher_id].discard((day, slot))
    ps['room'][room_id].discard((day, slot))
    ps['batch'][course.batch_id].discard((day, slot))
    ps['course'][course.id].discard(day)


def backtrack(index, nodes, assignments, ps, domains, backtrack_count):
    """
    ps (placed_sets) — O(1) lookup dicts:
      teacher: {teacher_id -> set of (day, slot)}
      room:    {room_id    -> set of (day, slot)}
      batch:   {batch_id   -> set of (day, slot)}
      course:  {course_id  -> set of days used}
    """
    if index == len(nodes):
        return True

    course = nodes[index]
    sessions_placed = len(ps['course'].get(course.id, set()))

    if sessions_placed >= course.credit_hours:
        return backtrack(index + 1, nodes, assignments, ps, domains, backtrack_count)

    used_days = ps['course'].get(course.id, set())

    for (day, slot, room_id) in domains[course]:
        if day in used_days:
            continue
        if (day, slot) in ps['teacher'].get(course.teacher_id, set()):
            continue
        if (day, slot) in ps['room'].get(room_id, set()):
            continue
        if (day, slot) in ps['batch'].get(course.batch_id, set()):
            continue
        if course.credit_hours == 2 and used_days:
            first_day = next(iter(used_days))
            if not any(
                first_day in pair and day in pair and first_day != day
                for pair in TWO_CREDIT_DAY_PAIRS
            ):
                continue

        key = (course, sessions_placed + 1)
        assignments[key] = (day, slot, room_id)
        _ps_add(ps, course, day, slot, room_id)

        if backtrack(index, nodes, assignments, ps, domains, backtrack_count):
            return True

        del assignments[key]
        _ps_remove(ps, course, day, slot, room_id)

        backtrack_count[0] += 1
        if backtrack_count[0] > MAX_BACKTRACKS:
            return False

    return False


def save_lecture_sessions(assignments, db):
    for (course, session_number), (day, slot, room_id) in assignments.items():
        db.add(Schedule(
            course_id=course.id,
            room_id=room_id,
            batch_id=course.batch_id,
            day=day,
            slot_index=slot,
            session_number=session_number,
            status="draft",
        ))
    db.commit()


def run_scheduler(scope: str, scope_id: int) -> dict:
    from database import SessionLocal
    db = SessionLocal()
    try:
        return _run_scheduler_inner(scope, scope_id, db)
    finally:
        db.close()


def run_scheduler_batches(faculty_id: int, batch_ids: list) -> dict:
    """Schedule a specific subset of batches within a faculty.
    Used to pre-split large faculties so batch groups don't compete for the
    same large rooms, making each CSP sub-problem much faster."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        return _run_scheduler_inner("faculty", faculty_id, db, batch_ids_override=batch_ids)
    finally:
        db.close()


def _run_scheduler_inner(scope: str, scope_id: int, db, batch_ids_override=None) -> dict:
    if batch_ids_override is not None:
        # Pre-split mode: schedule only the given batches within this faculty.
        # faculty_id = scope_id (caller always passes it as such).
        relevant_batch_ids = list(batch_ids_override)
        batch_id_set = set(relevant_batch_ids)
        courses = db.query(Course).filter(Course.batch_id.in_(relevant_batch_ids)).all()
        faculty_id = scope_id
    else:
        courses = load_courses(scope, scope_id, db)
        batch_id_set = None  # will use course_matches_scope instead

        if scope == "batch":
            relevant_batch_ids = [scope_id]
        elif scope == "dept":
            relevant_batch_ids = [b.id for b in db.query(Batch).filter(Batch.dept_id == scope_id).all()]
        elif scope == "faculty":
            dept_ids = [d.id for d in db.query(Department).filter(Department.faculty_id == scope_id).all()]
            relevant_batch_ids = [b.id for b in db.query(Batch).filter(Batch.dept_id.in_(dept_ids)).all()]
        else:
            relevant_batch_ids = []

        if scope == "faculty":
            faculty_id = scope_id
        elif scope == "dept":
            dept_obj = db.query(Department).filter(Department.id == scope_id).first()
            faculty_id = dept_obj.faculty_id if dept_obj else None
        elif scope == "batch":
            batch_obj = db.query(Batch).filter(Batch.id == scope_id).first()
            dept_obj = db.query(Department).filter(Department.id == batch_obj.dept_id).first() if batch_obj else None
            faculty_id = dept_obj.faculty_id if dept_obj else None
        else:
            faculty_id = None

    if not courses:
        return {"status": "error", "message": "No courses found for this scope"}

    db.query(Schedule).filter(
        Schedule.batch_id.in_(relevant_batch_ids),
        Schedule.status == "draft"
    ).delete(synchronize_session=False)
    db.commit()

    # ps tracks occupied slots for O(1) constraint checks
    placed = {}
    ps = {'teacher': {}, 'room': {}, 'batch': {}, 'course': {}}
    errors = []

    # Pre-populate placed/ps from sessions already in the DB (other faculties +
    # any published sessions in current scope). This prevents room and teacher
    # conflicts across separately-generated scopes.
    existing = db.query(Schedule).all()
    if existing:
        ext_course_ids = list({s.course_id for s in existing})
        ext_course_map = {
            c.id: c
            for c in db.query(Course).filter(Course.id.in_(ext_course_ids)).all()
        }
        for s in existing:
            c = ext_course_map.get(s.course_id)
            if not c:
                continue
            placed[(s.room_id, s.day, s.slot_index)] = True
            ps['teacher'].setdefault(c.teacher_id, set()).add((s.day, s.slot_index))
            ps['room'].setdefault(s.room_id, set()).add((s.day, s.slot_index))
            ps['batch'].setdefault(s.batch_id, set()).add((s.day, s.slot_index))

    def _in_scope(c):
        if batch_id_set is not None:
            return c.batch_id in batch_id_set
        return course_matches_scope(c, scope, scope_id, db)

    lab_courses = [c for c in courses if c.is_lab and _in_scope(c)]
    for lc in lab_courses:
        result = place_lab(lc, placed, db)
        if result["ok"]:
            placed.update(result["occupied"])
            for s in result["slots"]:
                ps['teacher'].setdefault(lc.teacher_id, set()).add((result["day"], s))
                ps['room'].setdefault(result["room_id"], set()).add((result["day"], s))
                ps['batch'].setdefault(lc.batch_id, set()).add((result["day"], s))
            save_lab_sessions(lc, result, db)
        else:
            errors.append(result["error"])

    lecture_courses = [c for c in courses if not c.is_lab and _in_scope(c)]

    # Build domains once to check for empty (empty = data problem, not ordering problem).
    initial_domains = build_domains(lecture_courses, placed, db, faculty_id=faculty_id, ps=ps)
    empty = [c.code for c, d in initial_domains.items() if not d]
    if empty:
        return {"status": "error", "empty_domains": empty,
                "message": f"No valid slots for: {empty}",
                "suggestion": get_suggestion("no_slot")}

    # Random-restart: re-shuffle domain order on each attempt so the CSP
    # explores a different path through the search space each time.
    MAX_RESTARTS = 5
    assignments = {}
    solved = False
    for attempt in range(MAX_RESTARTS):
        domains = initial_domains if attempt == 0 else \
                  build_domains(lecture_courses, placed, db, faculty_id=faculty_id, ps=ps)
        nodes = build_graph(lecture_courses, domains)
        backtrack_count = [0]
        assignments = {}
        if backtrack(0, nodes, assignments, ps, domains, backtrack_count):
            solved = True
            break

    if not solved:
        return {"status": "failed", "errors": errors,
                "message": "CSP could not find a valid assignment",
                "suggestion": get_suggestion("no_solution")}

    optimize(assignments, db)
    save_lecture_sessions(assignments, db)

    return {"status": "success", "errors": errors, "placed": len(assignments)}
