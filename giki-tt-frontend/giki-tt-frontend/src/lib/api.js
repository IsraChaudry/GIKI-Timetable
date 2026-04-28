// Single source of truth for talking to the backend.
//
// Notes on the contract:
// - List endpoints REQUIRE the trailing slash (FastAPI router mounts at "/")
//   otherwise FastAPI 307-redirects and some browsers drop the Authorization
//   header on the redirect, causing spurious 401s.
// - All endpoints (except /auth/login) require Bearer token auth.
// - The PDF export must be fetched as a blob (not opened in a new tab) so we
//   can attach the auth header.

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const API = `${BASE}/api`

// ── token storage ────────────────────────────────────────────────────────
const TOKEN_KEY = 'giki_tt_token'

export const token = {
  get: () => localStorage.getItem(TOKEN_KEY) || '',
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

// ── core fetch wrapper ───────────────────────────────────────────────────
async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const t = token.get()
  if (t) headers['Authorization'] = `Bearer ${t}`

  let res
  try {
    res = await fetch(`${API}${path}`, { ...opts, headers })
  } catch (e) {
    throw new Error('Cannot reach backend — is it running on ' + BASE + '?')
  }

  if (res.status === 401) {
    token.clear()
    // Soft signal so the App can re-render the login page.
    window.dispatchEvent(new Event('giki-tt:logout'))
    throw new Error('Session expired — please log in again')
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const j = await res.json()
      if (j.detail) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
    } catch { /* response wasn't json */ }
    throw new Error(msg)
  }

  // Some endpoints return empty body on success
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

// ── auth ─────────────────────────────────────────────────────────────────
export const auth = {
  async login(password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
    token.set(data.access_token)
    return data
  },
  logout() { token.clear() },
  isAuthed: () => !!token.get(),
}

// ── generic CRUD factory for entity routers ──────────────────────────────
// All of: faculties, departments, batches, teachers, rooms, courses
function crud(name) {
  return {
    list:   ()         => request(`/${name}/`),
    get:    (id)       => request(`/${name}/${id}`),
    create: (data)     => request(`/${name}/`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/${name}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id)       => request(`/${name}/${id}`, { method: 'DELETE' }),
  }
}

export const faculties   = crud('faculties')
export const departments = crud('departments')
export const batches     = crud('batches')
export const teachers    = crud('teachers')
export const rooms       = crud('rooms')
export const courses     = crud('courses')

// ── timetable, scheduler, conflicts ──────────────────────────────────────
export const timetable = {
  get: (batchId) => request(`/timetable/${batchId}`),
}

export const scheduler = {
  // Backend expects scope ∈ {batch, dept, faculty}.
  // The UI shows "Department" but we send "dept".
  generate: (scope, id) =>
    request(`/scheduler/generate?scope=${encodeURIComponent(scope)}&id=${encodeURIComponent(id)}`,
            { method: 'POST' }),
  publish: (batchId)        => request(`/scheduler/publish/${batchId}`, { method: 'POST' }),
  clear:   (batchId, force) => request(`/scheduler/clear/${batchId}?force=${force ? 'true' : 'false'}`,
                                       { method: 'DELETE' }),
}

export const conflicts = {
  get: (batchId) => request(`/conflicts/${batchId}`),
}

// ── PDF export (must use blob + auth header, can't use window.open) ──────
export async function exportPdf(batchId) {
  const t = token.get()
  const res = await fetch(`${API}/export/pdf/${batchId}`, {
    headers: { Authorization: `Bearer ${t}` },
  })
  if (!res.ok) throw new Error('PDF export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timetable_batch_${batchId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── utility: probe backend health (used on dashboard) ────────────────────
export async function probe() {
  try {
    const r = await fetch(BASE + '/docs', { method: 'HEAD' })
    return r.ok
  } catch { return false }
}

export const API_BASE = API
