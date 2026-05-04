import { useEffect, useMemo, useState } from 'react'
import { timetable, exportFacultyPdf } from '../lib/api.js'
import { DAYS, WEEKDAYS, MAX_SLOTS, slotsFor, SLOTS } from '../lib/constants.js'
import { Spinner, Notice, EmptyState } from '../components/ui.jsx'

// ── Shared loader: pull every batch's timetable and flatten rows ─────────
// Returns: [{ day, slot, cell, batch_id, batch_label }]
function useAllSchedules(batches) {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!batches || batches.length === 0) return
    let cancelled = false
    const load = async () => {
      setLoading(true); setErr('')
      try {
        const all = await Promise.all(
          batches.map(async (b) => {
            try {
              const r = await timetable.get(b.id)
              return Object.entries(r.grid || {}).map(([k, cell]) => {
                const [day, slot] = k.split('_')
                return { day, slot: Number(slot), cell, batch_id: b.id, batch_label: b.section_label }
              })
            } catch { return [] }
          })
        )
        if (cancelled) return
        setRows(all.flat())
      } catch (e) { if (!cancelled) setErr(e.message) }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [batches])

  return { rows, loading, err }
}

// ── Common grid renderer for filtered rows ───────────────────────────────
function FilteredGrid({ rows, hasSaturday, formatCell }) {
  const days = hasSaturday ? DAYS : WEEKDAYS
  // Index rows by `${day}_${slot}` -> array of rows (in case of overlaps)
  const idx = {}
  rows.forEach((r) => {
    const k = `${r.day}_${r.slot}`
    ;(idx[k] = idx[k] || []).push(r)
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 min-w-[900px]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-ink-900 border border-ink-700 px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-muted w-16">Day</th>
            {Array.from({ length: MAX_SLOTS }).map((_, i) => (
              <th key={i} className="bg-accent/5 border border-ink-700 px-2 py-2 text-[10px] font-mono text-accent-400 min-w-[110px]">
                <div className="font-bold">{SLOTS[i].start.replace(/ ?[AP]M/, '')}</div>
                <div className="text-muted text-[9px] font-normal mt-0.5">slot {i}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const dayValid = new Set(slotsFor(day).map((s) => s.index))
            return (
              <tr key={day}>
                <td className="sticky left-0 bg-ink-850 border border-ink-700 px-2 py-3 text-center font-mono text-[11px] font-bold text-muted tracking-widest">
                  {day.slice(0, 3).toUpperCase()}
                </td>
                {Array.from({ length: MAX_SLOTS }).map((_, slotIdx) => {
                  const valid = dayValid.has(slotIdx)
                  const matches = idx[`${day}_${slotIdx}`] || []
                  return (
                    <td key={slotIdx}
                        className={`border border-ink-700 align-top p-1.5 ${!valid ? 'bg-ink-850/30' : ''}`}>
                      {!valid ? (
                        <div className="text-center text-[9px] text-muted/40 font-mono py-3">
                          {day === 'Friday' ? '—' : '—'}
                        </div>
                      ) : matches.length === 0 ? (
                        <div className="text-center text-[10px] text-ok/40 py-3 font-mono">free</div>
                      ) : (
                        <div className="space-y-1">
                          {matches.map((r, i) => formatCell(r, i))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Room Schedule ────────────────────────────────────────────────────────
export function RoomSchedule({ data }) {
  const [roomId, setRoomId] = useState('')
  const { rows, loading, err } = useAllSchedules(data.batches)

  const room = data.rooms?.find((r) => String(r.id) === String(roomId))
  const filtered = rows && room
    ? rows.filter((r) => r.cell.room === room.name)
    : []
  const hasSat = filtered.some((r) => r.day === 'Saturday')

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-end gap-3 flex-wrap">
        <div className="min-w-[260px] flex-1">
          <label className="label">Room</label>
          <select className="select" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">— choose room —</option>
            {data.rooms?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.type.replace('_', ' ')} · capacity {r.capacity}
              </option>
            ))}
          </select>
        </div>
        {loading && <Spinner />}
        {room && rows && (
          <span className="badge-info">{filtered.length} sessions booked</span>
        )}
      </div>

      {err && <Notice kind="error">{err}</Notice>}

      {!roomId && (
        <EmptyState title="Pick a room" hint="To see when it's booked across all batches." />
      )}

      {roomId && rows && filtered.length === 0 && (
        <Notice kind="success">✓ Room <strong>{room?.name}</strong> has no bookings — entirely free this week.</Notice>
      )}

      {roomId && rows && filtered.length > 0 && (
        <div className="card p-4">
          <FilteredGrid rows={filtered} hasSaturday={hasSat} formatCell={(r, i) => (
            <div key={i} className="bg-accent/10 border border-accent/20 rounded p-1.5">
              <div className="font-mono text-[11px] font-bold text-accent-400">{r.cell.course_code}</div>
              <div className="text-[10px] text-slate-300 truncate">{r.cell.teacher}</div>
              <div className="text-[9px] text-warn font-mono mt-0.5">{r.batch_label}</div>
            </div>
          )} />
        </div>
      )}
    </div>
  )
}

// ── Teacher Schedule ─────────────────────────────────────────────────────
export function TeacherSchedule({ data }) {
  const [teacherId, setTeacherId] = useState('')
  const { rows, loading, err } = useAllSchedules(data.batches)

  const teacher = data.teachers?.find((t) => String(t.id) === String(teacherId))
  const filtered = rows && teacher
    ? rows.filter((r) => r.cell.teacher === teacher.name)
    : []
  const hasSat = filtered.some((r) => r.day === 'Saturday')

  // Compute load (total sessions and unique courses)
  const uniqueCourses = new Set(filtered.map((r) => r.cell.course_code))

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-end gap-3 flex-wrap">
        <div className="min-w-[260px] flex-1">
          <label className="label">Teacher</label>
          <select className="select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">— choose teacher —</option>
            {data.teachers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {loading && <Spinner />}
        {teacher && rows && (
          <>
            <span className="badge-info">{filtered.length} sessions/week</span>
            <span className="badge-mute">{uniqueCourses.size} courses</span>
          </>
        )}
      </div>

      {err && <Notice kind="error">{err}</Notice>}

      {!teacherId && (
        <EmptyState title="Pick a teacher" hint="To see their full weekly schedule." />
      )}

      {teacherId && rows && filtered.length === 0 && (
        <Notice kind="warn">
          <strong>{teacher?.name}</strong> has no scheduled sessions. Either no courses are assigned, or schedules haven't been generated yet.
        </Notice>
      )}

      {teacherId && rows && filtered.length > 0 && (
        <div className="card p-4">
          <FilteredGrid rows={filtered} hasSaturday={hasSat} formatCell={(r, i) => (
            <div key={i} className="bg-pink-500/10 border border-pink-500/20 rounded p-1.5">
              <div className="font-mono text-[11px] font-bold text-pink-400">{r.cell.course_code}</div>
              <div className="text-[10px] text-slate-300 truncate">{r.cell.course_name}</div>
              <div className="text-[9px] text-cyan-400 font-mono mt-0.5">{r.cell.room}</div>
              <div className="text-[9px] text-warn font-mono">{r.batch_label}</div>
            </div>
          )} />
        </div>
      )}
    </div>
  )
}

// ── Faculty Timetable (all depts + all years combined) ───────────────────
export function FacultyTimetable({ data }) {
  const [facultyId, setFacultyId] = useState('')
  const [exporting, setExporting] = useState(false)

  const facultyDepts = useMemo(
    () => facultyId
      ? (data.departments || []).filter((d) => String(d.faculty_id) === String(facultyId))
      : [],
    [facultyId, data.departments]
  )

  const facultyBatches = useMemo(
    () => facultyDepts.length > 0
      ? (data.batches || [])
          .filter((b) => facultyDepts.some((d) => String(d.id) === String(b.dept_id)))
          .sort((a, b) => a.year !== b.year ? a.year - b.year : String(a.dept_id).localeCompare(String(b.dept_id)))
      : [],
    [facultyDepts, data.batches]
  )

  const { rows, loading, err } = useAllSchedules(facultyBatches)

  const sorted = useMemo(
    () => rows
      ? [...rows].sort((a, b) => {
          const ya = facultyBatches.find((x) => x.id === a.batch_id)?.year || 0
          const yb = facultyBatches.find((x) => x.id === b.batch_id)?.year || 0
          return ya - yb
        })
      : [],
    [rows, facultyBatches]
  )

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-end gap-3 flex-wrap">
        <div className="min-w-[260px] flex-1">
          <label className="label">Faculty</label>
          <select className="select" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
            <option value="">— choose faculty —</option>
            {data.faculties?.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        {loading && <Spinner />}
        {facultyId && rows && rows.length > 0 && (
          <button className="btn-ghost" disabled={exporting} onClick={async () => {
            const f = data.faculties?.find((x) => String(x.id) === String(facultyId))
            setExporting(true)
            try { await exportFacultyPdf(facultyId, f?.code) }
            catch (e) { alert(e.message) }
            setExporting(false)
          }}>
            {exporting ? '…exporting' : '↓ Export PDF'}
          </button>
        )}
        {facultyId && rows && (
          <span className="badge-info">{rows.length} sessions · {facultyBatches.length} batches · {facultyDepts.length} depts</span>
        )}
      </div>

      {facultyBatches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {facultyBatches.map((b) => {
            const s = YEAR_STYLE[b.year] || {}
            return (
              <div key={b.id} className={`px-3 py-1 rounded border text-xs font-mono ${s.card} ${s.text}`}>
                Y{b.year} — {b.section_label}
              </div>
            )
          })}
        </div>
      )}

      {err && <Notice kind="error">{err}</Notice>}

      {!facultyId && (
        <EmptyState title="Pick a faculty" hint="Shows all departments and all years in one combined grid." />
      )}

      {facultyId && !loading && rows && rows.length === 0 && (
        <Notice kind="warn">No scheduled sessions for this faculty yet. Generate the timetable first from the Generator page.</Notice>
      )}

      {facultyId && rows && rows.length > 0 && (
        <div className="card p-4">
          <FilteredGrid rows={sorted} hasSaturday={false} formatCell={(r, i) => {
            const batch = facultyBatches.find((b) => b.id === r.batch_id)
            const year = batch?.year || 0
            const s = YEAR_STYLE[year] || { card: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', badge: 'bg-slate-500/20 text-slate-300' }
            return (
              <div key={i} className={`border rounded p-1.5 ${s.card}`}>
                <div className={`flex items-center justify-between mb-0.5 ${s.text}`}>
                  <span className="font-mono text-[10px] font-bold">{r.cell.course_code}</span>
                  <span className={`text-[8px] font-mono px-1 rounded ${s.badge}`}>Y{year}</span>
                </div>
                <div className="text-[9px] truncate text-slate-300">{r.cell.teacher}</div>
                <div className="text-[9px] font-mono text-slate-500">{r.cell.room}</div>
                <div className="text-[8px] font-mono text-slate-600">{batch?.section_label}</div>
              </div>
            )
          }} />
        </div>
      )}
    </div>
  )
}

// ── Department Timetable (all 4 years combined) ──────────────────────────
const YEAR_STYLE = {
  1: { card: 'bg-green-500/10 border-green-500/30',   text: 'text-green-400',   badge: 'bg-green-500/20 text-green-300'   },
  2: { card: 'bg-blue-500/10 border-blue-500/30',     text: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300'     },
  3: { card: 'bg-amber-500/10 border-amber-500/30',   text: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300'   },
  4: { card: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400',  badge: 'bg-purple-500/20 text-purple-300' },
}

export function DeptTimetable({ data }) {
  const [deptId, setDeptId] = useState('')

  const deptBatches = useMemo(
    () => deptId
      ? (data.batches || [])
          .filter((b) => String(b.dept_id) === String(deptId))
          .sort((a, b) => a.year - b.year)
      : [],
    [deptId, data.batches]
  )

  const { rows, loading, err } = useAllSchedules(deptBatches)

  const sorted = useMemo(
    () => rows
      ? [...rows].sort((a, b) => {
          const ya = deptBatches.find((x) => x.id === a.batch_id)?.year || 0
          const yb = deptBatches.find((x) => x.id === b.batch_id)?.year || 0
          return ya - yb
        })
      : [],
    [rows, deptBatches]
  )

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-end gap-3 flex-wrap">
        <div className="min-w-[260px] flex-1">
          <label className="label">Department</label>
          <select className="select" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
            <option value="">— choose department —</option>
            {data.departments?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        {loading && <Spinner />}
        {deptId && rows && (
          <span className="badge-info">{rows.length} sessions · {deptBatches.length} year groups</span>
        )}
      </div>

      {deptBatches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {deptBatches.map((b) => {
            const s = YEAR_STYLE[b.year] || {}
            return (
              <div key={b.id} className={`px-3 py-1 rounded border text-xs font-mono ${s.card} ${s.text}`}>
                Year {b.year} — {b.section_label}
              </div>
            )
          })}
        </div>
      )}

      {err && <Notice kind="error">{err}</Notice>}

      {!deptId && (
        <EmptyState title="Pick a department" hint="Shows all 4 years in one combined grid — Year 1 through Year 4." />
      )}

      {deptId && !loading && rows && rows.length === 0 && (
        <Notice kind="warn">No scheduled sessions for this department yet. Generate the timetable first from the Generator page.</Notice>
      )}

      {deptId && rows && rows.length > 0 && (
        <div className="card p-4">
          <FilteredGrid rows={sorted} hasSaturday={false} formatCell={(r, i) => {
            const batch = deptBatches.find((b) => b.id === r.batch_id)
            const year = batch?.year || 0
            const s = YEAR_STYLE[year] || { card: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', badge: 'bg-slate-500/20 text-slate-300' }
            return (
              <div key={i} className={`border rounded p-1.5 ${s.card}`}>
                <div className={`flex items-center justify-between mb-0.5 ${s.text}`}>
                  <span className="font-mono text-[10px] font-bold">{r.cell.course_code}</span>
                  <span className={`text-[8px] font-mono px-1 rounded ${s.badge}`}>Y{year}</span>
                </div>
                <div className="text-[9px] truncate text-slate-300">{r.cell.teacher}</div>
                <div className="text-[9px] font-mono text-slate-500">{r.cell.room}</div>
              </div>
            )
          }} />
        </div>
      )}
    </div>
  )
}
