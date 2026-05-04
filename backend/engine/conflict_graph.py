def build_graph(courses, domains) -> list:
    degree = {c: 0 for c in courses}
    for i, a in enumerate(courses):
        for b in courses[i + 1:]:
            if a.batch_id == b.batch_id or a.teacher_id == b.teacher_id:
                degree[a] += 1
                degree[b] += 1
    # MRV first (fewest domain options = most constrained → place early to fail fast),
    # then degree as tiebreaker (most conflicts first).
    return sorted(courses, key=lambda c: (len(domains[c]), -degree[c]))
