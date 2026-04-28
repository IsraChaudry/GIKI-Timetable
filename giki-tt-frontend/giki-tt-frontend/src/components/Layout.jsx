import { useState } from 'react'
import { auth } from '../lib/api.js'

const NAV_GROUPS = [
  {
    label: 'Schedule',
    items: [
      { id: 'dashboard',  label: 'Dashboard',        icon: '◇' },
      { id: 'timetable',  label: 'Timetable',        icon: '▦' },
      { id: 'scheduler',  label: 'Generator',        icon: '⚙' },
      { id: 'conflicts',  label: 'Conflicts',        icon: '!' },
    ],
  },
  {
    label: 'Views',
    items: [
      { id: 'rooms-view',    label: 'Room Schedule',    icon: '▣' },
      { id: 'teachers-view', label: 'Teacher Schedule', icon: '◎' },
      { id: 'slots',         label: 'Slot Reference',   icon: '⏱' },
    ],
  },
  {
    label: 'Data',
    items: [
      { id: 'faculties',   label: 'Faculties',   icon: '◫' },
      { id: 'departments', label: 'Departments', icon: '◧' },
      { id: 'batches',     label: 'Batches',     icon: '◉' },
      { id: 'teachers',    label: 'Teachers',    icon: '◐' },
      { id: 'rooms',       label: 'Rooms',       icon: '◳' },
      { id: 'courses',     label: 'Courses',     icon: '◆' },
    ],
  },
]

export const ALL_PAGES = NAV_GROUPS.flatMap((g) => g.items)

export function Layout({ page, setPage, children, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const current = ALL_PAGES.find((p) => p.id === page)

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-14' : 'w-56'} flex flex-col bg-ink-900 border-r border-ink-700 flex-shrink-0 transition-all`}>
        <div className="p-4 border-b border-ink-700 flex items-center justify-between">
          {!collapsed && (
            <div>
              <div className="font-mono text-sm font-bold text-accent tracking-[0.2em]">GIKI/TT</div>
              <div className="text-[10px] text-muted tracking-widest mt-0.5">TIMETABLE OPS</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
                  className="text-muted hover:text-white text-xs w-6 h-6 flex items-center justify-center rounded hover:bg-ink-800">
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted px-2 mt-2 mb-1.5">
                  {group.label}
                </div>
              )}
              {group.items.map((it) => {
                const active = page === it.id
                return (
                  <button key={it.id} onClick={() => setPage(it.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs mb-0.5 transition-colors text-left
                      ${active
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-slate-400 hover:text-white hover:bg-ink-800 border border-transparent'}`}>
                    <span className="font-mono text-sm w-4 text-center">{it.icon}</span>
                    {!collapsed && <span>{it.label}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-ink-700">
          <button onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-ok hover:bg-ok/10 border border-ok/20">
            <span className="dot bg-ok" />
            {!collapsed && <span className="font-mono">Authenticated · Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 px-6 border-b border-ink-700 bg-ink-900 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="font-mono text-sm uppercase tracking-[0.15em] text-slate-200">
              {current?.label}
            </div>
          </div>
          <div className="text-[10px] font-mono text-muted">
            GIK Institute of Engineering Sciences & Technology · {new Date().toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 fade-up" key={page}>
          {children}
        </div>
      </main>
    </div>
  )
}
