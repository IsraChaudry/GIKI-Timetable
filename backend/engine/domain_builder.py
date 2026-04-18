from engine.constants import (
    DAYS, SLOTS, FRIDAY_SLOTS, ELECTIVE_SLOT_1, ELECTIVE_SLOT_2,
    ELECTIVE_DAYS, WEDNESDAY_SEMINAR_SLOT
)
from models.room import Room
from models.batch import Batch

def build_domains(courses, placed: dict, db) -> dict:
    domains = {}
    lecture_rooms = db.query(Room).filter(Room.type == "lecture_hall").all()

    for course in courses:
        batch = db.query(Batch).filter(Batch.id == course.batch_id).first()
        valid = []

        for day in DAYS:
            if day == "Saturday" and not course.allow_saturday:
                continue
            slot_grid = FRIDAY_SLOTS if day == "Friday" else SLOTS

            for slot in slot_grid:
                si = slot["index"]

                if batch.year in [3, 4]:
                    if si in [ELECTIVE_SLOT_1, ELECTIVE_SLOT_2] and day in ELECTIVE_DAYS:
                        continue

                if day == "Wednesday" and si == WEDNESDAY_SEMINAR_SLOT:
                    continue

                for room in lecture_rooms:
                    if room.capacity < batch.student_count:
                        continue
                    if (room.id, day, si) in placed:
                        continue
                    valid.append((day, si, room.id))

        domains[course] = valid
    return domains
