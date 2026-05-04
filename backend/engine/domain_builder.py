import random
from sqlalchemy import or_
from engine.constants import (
    DAYS, SLOTS, FRIDAY_SLOTS, ELECTIVE_SLOT_1, ELECTIVE_SLOT_2,
    ELECTIVE_DAYS, WEDNESDAY_SEMINAR_SLOT, TWO_CREDIT_DAY_PAIRS
)
from models.room import Room
from models.batch import Batch

# Days that are valid starting days for 2-credit courses (must have a pair partner)
_PAIRED_DAYS = {day for pair in TWO_CREDIT_DAY_PAIRS for day in pair}


def build_domains(courses, placed: dict, db, faculty_id=None, ps=None) -> dict:
    domains = {}
    if faculty_id is not None:
        lecture_rooms = db.query(Room).filter(
            Room.type == "lecture_hall",
            or_(Room.faculty_id == faculty_id, Room.faculty_id == None)
        ).all()
    else:
        lecture_rooms = db.query(Room).filter(Room.type == "lecture_hall").all()

    for course in courses:
        batch = db.query(Batch).filter(Batch.id == course.batch_id).first()

        # Rooms that fit this batch, sorted ascending by capacity (best-fit first).
        # This keeps large rooms (e.g. EE Main 150) available for large batches
        # instead of being grabbed by small batches that could use smaller rooms.
        fit_rooms = sorted(
            [r for r in lecture_rooms if r.capacity >= batch.student_count],
            key=lambda r: r.capacity
        )

        slot_map = {}  # (day, si) -> list of (day, si, room_id) in capacity order

        for day in DAYS:
            if day == "Saturday" and not course.allow_saturday:
                continue
            if course.credit_hours == 2 and day not in _PAIRED_DAYS:
                continue

            slot_grid = FRIDAY_SLOTS if day == "Friday" else SLOTS

            for slot in slot_grid:
                si = slot["index"]

                if batch.year in [3, 4]:
                    if si in [ELECTIVE_SLOT_1, ELECTIVE_SLOT_2] and day in ELECTIVE_DAYS:
                        continue

                if day == "Wednesday" and si == WEDNESDAY_SEMINAR_SLOT:
                    continue

                # Pre-filter: if the teacher or batch is already placed at this
                # (day, slot) by a previously-committed scope (another faculty's
                # sessions or published sessions), skip it entirely. This shrinks
                # the domain for later faculties and avoids dead-end paths.
                if ps:
                    if (day, si) in ps['teacher'].get(course.teacher_id, set()):
                        continue
                    if (day, si) in ps['batch'].get(course.batch_id, set()):
                        continue

                options = [
                    (day, si, room.id)
                    for room in fit_rooms
                    if (room.id, day, si) not in placed
                ]
                if options:
                    slot_map[(day, si)] = options

        # Shuffle (day, slot) pairs to ensure variety between courses and avoid
        # all courses competing for the same slots. Rooms within each slot stay
        # in capacity order so small batches use small rooms first.
        keys = list(slot_map.keys())
        random.shuffle(keys)
        domains[course] = [item for k in keys for item in slot_map[k]]

    return domains
