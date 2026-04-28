# GIKI Timetable — Frontend

A React + Vite + Tailwind frontend for the GIKI Timetable backend (FastAPI).

## Quick start

```bash
# 1. Install dependencies (one-time)
npm install

# 2. Make sure the backend is running on http://localhost:8000
#    (See backend/README — typically: uvicorn main:app --reload)

# 3. Start the dev server
npm run dev
```

Open <http://localhost:5173> in your browser. Log in with the password set in
`backend/.env` (look for `ADMIN_PASSWORD` — the default in `verify_backend.py`
is `changeme123`).

To build for production:

```bash
npm run build       # outputs to dist/
npm run preview     # serves the production build locally for testing
```

## Configuration

The backend URL defaults to `http://localhost:8000`. To point at a different
host (e.g. a deployed backend), copy `.env.example` to `.env` and edit:

```
VITE_API_BASE=https://your-backend.example.com
```

Make sure that host is added to the CORS allow-list in `backend/main.py`.

## Project structure

```
src/
├── App.jsx                 # auth gate + page router + central data cache
├── main.jsx                # React entry point
├── index.css               # Tailwind + base styles
│
├── lib/
│   ├── api.js              # all backend HTTP calls — single source of truth
│   └── constants.js        # SLOTS, DAYS, ROOM_TYPES — must match backend/engine/constants.py
│
├── components/
│   ├── Layout.jsx          # sidebar + topbar shell
│   ├── EntityTable.jsx     # reusable CRUD list table (used by every entity page)
│   ├── TimetableGrid.jsx   # weekly grid renderer with Friday/Saturday handling
│   └── ui.jsx              # Modal, Spinner, Notice, Toast, Confirm primitives
│
└── pages/
    ├── Login.jsx           # password login
    ├── Dashboard.jsx       # at-a-glance stats + warnings
    ├── Timetable.jsx       # view a batch's timetable, export PDF
    ├── Scheduler.jsx       # generate / publish / clear schedules
    ├── Conflicts.jsx       # view scheduling conflicts
    ├── Schedules.jsx       # RoomSchedule + TeacherSchedule (aggregated views)
    ├── Slots.jsx           # read-only slot reference
    └── Entities.jsx        # Faculties, Departments, Batches, Teachers, Rooms, Courses CRUD
```

## What the frontend does

- **Login** — POST `/api/auth/login`, store JWT in `localStorage`, attach as Bearer to every subsequent request.
- **Dashboard** — counts of every entity, capacity distribution, warnings about misconfigured departments.
- **Timetable** — pick a batch, see its weekly grid; lab vs lecture vs published color-coded; download as PDF.
- **Generator** — invoke the CSP solver (28 s timeout) for a batch, department, or faculty; rich result panel showing successes, errors, and suggestions; publish drafts; clear drafts (or all, with force).
- **Conflicts** — list all scheduling conflicts for a batch with type, day/slot, and remediation suggestion.
- **Room Schedule** — pick any room, see when it's occupied across all batches.
- **Teacher Schedule** — pick any teacher, see their full week of teaching.
- **Slots** — visual reference for the slot grid (Mon–Thu vs Friday vs breaks).
- **Faculties / Departments / Batches / Teachers / Rooms / Courses** — full CRUD with search, foreign-key dropdowns, validation.

## Important details / gotchas the frontend handles for you

These are bug magnets — calling these out so future maintainers know.

1. **Trailing slashes on list endpoints.** FastAPI mounts list routes at `/`, so `/api/courses` *redirects* to `/api/courses/` and on the redirect some browsers drop the `Authorization` header → 401. `lib/api.js` always uses the trailing slash.

2. **Friday has only 6 slots, not 8.** The mid-day slots are shifted earlier for Jumu'ah (10:00–10:50 → 11:00–11:50) and afternoon blocks are 90 minutes instead of 50. The grid renderer marks invalid Friday columns with a "—" so the table stays aligned.

3. **Saturday is opt-in per course.** Only courses with `allow_saturday=true` can be scheduled on Saturday. The grid hides Saturday entirely if nothing is scheduled there.

4. **Scope vocabulary.** The backend expects `scope=batch | dept | faculty` (note: `dept`, not `department`). The UI shows "Department" but sends `dept`.

5. **Room types.** Backend uses exactly two values: `lecture_hall` and `lab_room`. Anything else will fail validation.

6. **PDF download needs a Bearer token.** You can't `window.open()` the PDF endpoint because the new tab won't carry the auth header. `exportPdf()` in `lib/api.js` fetches as a Blob and triggers a download.

7. **Department lab config is required for lab placement.** Departments must have `lab_day` and `lab_window` set or the scheduler will fail on lab courses. The Dashboard surfaces a warning about misconfigured departments.

## Adding a new page

1. Create a new component in `src/pages/`.
2. Add it to the `NAV_GROUPS` array in `src/components/Layout.jsx`.
3. Wire it up in the page router at the bottom of `src/App.jsx`.
4. If it needs a new backend endpoint, add a wrapper in `src/lib/api.js`.

## Adding a new entity (with CRUD)

If your backend partner adds a new entity (say, `terms`):

1. In `src/lib/api.js`, add: `export const terms = crud('terms')`.
2. In `src/pages/Entities.jsx`, write a `Terms` page that uses `<EntityTable api={terms} ... />` — copy the structure of `Faculties` and tweak.
3. Wire it into `src/App.jsx` and `Layout.jsx`.

## Things deliberately NOT in this frontend

- **Drag-drop schedule editing** — the backend has no PATCH route for individual schedule rows. This would need backend work first.
- **Real-time updates** — no WebSocket / SSE on the backend yet.
- **User roles** — backend has only one shared admin password.

Add these once the backend supports them.
