import { useState } from 'react'
import { conflicts as conflictsApi } from '../lib/api.js'
import { Spinner, Notice, EmptyState } from '../components/ui.jsx'

export function Conflicts({ data }) {
  const [mode, setMode] = useState('batch')   // 'batch' | 'global'
  const [batchId, setBatchId] = useState('')
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const check = async () => {
    setLoading(true); setErr(''); setList(null)
    try {
      const r = mode === 'global'
        ? await conflictsApi.global()
        : await conflictsApi.get(batchId)
      setList(r.conflicts || [])
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  const groups = list ? groupByType(list) : null

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="label">Scope</label>
            <select className="select min-w-[160px]" value={mode}
                    onChange={(e) => { setMode(e.target.value); setList(null) }}>
              <option value="batch">Single batch</option>
              <option value="global">All batches (global scan)</option>
            </select>
          </div>
          {mode === 'batch' && (
            <div>
              <label className="label">Batch</label>
              <select className="select min-w-[240px]" value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}>
                <option value="">— choose batch —</option>
                {data.batches?.map((b) => (
                  <option key={b.id} value={b.id}>{b.section_label} · year {b.year}</option>
                ))}
              </select>
            </div>
          )}
          <button className="btn-primary" onClick={check}
                  disabled={loading || (mode === 'batch' && !batchId)}>
            {loading ? <><Spinner /> Checking…</> : '⚡ Check conflicts'}
          </button>
        </div>
      </div>

      {err && <Notice kind="error">{err}</Notice>}

      {list && list.length === 0 && (
        <Notice kind="success">✓ No conflicts detected.</Notice>
      )}

      {groups && list.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Total" count={list.length} kind="bad" />
            <SummaryCard label="Room clashes"     count={groups.room_double_booking?.length || 0} kind="warn" />
            <SummaryCard label="Teacher clashes"  count={groups.teacher_double_booking?.length || 0} kind="warn" />
            <SummaryCard label="Capacity issues"  count={groups.capacity_violation?.length || 0} kind="warn" />
          </div>

          {Object.entries(groups).map(([type, items]) => (
            <div key={type}>
              <div className="font-mono text-xs uppercase tracking-widest text-muted mb-2 mt-4">
                {type.replace(/_/g, ' ')} ({items.length})
              </div>
              <div className="space-y-2">
                {items.map((c, i) => <ConflictRow key={i} c={c} />)}
              </div>
            </div>
          ))}
        </>
      )}

      {!list && !loading && !err && (
        <EmptyState title="Pick a scope and click Check"
                    hint="Single batch shows only conflicts involving that batch. Global scan shows everything." />
      )}
    </div>
  )
}

function SummaryCard({ label, count, kind = 'mute' }) {
  const colors = {
    bad: 'text-bad',  warn: 'text-warn',  mute: 'text-muted',
  }
  return (
    <div className="card-pad">
      <div className={`font-mono text-3xl font-semibold tabular-nums ${colors[kind]}`}>{count}</div>
      <div className="text-[10px] text-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

function groupByType(arr) {
  const out = {}
  arr.forEach((c) => {
    const k = c.type || 'unknown'
    ;(out[k] = out[k] || []).push(c)
  })
  return out
}

function ConflictRow({ c }) {
  const typeLabel = (c.type || 'CONFLICT').replace(/_/g, ' ').toUpperCase()
  return (
    <div className="card p-4 border-bad/30 bg-bad/5">
      <div className="flex items-start gap-3">
        <span className="badge-bad shrink-0">{typeLabel}</span>
        <div className="flex-1 text-sm">
          <div className="text-slate-200">
            <span className="font-mono text-accent-400">{c.course_a}</span>
            {c.course_b && <>
              {' '}<span className="text-muted">vs</span>{' '}
              <span className="font-mono text-accent-400">{c.course_b}</span>
            </>}
          </div>
          <div className="text-xs text-muted mt-1 font-mono">
            {c.day} · slot {c.slot}
            {c.room    && <> · room <span className="text-cyan-400">{c.room}</span></>}
            {c.teacher && <> · teacher <span className="text-pink-400">{c.teacher}</span></>}
            {c.batch   && <> · batch <span className="text-warn">{c.batch}</span></>}
          </div>
          {c.detail     && <div className="text-xs text-bad mt-1">{c.detail}</div>}
          {c.suggestion && <div className="text-xs text-warn mt-2 italic">💡 {c.suggestion}</div>}
        </div>
      </div>
    </div>
  )
}
