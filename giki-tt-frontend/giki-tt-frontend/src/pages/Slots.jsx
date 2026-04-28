import { SLOTS, FRIDAY_SLOTS, BREAKS, DAYS } from '../lib/constants.js'
import { Notice } from '../components/ui.jsx'

export function Slots() {
  return (
    <div className="space-y-4">
      <Notice kind="info">
        These slot definitions mirror <code className="font-mono">backend/engine/constants.py</code>.
        If the backend changes its slot grid, the frontend constants must be updated to match.
      </Notice>

      <div className="grid lg:grid-cols-2 gap-5">
        <SlotTable title="Mon – Thu" subtitle="8 slots, 50 minutes each" slots={SLOTS} />
        <SlotTable title="Friday" subtitle="6 slots — Jumu'ah from 09:50–11:00, longer afternoon blocks" slots={FRIDAY_SLOTS} accent="warn" />
      </div>

      <div className="card-pad">
        <div className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Breaks</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(BREAKS).map(([k, b]) => (
            <div key={k} className="bg-ink-850 border border-ink-700 rounded p-3">
              <div className="font-mono text-xs text-accent-400">{b.label}</div>
              <div className="text-[11px] font-mono text-muted mt-1">{b.start} → {b.end}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-pad">
        <div className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Days</div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <span key={d} className={`badge ${d === 'Friday' || d === 'Saturday' ? 'badge-warn' : 'badge-info'}`}>
              {d}
            </span>
          ))}
        </div>
        <div className="text-[11px] text-muted mt-2">
          Saturday is only used for courses with <code className="font-mono">allow_saturday=true</code>.
        </div>
      </div>
    </div>
  )
}

function SlotTable({ title, subtitle, slots, accent = 'info' }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-ink-700">
        <div className="font-mono text-sm uppercase tracking-widest text-slate-200">{title}</div>
        <div className="text-xs text-muted mt-1">{subtitle}</div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {['Index', 'Start', 'End', 'Duration'].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-widest text-muted border-b border-ink-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => {
            const dur = duration(s.start, s.end)
            return (
              <tr key={s.index} className="border-b border-ink-800/60 last:border-0">
                <td className={`px-4 py-2 font-mono ${accent === 'warn' ? 'text-warn' : 'text-accent-400'}`}>{s.index}</td>
                <td className="px-4 py-2 font-mono text-slate-300">{s.start}</td>
                <td className="px-4 py-2 font-mono text-slate-300">{s.end}</td>
                <td className="px-4 py-2 font-mono text-muted text-xs">{dur} min</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function duration(start, end) {
  const parse = (s) => {
    const [time, ap] = s.split(' ')
    let [h, m] = time.split(':').map(Number)
    if (ap === 'PM' && h !== 12) h += 12
    if (ap === 'AM' && h === 12) h = 0
    return h * 60 + m
  }
  return parse(end) - parse(start)
}
