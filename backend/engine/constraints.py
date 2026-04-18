from engine.constants import TWO_CREDIT_DAY_PAIRS

def check_teacher_free(course, day, slot, assignments):
    for (c, sn), (d, s, r) in assignments.items():
        if d == day and s == slot and c.teacher_id == course.teacher_id:
            return False
    return True

def check_room_free(course, day, slot, room_id, assignments):
    for (c, sn), (d, s, r) in assignments.items():
        if d == day and s == slot and r == room_id:
            return False
    return True

def check_batch_free(course, day, slot, assignments):
    for (c, sn), (d, s, r) in assignments.items():
        if d == day and s == slot and c.batch_id == course.batch_id:
            return False
    return True

def check_no_same_day_repeat(course, day, assignments):
    for (c, sn), (d, s, r) in assignments.items():
        if c.id == course.id and d == day:
            return False
    return True

def check_two_credit_pairing(course, day, assignments):
    if course.credit_hours != 2:
        return True
    prev_days = [d for (c, sn), (d, s, r) in assignments.items() if c.id == course.id]
    if not prev_days:
        return True
    first_day = prev_days[0]
    for pair in TWO_CREDIT_DAY_PAIRS:
        if first_day in pair and day in pair and first_day != day:
            return True
    return False

def all_constraints_pass(course, day, slot, room_id, assignments):
    return (
        check_teacher_free(course, day, slot, assignments) and
        check_room_free(course, day, slot, room_id, assignments) and
        check_batch_free(course, day, slot, assignments) and
        check_no_same_day_repeat(course, day, assignments) and
        check_two_credit_pairing(course, day, assignments)
    )
