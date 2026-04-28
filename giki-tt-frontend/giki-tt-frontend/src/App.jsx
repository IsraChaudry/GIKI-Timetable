import { useCallback, useEffect, useState } from 'react'
import { auth, faculties, departments, batches, teachers, rooms, courses } from './lib/api.js'
import { ToastProvider, Spinner } from './components/ui.jsx'
import { Layout } from './components/Layout.jsx'

import { Login }     from './pages/Login.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Timetable } from './pages/Timetable.jsx'
import { Scheduler } from './pages/Scheduler.jsx'
import { Conflicts } from './pages/Conflicts.jsx'
import { Slots }     from './pages/Slots.jsx'
import { RoomSchedule, TeacherSchedule } from './pages/Schedules.jsx'
import {
  Faculties, Departments, Batches, Teachers, Rooms, Courses,
} from './pages/Entities.jsx'

// Map of entity name -> CRUD api object, used to bulk-load reference data.
const ENTITIES = { faculties, departments, batches, teachers, rooms, courses }

function AppInner() {
  const [authed, setAuthed] = useState(auth.isAuthed())
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState({ faculties: null, departments: null, batches: null, teachers: null, rooms: null, courses: null })
  const [bootLoading, setBootLoading] = useState(false)

  // Load all reference data once after login. Pages share this snapshot
  // so dropdowns are instant.
  const reloadAll = useCallback(async () => {
    setBootLoading(true)
    const out = {}
    await Promise.all(Object.entries(ENTITIES).map(async ([k, api]) => {
      try { out[k] = await api.list() } catch { out[k] = [] }
    }))
    setData(out)
    setBootLoading(false)
  }, [])

  // After EntityTable saves a new/edited row, the page calls refreshOne to
  // surgically replace one slice without a full reload.
  const refreshOne = useCallback((key, arr) => {
    setData((d) => ({ ...d, [key]: arr }))
  }, [])

  useEffect(() => {
    if (!authed) return
    reloadAll()
  }, [authed, reloadAll])

  // Listen for forced logout (401 from API client)
  useEffect(() => {
    const onLogout = () => setAuthed(false)
    window.addEventListener('giki-tt:logout', onLogout)
    return () => window.removeEventListener('giki-tt:logout', onLogout)
  }, [])

  const handleLogout = () => {
    auth.logout()
    setAuthed(false)
    setData({ faculties: null, departments: null, batches: null, teachers: null, rooms: null, courses: null })
    setPage('dashboard')
  }

  if (!authed) {
    return <Login onAuth={() => setAuthed(true)} />
  }

  if (bootLoading && !data.batches) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <div className="text-xs font-mono text-muted">Loading reference data…</div>
      </div>
    )
  }

  return (
    <Layout page={page} setPage={setPage} onLogout={handleLogout}>
      {page === 'dashboard'      && <Dashboard       data={data} setPage={setPage} />}
      {page === 'timetable'      && <Timetable       data={data} />}
      {page === 'scheduler'      && <Scheduler       data={data} />}
      {page === 'conflicts'      && <Conflicts       data={data} />}
      {page === 'rooms-view'     && <RoomSchedule    data={data} />}
      {page === 'teachers-view'  && <TeacherSchedule data={data} />}
      {page === 'slots'          && <Slots />}
      {page === 'faculties'      && <Faculties       data={data} refreshOne={refreshOne} />}
      {page === 'departments'    && <Departments     data={data} refreshOne={refreshOne} />}
      {page === 'batches'        && <Batches         data={data} refreshOne={refreshOne} />}
      {page === 'teachers'       && <Teachers        data={data} refreshOne={refreshOne} />}
      {page === 'rooms'          && <Rooms           data={data} refreshOne={refreshOne} />}
      {page === 'courses'        && <Courses         data={data} refreshOne={refreshOne} />}
    </Layout>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
