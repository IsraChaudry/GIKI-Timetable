import { useState } from 'react'
import { timetable, exportFacultyPdf } from '../lib/api.js'
import { TimetableGrid } from '../components/TimetableGrid.jsx'
import { Spinner, Notice, EmptyState, useToast } from '../components/ui.jsx'

export function Timetable({ data }) {
  const [batchId, setBatchId] = useState('')
  const [grid, setGrid] = useState(null)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [exportingFaculty, setExportingFaculty] = useState(false)
  const toast = useToast()

  const load = async () => {
    if (!batchId) return
    setLoading(true); setErr(''); setGrid(null); setMeta(null)
    try {
      const r = await timetable.get(batchId)
      setGrid(r.grid || {})
      setMeta({ batch_id: r.batch_id, count: Object.keys(r.grid || {}).length })
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  const doExportFaculty = async () => {
    const batch = data.batches?.find((b) => String(b.id) === String(batchId))
    const dept  = data.departments?.find((d) => String(d.id) === String(batch?.dept_id))
    const faculty = data.faculties?.find((f) => String(f.id) === String(dept?.faculty_id))
    if (!faculty) { toast.error('Cannot determine faculty for this batch'); return }
    setExportingFaculty(true)
    try {
      await exportFacultyPdf(faculty.id, faculty.code)
      toast.success('Faculty PDF download started')
    } catch (e) { toast.error(e.message) }
    setExportingFaculty(false)
  }

  const cells = grid ? Object.values(grid) : []
  const drafts = cells.filter((c) => c.status === 'draft').length
  const published = cells.filter((c) => c.status === 'published').length
  const labs = cells.filter((c) => c.is_lab).length

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
                  Year {b.year} · {b.section_label} · {b.student_count} students (id:{b.id})
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={load} disabled={loading || !batchId}>
            {loading ? <><Spinner /> Loading…</> : 'Load timetable'}
          </button>
          {grid && cells.length > 0 && (
            <button className="btn-ghost" onClick={doExportFaculty} disabled={exportingFaculty}>
              {exportingFaculty ? <><Spinner /> Exporting…</> : '↓ Export PDF'}
            </button>
          )}

          <div className="flex-1" />

          {grid && cells.length > 0 && (
            <div className="flex gap-2 items-center">
              {drafts    > 0 && <span className="badge-warn">{drafts} draft</span>}
              {published > 0 && <span className="badge-ok">{published} published</span>}
              {labs      > 0 && <span className="badge-info">{labs} labs</span>}
            </div>
          )}
        </div>
      </div>

      {err && <Notice kind="error">{err}</Notice>}

      {grid && cells.length === 0 && (
        <EmptyState
          title="No schedule for this batch yet"
          hint="Generate one from the Generator page, or seed the database first."
        />
      )}

      {grid && cells.length > 0 && (
        <>
          <div className="card p-4">
            <TimetableGrid grid={grid} />
          </div>
          <Notice kind="info">
            <span className="font-mono text-[11px]">
              Mon–Thu run 8 slots (08:00–17:20) · Friday only 6 slots (Jumu'ah block 09:50–11:00 + 12:50–14:00) ·
              Tea break at 09:50 · Lunch &amp; prayer at 13:30.
            </span>
          </Notice>
        </>
      )}

      {!grid && !loading && !err && (
        <EmptyState title="Pick a batch above" hint="Then click 'Load timetable' to view its weekly grid." />
      )}
    </div>
  )
}
