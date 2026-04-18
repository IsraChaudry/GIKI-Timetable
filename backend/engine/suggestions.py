SUGGESTIONS = {
    "no_solution": "Try reducing courses per batch, adding more rooms, or relaxing constraints.",
    "no_lab_room": "Add more lab rooms or change the lab day/window for this department.",
    "teacher_clash": "Assign different teachers to clashing courses or reduce their load.",
    "no_slot": "A course has no valid slot. Check elective window and seminar slot restrictions.",
    "no_config": "Set lab_day and lab_window for this department before scheduling.",
}

def get_suggestion(code: str) -> str:
    return SUGGESTIONS.get(code, "Review constraints and try again.")
