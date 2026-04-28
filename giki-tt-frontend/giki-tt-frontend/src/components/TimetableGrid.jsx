import { DAYS, WEEKDAYS, SLOTS, FRIDAY_SLOTS, MAX_SLOTS, slotsFor } from '../lib/constants.js'

// Renders a weekly timetable grid.
//
// `grid` is the backend's response: { "Day_slot": cellObject, ... }
// `showSaturday` (bool) — set true when any cell exists on Saturday.
//
// Columns = 8 (max), so Friday cells need to span correctly given Friday only has 6 slots.
// Backend gives us slot index 0..7 for Mon–Thu and 0..5 for Friday — we render those positions
// directly in those column positions and visually mark the missing Friday columns as "—".

export function TimetableGrid({ grid }) {
  if (!grid) return null

  const hasSaturday = Object.keys(grid).some((k) => k.startsWith('Saturday_'))
  const days = hasSaturday ? DAYS : WEEKDAYS

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 min-w-[900px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-ink-900 border border-ink-700 px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-muted w-16 rounded-tl-md">
              Day
            </th>
            {Array.from({ length: MAX_SLOTS }).map((_, i) => {
              const s = SLOTS[i]
              return (
                <th key={i}
                    className="bg-accent/5 border border-ink-700 px-2 py-2 text-[10px] font-mono text-accent-400 whitespace-nowrap min-w-[110px]">
                  <div className="font-bold">{s.start.replace(/ ?[AP]M/, '')}</div>
                  <div className="text-muted text-[9px] font-normal mt-0.5">slot {s.index}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const dayGrid = slotsFor(day) // Friday has 6 slots (0..5)
            const dayValidIndices = new Set(dayGrid.map((s) => s.index))
            return (
              <tr key={day}>
                <td className="sticky left-0 z-10 bg-ink-850 border border-ink-700 px-2 py-3 text-center font-mono text-[11px] font-bold text-muted tracking-widest">
                  {day.slice(0, 3).toUpperCase()}
                </td>
                {Array.from({ length: MAX_SLOTS }).map((_, slotIdx) => {
                  const validForDay = dayValidIndices.has(slotIdx)
                  const cell = grid[`${day}_${slotIdx}`]
                  return (
                    <td key={slotIdx}
                        className={`border border-ink-700 align-top p-1.5 ${
                          !validForDay ? 'bg-ink-850/30' : ''
                        }`}>
                      {!validForDay ? (
                        <div className="text-center text-[9px] text-muted/40 font-mono py-3">
                          {day === 'Friday' ? '— Jumu\'ah —' : '—'}
                        </div>
                      ) : cell ? (
                        <Cell cell={cell} day={day} slotIdx={slotIdx} />
                      ) : (
                        <div className="text-center text-muted/15 text-base py-3 select-none">·</div>
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

function Cell({ cell }) {
  const isLab = cell.is_lab
  const published = cell.status === 'published'

  const cls = isLab
    ? 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/15'
    : published
    ? 'bg-ok/10 border-ok/30 hover:bg-ok/15'
    : 'bg-accent/10 border-accent/20 hover:bg-accent/15'

  const codeCls = isLab ? 'text-violet-300' : published ? 'text-ok' : 'text-accent-400'

  return (
    <div className={`border rounded p-1.5 transition-colors ${cls}`}>
      <div className="flex items-baseline justify-between gap-1">
        <span className={`font-mono text-[11px] font-bold ${codeCls}`}>
          {cell.course_code}
          {cell.cross_listed_code && (
            <span className="text-muted font-normal"> / {cell.cross_listed_code}</span>
          )}
        </span>
        {isLab && <span className="text-[8px] font-mono text-violet-300/70">LAB</span>}
      </div>
      {cell.course_name && (
        <div className="text-[10px] text-slate-300 leading-tight mt-0.5 line-clamp-2">
          {cell.course_name}
        </div>
      )}
      {cell.teacher && (
        <div className="text-[9px] text-muted mt-0.5 truncate" title={cell.teacher}>
          {cell.teacher}
        </div>
      )}
      {cell.room && (
        <div className="text-[9px] text-cyan-400/80 font-mono mt-0.5 truncate" title={cell.room}>
          {cell.room}
        </div>
      )}
      {cell.session_number > 1 && (
        <div className="text-[8px] text-muted/60 mt-0.5">session {cell.session_number}</div>
      )}
    </div>
  )
}
