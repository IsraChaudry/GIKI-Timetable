SLOTS = [
    {"index": 0, "start": "8:00 AM",  "end": "8:50 AM"},
    {"index": 1, "start": "9:00 AM",  "end": "9:50 AM"},
    {"index": 2, "start": "10:30 AM", "end": "11:20 AM"},
    {"index": 3, "start": "11:30 AM", "end": "12:20 PM"},
    {"index": 4, "start": "12:30 PM", "end": "1:20 PM"},
    {"index": 5, "start": "2:30 PM",  "end": "3:20 PM"},
    {"index": 6, "start": "3:30 PM",  "end": "4:20 PM"},
    {"index": 7, "start": "4:30 PM",  "end": "5:20 PM"},
]
SLOT_INDICES = [s["index"] for s in SLOTS]

BREAK_TEA   = {"start": "9:50 AM",  "end": "10:30 AM", "label": "Tea Break"}
BREAK_LUNCH = {"start": "1:30 PM",  "end": "2:30 PM",  "label": "Lunch and Prayer Break"}

DAYS     = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

LAB_MORNING   = [0, 1, 2]
LAB_AFTERNOON = [5, 6, 7]

ELECTIVE_SLOT_1 = 6
ELECTIVE_SLOT_2 = 7
ELECTIVE_DAYS   = ["Monday", "Wednesday", "Thursday"]

TWO_CREDIT_DAY_PAIRS = [
    ["Monday",  "Wednesday"],
    ["Tuesday", "Thursday"],
]

WEDNESDAY_SEMINAR_SLOT = 4

MAX_BACKTRACKS         = 500_000
ENGINE_TIMEOUT_SECONDS = 28
SOFT_OPTIMIZER_SECONDS = 5

FRIDAY_SLOTS = [
    {"index": 0, "start": "8:00 AM",  "end": "8:50 AM"},
    {"index": 1, "start": "9:00 AM",  "end": "9:50 AM"},
    {"index": 2, "start": "11:00 AM", "end": "11:50 AM"},
    {"index": 3, "start": "12:00 PM", "end": "12:50 PM"},
    {"index": 4, "start": "2:00 PM",  "end": "3:30 PM"},
    {"index": 5, "start": "3:30 PM",  "end": "5:00 PM"},
]
