import {
  faculties, departments, batches, teachers, rooms, courses,
} from '../lib/api.js'
import { ROOM_TYPES } from '../lib/constants.js'
import { EntityTable } from '../components/EntityTable.jsx'
import { useState } from 'react'

// Helpers used across pages to render foreign-key columns nicely
const lookup = (arr, id, key = 'name') => arr?.find((x) => x.id === id)?.[key] ?? `#${id}`

// ── Faculties ────────────────────────────────────────────────────────────
export function Faculties({ data, refreshOne }) {
  return (
    <EntityTable
      api={faculties}
      title="Faculty"
      onLoad={(arr) => refreshOne('faculties', arr)}
      columns={[
        { key: 'id',   label: 'ID',   className: 'font-mono text-muted text-xs' },
        { key: 'code', label: 'Code', render: (it) => <span className="font-mono text-cyan-400">{it.code}</span> },
        { key: 'name', label: 'Name', className: 'text-slate-200' },
      ]}
      blank={{ name: '', code: '' }}
      fields={[
        { key: 'name', label: 'Name', type: 'text', required: true, hint: 'e.g. Faculty of Computer Science & Engineering' },
        { key: 'code', label: 'Code', type: 'text', required: true, hint: 'e.g. FCSE' },
      ]}
      search={(it, q) => it.name?.toLowerCase().includes(q) || it.code?.toLowerCase().includes(q)}
    />
  )
}

// ── Departments ──────────────────────────────────────────────────────────
export function Departments({ data, refreshOne }) {
  return (
    <EntityTable
      api={departments}
      title="Department"
      onLoad={(arr) => refreshOne('departments', arr)}
      columns={[
        { key: 'id',         label: 'ID',         className: 'font-mono text-muted text-xs' },
        { key: 'name',       label: 'Name',       className: 'text-slate-200' },
        { key: 'faculty_id', label: 'Faculty',
          render: (it) => <span className="font-mono text-cyan-400 text-xs">{lookup(data.faculties, it.faculty_id, 'code')}</span> },
        { key: 'lab_day',    label: 'Lab day',
          render: (it) => it.lab_day
            ? <span className="font-mono text-violet-300 text-xs">{it.lab_day}</span>
            : <span className="text-bad text-xs">unset</span> },
        { key: 'lab_window', label: 'Lab window',
          render: (it) => it.lab_window
            ? <span className="font-mono text-xs text-slate-300">{it.lab_window}</span>
            : <span className="text-bad text-xs">unset</span> },
      ]}
      blank={{ name: '', faculty_id: '', lab_day: '', lab_window: '' }}
      fields={[
        { key: 'name',       label: 'Name', type: 'text', required: true },
        { key: 'faculty_id', label: 'Faculty', type: 'select-num', required: true,
          options: data.faculties?.map((f) => ({ value: f.id, label: `${f.name} (${f.code})` })) },
        { key: 'lab_day', label: 'Lab day', type: 'select',
          hint: 'Day of the week labs run (required for lab placement).',
          options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                   .map((d) => ({ value: d, label: d })) },
        { key: 'lab_window', label: 'Lab window', type: 'select',
          hint: 'Morning = slots 0–2, Afternoon = slots 5–7.',
          options: [{ value: 'morning', label: 'morning' }, { value: 'afternoon', label: 'afternoon' }] },
      ]}
      search={(it, q) => it.name?.toLowerCase().includes(q)}
    />
  )
}

// ── Batches ──────────────────────────────────────────────────────────────
export function Batches({ data, refreshOne }) {
  return (
    <EntityTable
      api={batches}
      title="Batch"
      onLoad={(arr) => refreshOne('batches', arr)}
      columns={[
        { key: 'id',            label: 'ID',      className: 'font-mono text-muted text-xs' },
        { key: 'section_label', label: 'Section', className: 'font-mono text-accent-400' },
        { key: 'year',          label: 'Year',    render: (it) => <span className="font-mono">{it.year}</span> },
        { key: 'student_count', label: 'Students', render: (it) => <span className="font-mono text-warn">{it.student_count}</span> },
        { key: 'dept_id',       label: 'Department',
          render: (it) => <span className="text-xs text-slate-300">{lookup(data.departments, it.dept_id)}</span> },
      ]}
      blank={{ year: 1, dept_id: '', student_count: 50, section_label: '' }}
      fields={[
        { key: 'year',          label: 'Year', type: 'number', required: true, hint: '1, 2, 3 or 4' },
        { key: 'dept_id',       label: 'Department', type: 'select-num', required: true,
          options: data.departments?.map((d) => ({ value: d.id, label: d.name })) },
        { key: 'student_count', label: 'Student count', type: 'number', required: true },
        { key: 'section_label', label: 'Section label', type: 'text', required: true, hint: 'e.g. CS-1A or CS LH1' },
      ]}
      search={(it, q) => it.section_label?.toLowerCase().includes(q)}
    />
  )
}

// ── Teachers ─────────────────────────────────────────────────────────────
export function Teachers({ data, refreshOne }) {
  const [deptFilter, setDeptFilter] = useState('')
  return (
    <EntityTable
      api={teachers}
      title="Teacher"
      onLoad={(arr) => refreshOne('teachers', arr)}
      extraFilters={(items) => deptFilter ? items.filter((it) => String(it.dept_id) === deptFilter) : items}
      columns={[
        { key: 'id',      label: 'ID',          className: 'font-mono text-muted text-xs' },
        { key: 'name',    label: 'Name',        className: 'text-slate-200' },
        { key: 'dept_id', label: 'Department',
          render: (it) => <span className="text-xs text-slate-300">{lookup(data.departments, it.dept_id)}</span> },
      ]}
      blank={{ name: '', dept_id: '' }}
      fields={[
        { key: 'name',    label: 'Name',       type: 'text',       required: true },
        { key: 'dept_id', label: 'Department', type: 'select-num', required: true,
          options: data.departments?.map((d) => ({ value: d.id, label: d.name })) },
      ]}
      search={(it, q) => it.name?.toLowerCase().includes(q)}
    />
  )
}

