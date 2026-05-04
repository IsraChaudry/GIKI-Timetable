SLOTS = [
    {"index": 1, "start": "8:00 AM",  "end": "8:50 AM"},
    {"index": 2, "start": "9:00 AM",  "end": "9:50 AM"},
    {"index": 3, "start": "10:30 AM", "end": "11:20 AM"},
    {"index": 4, "start": "11:30 AM", "end": "12:20 PM"},
    {"index": 5, "start": "12:30 PM", "end": "1:20 PM"},
    {"index": 6, "start": "2:30 PM",  "end": "3:20 PM"},
    {"index": 7, "start": "3:30 PM",  "end": "4:20 PM"},
    {"index": 8, "start": "4:30 PM",  "end": "5:20 PM"},
]

SLOT_INDICES = [s["index"] for s in SLOTS]  # [1,2,3,4,5,6,7,8]

BREAK_TEA   = {"start": "9:50 AM", "end": "10:30 AM", "label": "Tea Break"}
BREAK_LUNCH = {"start": "1:20 PM", "end": "2:30 PM",  "label": "Lunch and Prayer Break"}

DAYS     = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

LAB_MORNING   = [1, 2, 3]
LAB_AFTERNOON = [6, 7, 8]

ELECTIVE_SLOT_1 = 7
ELECTIVE_SLOT_2 = 8
ELECTIVE_DAYS   = ["Monday", "Tuesday", "Wednesday"]

TWO_CREDIT_DAY_PAIRS = [
    ["Monday",  "Wednesday"],
    ["Tuesday", "Thursday"],
]

WEDNESDAY_SEMINAR_SLOT = 5   # 12:30-13:20 blocked for all batches on Wednesday

MAX_BACKTRACKS         = 2_000_000
ENGINE_TIMEOUT_SECONDS = 120
SOFT_OPTIMIZER_SECONDS = 5   # kept for soft_optimizer.py

FRIDAY_SLOTS = [
    {"index": 1, "start": "8:00 AM",  "end": "8:50 AM"},
    {"index": 2, "start": "9:00 AM",  "end": "9:50 AM"},
    {"index": 3, "start": "10:00 AM", "end": "10:50 AM"},
    {"index": 4, "start": "11:00 AM", "end": "11:50 AM"},
    {"index": 5, "start": "12:00 PM", "end": "12:50 PM"},
    {"index": 6, "start": "2:30 PM",  "end": "3:20 PM"},
    {"index": 7, "start": "3:30 PM",  "end": "4:20 PM"},
    {"index": 8, "start": "4:30 PM",  "end": "5:20 PM"},
]
