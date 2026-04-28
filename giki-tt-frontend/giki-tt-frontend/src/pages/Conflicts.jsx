import { useState } from 'react'
import { conflicts as conflictsApi } from '../lib/api.js'
import { Spinner, Notice, EmptyState } from '../components/ui.jsx'

export function Conflicts({ data }) {
  const [batchId, setBatchId] = useState('')
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const check = async () => {
    if (!batchId) return
    setLoading(true); setErr(''); setList(null)
    try {
      const r = await conflictsApi.get(batchId)
      setList(r.conflicts || [])
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="label">Batch</label>
            <select className="select min-w-[240px]" value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}>
              <option value="">— choose batch —</option>
              {data.batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.section_label} · year {b.year}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={check} disabled={loading || !batchId}>
            {loading ? <><Spinner /> Checking…</> : '⚡ Check conflicts'}
          </button>
        </div>
      </div>

      {err && <Notice kind="error">{err}</Notice>}

      {list && list.length === 0 && (
        <Notice kind="success">✓ No conflicts detected for this batch.</Notice>
      )}

      {list && list.length > 0 && (
        <>
          <Notice kind="warn">
            <strong>{list.length}</strong> conflict{list.length !== 1 ? 's' : ''} found.
          </Notice>
          <div className="space-y-2">
            {list.map((c, i) => <ConflictRow key={i} c={c} />)}
          </div>
        </>
      )}

      {!list && !loading && !err && (
        <EmptyState title="Pick a batch above" hint="Then click 'Check conflicts' to find overlapping bookings." />
      )}
    </div>
  )
}

function ConflictRow({ c }) {
  const typeLabel = c.type?.replace(/_/g, ' ').toUpperCase() || 'CONFLICT'
  return (
    <div className="card p-4 border-bad/30 bg-bad/5">
      <div className="flex items-start gap-3">
        <span className="badge-bad shrink-0">{typeLabel}</span>
        <div className="flex-1 text-sm">
          <div className="text-slate-200">
            <span className="font-mono text-accent-400">{c.course_a}</span>
            {' '}<span className="text-muted">vs</span>{' '}
            <span className="font-mono text-accent-400">{c.course_b}</span>
          </div>
          <div className="text-xs text-muted mt-1 font-mono">
            {c.day} · slot {c.slot}
            {c.room && <> · room <span className="text-cyan-400">{c.room}</span></>}
            {c.teacher && <> · teacher <span className="text-pink-400">{c.teacher}</span></>}
          </div>
          {c.suggestion && (
            <div className="text-xs text-warn mt-2 italic">💡 {c.suggestion}</div>
          )}
        </div>
      </div>
    </div>
  )
}
