import { useState, useEffect, useRef } from 'react'
import { auth, API_BASE } from '../lib/api.js'
import { Spinner, Notice } from '../components/ui.jsx'

export function Login({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('intro') // 'intro' | 'form'
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('form')
      setTimeout(() => inputRef.current?.focus(), 700)
    }, 1500)
    return () => clearTimeout(t)
  }, [])

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

  const isForm = phase === 'form'
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'rgb(var(--ink-1000))' }}
    >
      {/* Grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.04,
          backgroundImage:
            'linear-gradient(rgba(159,231,245,1) 1px, transparent 1px), linear-gradient(90deg, rgba(159,231,245,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '35%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 560, height: 560,
          background: 'radial-gradient(circle, rgba(66,158,189,0.18) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo + title block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: `all 0.6s ${ease}`,
          }}
        >
          <img
            src="/gikilogo.png"
            alt="GIK Institute Logo"
            style={{
              width: isForm ? 64 : 100,
              height: isForm ? 64 : 100,
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 12px rgba(66,158,189,0.45))',
              transition: `all 0.6s ${ease}`,
              marginBottom: isForm ? 10 : 20,
            }}
          />

          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: isForm ? 22 : 32,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#F7AD19',
              transition: `all 0.6s ${ease}`,
            }}
          >
            GIKI/TT
          </div>

          <div
            style={{
              textAlign: 'center',
              transition: `all 0.6s ${ease}`,
              marginTop: 6,
            }}
          >
            {!isForm && (
              <div
                style={{
                  fontSize: 12,
                  color: '#5a8fa5',
                  marginBottom: 4,
                  transition: `opacity 0.4s ${ease}`,
                }}
              >
                GIK Institute of Engineering Sciences & Technology
              </div>
            )}
            <div
              style={{
                fontSize: isForm ? 11 : 13,
                color: '#9FE7F5',
                letterSpacing: '0.05em',
                transition: `all 0.6s ${ease}`,
              }}
            >
              Timetable Management System
            </div>
          </div>
        </div>

        {/* Login form */}
        <div
          style={{
            opacity: isForm ? 1 : 0,
            transform: isForm ? 'translateY(0)' : 'translateY(24px)',
            transition: `opacity 0.55s ${ease} 0.15s, transform 0.55s ${ease} 0.15s`,
            pointerEvents: isForm ? 'auto' : 'none',
          }}
        >
          <form
            onSubmit={submit}
            className="card mt-6 p-8"
            style={{ borderColor: 'rgba(66,158,189,0.25)' }}
          >
            <label className="label">Admin Password</label>
            <input
              ref={inputRef}
              type="password"
              className="input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
            />

            {err && <div className="mt-3"><Notice kind="error">{err}</Notice></div>}

            <button
              type="submit"
              className="btn-primary w-full mt-5"
              disabled={loading || !pw}
            >
              {loading ? <><Spinner /> Signing in…</> : 'Sign in'}
            </button>

            <div
              className="mt-6 pt-5 border-t"
              style={{ borderColor: 'rgba(66,158,189,0.18)' }}
            >
              <div className="text-[10px] font-mono" style={{ color: '#5a8fa5' }}>
                <span style={{ color: '#F7AD19' }}>POST</span>{' '}
                {API_BASE}/auth/login
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
