import time
import random
from engine.constants import SOFT_OPTIMIZER_SECONDS
from engine.constraints import all_constraints_pass


def cost(assignments):
    score = 0
    mwf = {"Monday", "Wednesday", "Friday"}
    for (course, sn), (day, slot, room_id) in assignments.items():
        if course.credit_hours == 3 and day not in mwf:
            score += 5
    return score


def optimize(assignments, db):
    deadline = time.time() + SOFT_OPTIMIZER_SECONDS
    keys = list(assignments.keys())
    while time.time() < deadline and len(keys) >= 2:
        k1, k2 = random.sample(keys, 2)
        c1, d1, s1, r1 = k1[0], *assignments[k1]
        c2, d2, s2, r2 = k2[0], *assignments[k2]
        current_cost = cost(assignments)
        assignments[k1] = (d2, s2, r2)
        assignments[k2] = (d1, s1, r1)
        temp = {k: v for k, v in assignments.items() if k != k1 and k != k2}
        valid = (
            all_constraints_pass(c1, d2, s2, r2, temp) and
            all_constraints_pass(c2, d1, s1, r1, temp)
        )
        if valid and cost(assignments) < current_cost:
            pass
        else:
            assignments[k1] = (d1, s1, r1)
            assignments[k2] = (d2, s2, r2)
