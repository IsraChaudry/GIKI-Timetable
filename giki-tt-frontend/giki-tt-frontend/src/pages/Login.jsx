import { useState } from 'react'
import { auth, API_BASE } from '../lib/api.js'
import { Spinner, Notice } from '../components/ui.jsx'

export function Login({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e?.preventDefault?.()
    if (!pw) return
    setLoading(true); setErr('')
    try {
      await auth.login(pw)
      onAuth()
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink-950 relative overflow-hidden">
      {/* subtle grid backdrop */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
             backgroundSize: '40px 40px',
           }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <form onSubmit={submit} className="card relative z-10 w-full max-w-sm p-8 fade-up">
        <div className="mb-6">
          <div className="font-mono text-2xl font-bold text-accent tracking-[0.15em]">GIKI/TT</div>
          <div className="text-xs text-muted mt-1">Timetable Management System</div>
        </div>

        <label className="label">Admin Password</label>
        <input
          type="password"
          autoFocus
          className="input"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Enter password"
          disabled={loading}
        />

        {err && <div className="mt-3"><Notice kind="error">{err}</Notice></div>}

        <button type="submit" className="btn-primary w-full mt-5" disabled={loading || !pw}>
          {loading ? <><Spinner /> Signing in…</> : 'Sign in'}
        </button>

        <div className="mt-6 pt-5 border-t border-ink-700">
          <div className="text-[10px] font-mono text-muted">
            <span className="text-accent-400">POST</span> {API_BASE}/auth/login
          </div>
        </div>
      </form>
    </div>
  )
}
