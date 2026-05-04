import { useEffect, useState } from 'react'
import { faculties, departments, batches, teachers, rooms, courses, API_BASE } from '../lib/api.js'
import { Spinner, Notice } from '../components/ui.jsx'

export function Dashboard({ data, setPage }) {
  // `data` comes from App-level cache so we don't refetch on every navigation
  const stats = {
    faculties:   data.faculties?.length   ?? '—',
    departments: data.departments?.length ?? '—',
    batches:     data.batches?.length     ?? '—',
    teachers:    data.teachers?.length    ?? '—',
    rooms:       data.rooms?.length       ?? '—',
    courses:     data.courses?.length     ?? '—',
  }
  const lecHalls = data.rooms?.filter((r) => r.type === 'lecture_hall').length ?? 0
  const labRooms = data.rooms?.filter((r) => r.type === 'lab_room').length ?? 0
  const labCourses = data.courses?.filter((c) => c.is_lab).length ?? 0

  // Departments without lab config — these will fail the scheduler
  const unconfDepts = data.departments?.filter((d) => !d.lab_day || !d.lab_window) || []

  return (
    <div className="space-y-5">
      {/* Hero numbers */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat n={stats.faculties}   l="Faculties"   color="text-accent" />
        <Stat n={stats.departments} l="Departments" color="text-cyan-400" />
        <Stat n={stats.batches}     l="Batches"     color="text-violet-400" />
        <Stat n={stats.teachers}    l="Teachers"    color="text-pink-400" />
        <Stat n={stats.rooms}       l={`Rooms (${lecHalls}LH + ${labRooms}Lab)`} color="text-warn" />
        <Stat n={stats.courses}     l={`Courses (${labCourses} labs)`} color="text-ok" />
      </div>

      {/* Warnings */}
      {unconfDepts.length > 0 && (
        <Notice kind="warn">
          <strong>{unconfDepts.length} department(s)</strong> are missing <code className="font-mono">lab_day</code>/
          <code className="font-mono">lab_window</code> configuration:
          {' '}<span className="font-mono">{unconfDepts.map((d) => d.name).join(', ')}</span>.
          Lab placement will fail for these. Edit them in the Departments page.
        </Notice>
      )}

      {data.faculties && data.faculties.length === 0 && (
        <Notice kind="warn">
          No data yet. Run <code className="font-mono">python seed.py</code> from the backend folder, or
          start adding faculties → departments → batches → teachers → rooms → courses in that order.
        </Notice>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Quick actions */}
        <div className="card-pad lg:col-span-2">
          <div className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Quick actions</div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Action label="View timetable" hint="Pick a batch and load its grid"
                    onClick={() => setPage('timetable')} />
            <Action label="Generate schedule" hint="Run the CSP scheduler"
                    onClick={() => setPage('scheduler')} />
            <Action label="Check conflicts" hint="See overlapping bookings"
                    onClick={() => setPage('conflicts')} />
            <Action label="Manage courses" hint="Add, edit, or remove courses"
                    onClick={() => setPage('courses')} />
          </div>
        </div>

        {/* API endpoints */}
        <div className="card-pad">
          <div className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Backend</div>
          <div className="font-mono text-[10px] text-muted leading-relaxed">
            <div>{API_BASE}</div>
            <div className="mt-2 text-slate-400">Authenticated with Bearer JWT (24h expiry).</div>
          </div>
        </div>
      </div>

      {/* Buildings + programs */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card-pad">
          <div className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Faculties</div>
          {data.faculties?.length ? (
            <div className="space-y-1.5">
              {data.faculties.map((f) => (
                <div key={f.id} className="flex justify-between items-center py-1.5 border-b border-ink-800 last:border-0">
                  <span className="text-sm text-slate-300">{f.name}</span>
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{f.code}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-xs text-muted">None yet.</div>}
        </div>

        <div className="card-pad">
          <div className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Room capacity distribution</div>
          {data.rooms?.length ? (
            <div className="space-y-2">
              {distribute(data.rooms).map(([range, count]) => (
                <div key={range} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-muted w-20">{range}</span>
                  <div className="flex-1 h-1.5 bg-ink-800 rounded overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${(count / data.rooms.length) * 100}%` }} />
                  </div>
                  <span className="font-mono text-slate-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-xs text-muted">No rooms yet.</div>}
        </div>
      </div>
    </div>
  )
}

function Stat({ n, l, color = 'text-accent' }) {
  return (
    <div className="card-pad">
      <div className={`font-mono text-2xl font-semibold tabular-nums ${color}`}>{n}</div>
      <div className="text-[10px] text-muted uppercase tracking-wider mt-1 leading-tight">{l}</div>
    </div>
  )
}

function Action({ label, hint, onClick }) {
  return (
    <button onClick={onClick}
      className="text-left p-3 rounded-md border border-ink-700 hover:border-accent/40 hover:bg-accent/5 transition-colors">
      <div className="text-sm text-slate-200 font-medium">{label}</div>
      <div className="text-[11px] text-muted mt-0.5">{hint}</div>
    </button>
  )
}

function distribute(rooms) {
  const buckets = [['<40', 0], ['40-79', 0], ['80-119', 0], ['120+', 0]]
  rooms.forEach((r) => {
    if (r.capacity < 40) buckets[0][1]++
    else if (r.capacity < 80) buckets[1][1]++
    else if (r.capacity < 120) buckets[2][1]++
    else buckets[3][1]++
  })
  return buckets
}
