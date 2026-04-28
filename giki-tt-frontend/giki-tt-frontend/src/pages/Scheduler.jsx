import { useState } from 'react'
import { scheduler } from '../lib/api.js'
import { SCOPES } from '../lib/constants.js'
import { Spinner, Notice, useToast, useConfirm } from '../components/ui.jsx'

export function Scheduler({ data }) {
  const [scope, setScope] = useState('batch')
  const [scopeId, setScopeId] = useState('')
  const [publishBatch, setPublishBatch] = useState('')
  const [clearBatch, setClearBatch] = useState('')
  const [clearForce, setClearForce] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()

  // ── derive scope target options based on scope ──
  const targets =
    scope === 'batch'   ? data.batches?.map((b) => ({ id: b.id, label: `${b.section_label} · year ${b.year} · ${b.student_count} students` })) :
    scope === 'dept'    ? data.departments?.map((d) => ({ id: d.id, label: d.name })) :
    scope === 'faculty' ? data.faculties?.map((f) => ({ id: f.id, label: `${f.name} (${f.code})` })) :
    []

  const generate = async () => {
    if (!scopeId) return
    const target = targets.find((t) => String(t.id) === String(scopeId))
    const ok = await confirm({
      title: 'Generate schedule?',
      message: `This will clear all DRAFT schedules in scope "${scope}/${target?.label}" and re-run the CSP solver. Published schedules are preserved.`,
      confirmLabel: 'Generate',
    })
    if (!ok) return
    setRunning(true); setResult(null)
    try {
      const r = await scheduler.generate(scope, scopeId)
      setResult(r)
      if (r.status === 'success') toast.success(`Scheduler placed ${r.placed} sessions`)
      else toast.error(r.message || 'Scheduler did not finish cleanly')
    } catch (e) {
      setResult({ status: 'error', message: e.message })
      toast.error(e.message)
    }
    setRunning(false)
  }

  const publish = async () => {
    if (!publishBatch) return
    const ok = await confirm({
      title: 'Publish drafts?',
      message: 'This marks all draft sessions for this batch as "published". Students/teachers see published schedules.',
      confirmLabel: 'Publish',
    })
    if (!ok) return
    try {
      await scheduler.publish(publishBatch)
      toast.success('Published')
    } catch (e) { toast.error(e.message) }
  }

  const clear = async () => {
    if (!clearBatch) return
    const ok = await confirm({
      title: clearForce ? 'Clear ALL schedules?' : 'Clear drafts?',
      message: clearForce
        ? 'This will delete ALL schedule rows for this batch — including published ones. This cannot be undone.'
        : 'This deletes only draft sessions for this batch. Published sessions are kept.',
      confirmLabel: clearForce ? 'Clear all' : 'Clear drafts',
      danger: true,
    })
    if (!ok) return
    try {
      await scheduler.clear(clearBatch, clearForce)
      toast.success(clearForce ? 'All schedules cleared' : 'Drafts cleared')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-5">
      {/* GENERATE */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-sm uppercase tracking-widest text-slate-200">Generate</div>
            <div className="text-xs text-muted mt-1">Run the CSP backtracking solver. 28-second timeout.</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Scope</label>
            <select className="select" value={scope}
                    onChange={(e) => { setScope(e.target.value); setScopeId('') }}>
              {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Target</label>
            <select className="select" value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
              <option value="">— choose {scope} —</option>
              {targets?.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button className="btn-primary" onClick={generate} disabled={running || !scopeId}>
            {running ? <><Spinner /> Solving (up to 28s)…</> : '▶ Run Scheduler'}
          </button>
        </div>

        {result && <ResultPanel result={result} />}
      </section>

      {/* PUBLISH */}
      <section className="card p-5">
        <div className="font-mono text-sm uppercase tracking-widest text-slate-200">Publish</div>
        <div className="text-xs text-muted mt-1 mb-4">
          Promote draft sessions for a batch to "published" status.
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <label className="label">Batch</label>
            <select className="select" value={publishBatch} onChange={(e) => setPublishBatch(e.target.value)}>
              <option value="">— choose batch —</option>
              {data.batches?.map((b) => (
                <option key={b.id} value={b.id}>{b.section_label} · year {b.year}</option>
              ))}
            </select>
          </div>
          <button className="btn-success" onClick={publish} disabled={!publishBatch}>
            ✓ Publish drafts
          </button>
        </div>
      </section>

      {/* CLEAR */}
      <section className="card p-5">
        <div className="font-mono text-sm uppercase tracking-widest text-slate-200">Clear</div>
        <div className="text-xs text-muted mt-1 mb-4">
          Remove schedule rows for a batch. Default removes only drafts.
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <label className="label">Batch</label>
            <select className="select" value={clearBatch} onChange={(e) => setClearBatch(e.target.value)}>
              <option value="">— choose batch —</option>
              {data.batches?.map((b) => (
                <option key={b.id} value={b.id}>{b.section_label} · year {b.year}</option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 mb-2">
            <input type="checkbox" checked={clearForce}
                   onChange={(e) => setClearForce(e.target.checked)}
                   className="w-4 h-4 accent-bad" />
            Force (also clear published)
          </label>
          <button className="btn-danger" onClick={clear} disabled={!clearBatch}>
            ✕ {clearForce ? 'Clear all' : 'Clear drafts'}
          </button>
        </div>
      </section>
    </div>
  )
}

function ResultPanel({ result }) {
  if (result.status === 'success') {
    return (
      <div className="mt-4 space-y-2">
        <Notice kind="success">
          ✓ <strong>{result.placed}</strong> sessions placed successfully.
          {result.errors?.length > 0 && <> But {result.errors.length} lab placement error(s) occurred — see below.</>}
        </Notice>
        {result.errors?.length > 0 && (
          <ul className="text-xs space-y-1 ml-4 list-disc text-warn">
            {result.errors.map((e, i) => <li key={i} className="font-mono">{e}</li>)}
          </ul>
        )}
      </div>
    )
  }
  if (result.status === 'failed') {
    return (
      <div className="mt-4 space-y-2">
        <Notice kind="error">
          ✕ <strong>CSP failed</strong> — {result.message}
        </Notice>
        {result.suggestion && <Notice kind="warn">💡 {result.suggestion}</Notice>}
      </div>
    )
  }
  if (result.status === 'error') {
    return (
      <div className="mt-4 space-y-2">
        <Notice kind="error">{result.message}</Notice>
        {result.empty_domains?.length > 0 && (
          <div className="text-xs">
            <span className="text-muted">Courses with no valid slot: </span>
            <span className="font-mono text-bad">{result.empty_domains.join(', ')}</span>
          </div>
        )}
        {result.suggestion && <Notice kind="warn">💡 {result.suggestion}</Notice>}
      </div>
    )
  }
  return null
}