// ── Rooms ────────────────────────────────────────────────────────────────
export function Rooms({ data, refreshOne }) {
  return (
    <EntityTable
      api={rooms}
      title="Room"
      onLoad={(arr) => refreshOne('rooms', arr)}
      columns={[
        { key: 'id',         label: 'ID',     className: 'font-mono text-muted text-xs' },
        { key: 'name',       label: 'Name',   render: (it) => <span className="font-mono text-cyan-400">{it.name}</span> },
        { key: 'type',       label: 'Type',
          render: (it) => <span className={`badge ${it.type === 'lab_room' ? 'badge-info bg-violet-500/10 text-violet-300 border-violet-500/30' : 'badge-mute'}`}>
            {it.type?.replace('_', ' ')}
          </span> },
        { key: 'capacity',   label: 'Capacity',
          render: (it) => <span className={`font-mono ${it.capacity >= 100 ? 'text-warn' : 'text-slate-300'}`}>{it.capacity}</span> },
        { key: 'faculty_id', label: 'Faculty',
          render: (it) => <span className="font-mono text-xs text-cyan-400">{lookup(data.faculties, it.faculty_id, 'code')}</span> },
      ]}
      blank={{ name: '', type: 'lecture_hall', capacity: 60, faculty_id: '' }}
      fields={[
        { key: 'name',       label: 'Name',     type: 'text',       required: true },
        { key: 'type',       label: 'Type',     type: 'select',     required: true, options: ROOM_TYPES },
        { key: 'capacity',   label: 'Capacity', type: 'number',     required: true },
        { key: 'faculty_id', label: 'Faculty',  type: 'select-num', required: true,
          options: data.faculties?.map((f) => ({ value: f.id, label: `${f.name} (${f.code})` })) },
      ]}
      search={(it, q) => it.name?.toLowerCase().includes(q)}
    />
  )
}

// ── Courses ──────────────────────────────────────────────────────────────
export function Courses({ data, refreshOne }) {
  return (
    <EntityTable
      api={courses}
      title="Course"
      onLoad={(arr) => refreshOne('courses', arr)}
      columns={[
        { key: 'id',           label: 'ID',           className: 'font-mono text-muted text-xs' },
        { key: 'code',         label: 'Code',
          render: (it) => <span className="font-mono text-accent-400">{it.code}</span> },
        { key: 'name',         label: 'Name',         className: 'text-slate-200' },
        { key: 'credit_hours', label: 'Cr',
          render: (it) => <span className="font-mono text-xs">{it.credit_hours}</span> },
        { key: 'is_lab',       label: 'Type',
          render: (it) => it.is_lab
            ? <span className="badge badge-info bg-violet-500/10 text-violet-300 border-violet-500/30">LAB</span>
            : <span className="badge-mute">lecture</span> },
        { key: 'teacher_id',   label: 'Teacher',
          render: (it) => <span className="text-xs text-slate-300">{lookup(data.teachers, it.teacher_id)}</span> },
        { key: 'batch_id',     label: 'Batch',
          render: (it) => <span className="text-xs font-mono text-warn">{lookup(data.batches, it.batch_id, 'section_label')}</span> },
        { key: 'cross_listed_code', label: 'X-listed',
          render: (it) => it.cross_listed_code
            ? <span className="font-mono text-xs text-cyan-400">{it.cross_listed_code}</span>
            : <span className="text-muted text-xs">—</span> },
      ]}
      blank={{
        name: '', code: '', credit_hours: 3, is_lab: false,
        batch_id: '', teacher_id: '', dept_id: '',
        lab_course_id: null, cross_listed_code: '', allow_saturday: false,
      }}
      fields={[
        { key: 'name',         label: 'Name',         type: 'text',       required: true },
        { key: 'code',         label: 'Code',         type: 'text',       required: true, hint: 'e.g. CS232' },
        { key: 'credit_hours', label: 'Credit hours', type: 'number',     required: true },
        { key: 'is_lab',       label: 'Is lab?',      type: 'checkbox',   hint: 'Tick if this is a lab session.' },
        { key: 'batch_id',     label: 'Batch',        type: 'select-num', required: true,
          options: data.batches?.map((b) => ({ value: b.id, label: `${b.section_label} (year ${b.year})` })) },
        { key: 'teacher_id',   label: 'Teacher',      type: 'select-num', required: true,
          options: data.teachers?.map((t) => ({ value: t.id, label: t.name })) },
        { key: 'dept_id',      label: 'Department',   type: 'select-num', required: true,
          options: data.departments?.map((d) => ({ value: d.id, label: d.name })) },
        { key: 'cross_listed_code', label: 'Cross-listed code', type: 'text',
          hint: 'Optional. e.g. CS232 cross-listed as AI232.' },
        { key: 'lab_course_id',     label: 'Linked lab course', type: 'select-num',
          hint: 'Optional. Link a lab to its parent lecture.',
          options: data.courses?.filter((c) => c.is_lab).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` })) },
        { key: 'allow_saturday',    label: 'Allow Saturday',    type: 'checkbox',
          hint: 'Allow this course to be scheduled on Saturday.' },
      ]}
      search={(it, q) =>
        it.name?.toLowerCase().includes(q) ||
        it.code?.toLowerCase().includes(q) ||
        (it.cross_listed_code || '').toLowerCase().includes(q)}
    />
  )
}
