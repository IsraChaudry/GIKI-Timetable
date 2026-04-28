// These MUST match backend/engine/constants.py.
// If you change one, change the other.

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// Mon–Thu: 8 slots, indices 0–7
export const SLOTS = [
  { index: 0, start: '8:00 AM',  end: '8:50 AM'  },
  { index: 1, start: '9:00 AM',  end: '9:50 AM'  },
  { index: 2, start: '10:30 AM', end: '11:20 AM' },
  { index: 3, start: '11:30 AM', end: '12:20 PM' },
  { index: 4, start: '12:30 PM', end: '1:20 PM'  },
  { index: 5, start: '2:30 PM',  end: '3:20 PM'  },
  { index: 6, start: '3:30 PM',  end: '4:20 PM'  },
  { index: 7, start: '4:30 PM',  end: '5:20 PM'  },
]

// Friday: only 6 slots, with mid-day shifted earlier for Jumu'ah and longer afternoon blocks
export const FRIDAY_SLOTS = [
  { index: 0, start: '8:00 AM',  end: '8:50 AM'  },
  { index: 1, start: '9:00 AM',  end: '9:50 AM'  },
  { index: 2, start: '11:00 AM', end: '11:50 AM' },
  { index: 3, start: '12:00 PM', end: '12:50 PM' },
  { index: 4, start: '2:00 PM',  end: '3:30 PM'  },
  { index: 5, start: '3:30 PM',  end: '5:00 PM'  },
]

export const BREAKS = {
  tea:   { start: '9:50 AM', end: '10:30 AM', label: 'Tea Break' },
  lunch: { start: '1:30 PM', end: '2:30 PM',  label: 'Lunch & Prayer' },
}

// Helper: slot grid for a given day
export const slotsFor = (day) => (day === 'Friday' ? FRIDAY_SLOTS : SLOTS)

// Helper: max slot count any day in the week (used for table column count)
export const MAX_SLOTS = SLOTS.length // 8

// Room type vocabulary — backend uses these exact values
export const ROOM_TYPES = [
  { value: 'lecture_hall', label: 'Lecture Hall' },
  { value: 'lab_room',     label: 'Lab Room' },
]

// Scheduler scope vocabulary — backend expects these exact values
export const SCOPES = [
  { value: 'batch',   label: 'Batch' },
  { value: 'dept',    label: 'Department' },
  { value: 'faculty', label: 'Faculty' },
]
