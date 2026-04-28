import { useEffect, useMemo, useState } from 'react'
import { Modal, Notice, Spinner, EmptyState, useToast, useConfirm } from './ui.jsx'

// ── EntityTable ──────────────────────────────────────────────────────────
// A reusable list/CRUD table. Each page (Courses, Rooms, …) provides:
//   api:     { list, create, update, remove }
//   columns: [{ key, label, render?, className? }, ...]
//   fields:  [{ key, label, type, options?, required?, hint? }, ...] for create/edit form
//   blank:   default values for "new" form
//   title:   singular noun, used in toasts ("Course created")
//   search:  optional fn (item, q) => boolean
//
// Returns the items array via onLoad so parents can derive things from them.

export function EntityTable({
  api, columns, fields, blank, title, search,
  extraFilters = null, // (items) => filteredItems  — used to plug in dropdown filters
  onLoad,
  emptyHint,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = creating, {...item} = editing
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({})
  const [formError, setFormError] = useState('')
  const toast = useToast()
  const confirm = useConfirm()

  const reload = async () => {
    setLoading(true); setErr('')
    try {
      const data = await api.list()
      setItems(Array.isArray(data) ? data : [])
      onLoad?.(Array.isArray(data) ? data : [])
    } catch (e) { setErr(e.message); setItems([]) }
    setLoading(false)
  }

  useEffect(() => { reload() /* eslint-disable-next-line */ }, [])

  const openNew = () => { setEditing({}); setFormData({ ...blank }); setFormError('') }
  const openEdit = (it) => {
    setEditing(it)
    // Strip id and any nested objects from form data
    const data = {}
    fields.forEach((f) => { data[f.key] = it[f.key] ?? blank[f.key] })
    setFormData(data); setFormError('')
  }

  const save = async () => {
    setSaving(true); setFormError('')
    try {
      // Coerce numbers / booleans according to field types
      const payload = {}
      fields.forEach((f) => {
        let v = formData[f.key]
        if (f.type === 'number') v = v === '' || v == null ? null : Number(v)
        if (f.type === 'checkbox') v = !!v
        if (f.type === 'select-num') v = v === '' || v == null ? null : Number(v)
        if (v === '' && !f.required) v = null
        payload[f.key] = v
      })
      if (editing.id) await api.update(editing.id, payload)
      else await api.create(payload)
      toast.success(`${title} ${editing.id ? 'updated' : 'created'}`)
      setEditing(null)
      reload()
    } catch (e) {
      setFormError(e.message)
    }
    setSaving(false)
  }

  const remove = async (it) => {
    const ok = await confirm({
      title: `Delete ${title}?`,
      message: `This will permanently delete "${it.name || it.code || it.id}". This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.remove(it.id)
      toast.success(`${title} deleted`)
      reload()
    } catch (e) { toast.error(e.message) }
  }

  const filtered = useMemo(() => {
    let arr = items
    if (extraFilters) arr = extraFilters(arr)
    if (q && search) arr = arr.filter((it) => search(it, q.toLowerCase()))
    return arr
  }, [items, q, search, extraFilters])

  return (
    <div className="card">
      <div className="flex items-center gap-3 p-4 border-b border-ink-700 flex-wrap">
        {search && (
          <input className="input max-w-xs" placeholder={`Search ${title.toLowerCase()}…`}
                 value={q} onChange={(e) => setQ(e.target.value)} />
        )}
        <div className="flex-1" />
        <span className="font-mono text-xs text-muted tabular-nums">{filtered.length} / {items.length}</span>
        <button className="btn-ghost text-xs" onClick={reload} disabled={loading}>
          {loading ? <Spinner /> : 'Refresh'}
        </button>
        <button className="btn-primary text-xs" onClick={openNew}>+ New {title}</button>
      </div>

      {err && <div className="p-4"><Notice kind="error">{err}</Notice></div>}

      {loading ? (
        <div className="py-16 text-center"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} yet`} hint={emptyHint || 'Click "New" to add one.'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {columns.map((c) => (
                  <th key={c.key}
                      className="px-4 py-2.5 text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-muted border-b border-ink-700 whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-2.5 border-b border-ink-700 w-px" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="border-b border-ink-800/60 hover:bg-ink-850/40 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-2.5 ${c.className || 'text-slate-300'}`}>
                      {c.render ? c.render(it) : (it[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(it)}
                            className="text-xs text-muted hover:text-accent px-2 py-1">Edit</button>
                    <button onClick={() => remove(it)}
                            className="text-xs text-muted hover:text-bad px-2 py-1">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${title}` : `New ${title}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving && <Spinner />}
              {editing?.id ? 'Save changes' : `Create ${title.toLowerCase()}`}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Notice kind="error">{formError}</Notice>}
          {fields.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}{f.required && <span className="text-bad ml-1">*</span>}</label>
              {f.type === 'checkbox' ? (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!formData[f.key]}
                         onChange={(e) => setFormData({ ...formData, [f.key]: e.target.checked })}
                         className="w-4 h-4 accent-accent" />
                  <span className="text-xs text-slate-300">{f.hint}</span>
                </label>
              ) : f.type === 'select' || f.type === 'select-num' ? (
                <select className="select" value={formData[f.key] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}>
                  <option value="">— select —</option>
                  {(f.options || []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input className="input"
                       type={f.type === 'number' ? 'number' : 'text'}
                       value={formData[f.key] ?? ''}
                       onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                       placeholder={f.hint || ''} />
              )}
              {f.type !== 'checkbox' && f.hint && (
                <div className="text-[10px] text-muted mt-1">{f.hint}</div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
