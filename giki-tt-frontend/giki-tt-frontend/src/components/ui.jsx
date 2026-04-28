import { useEffect, useState, createContext, useContext, useCallback } from 'react'

// ── Spinner ──────────────────────────────────────────────────────────────
export function Spinner({ size = 'sm' }) {
  return <span className={size === 'lg' ? 'spinner-lg spinner' : 'spinner'} />
}

// ── Notice (inline banner) ───────────────────────────────────────────────
export function Notice({ kind = 'info', children }) {
  const styles = {
    info:    'bg-accent/5 border-accent/20 text-accent-400',
    success: 'bg-ok/5 border-ok/20 text-ok',
    warn:    'bg-warn/5 border-warn/30 text-warn',
    error:   'bg-bad/5 border-bad/30 text-bad',
  }
  return (
    <div className={`border rounded-md px-3 py-2 text-xs leading-relaxed ${styles[kind]}`}>
      {children}
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────
export function EmptyState({ title, hint, action }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-sm text-slate-300 mb-1">{title}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, width = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-up"
         onClick={onClose}>
      <div className={`card w-full ${width} fade-up`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <div className="font-mono text-sm uppercase tracking-wider text-slate-200">{title}</div>
          <button onClick={onClose}
                  className="text-muted hover:text-white text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-ink-800">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 p-4 border-t border-ink-700 bg-ink-850/50 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  )
}

// ── Confirm dialog hook ──────────────────────────────────────────────────
// Usage: const confirm = useConfirm(); await confirm({ title, message })
export function useConfirm() {
  // Lifted from the ToastProvider context for simplicity.
  const ctx = useContext(ToastContext)
  return ctx?.confirm
}

// ── Toast / Confirm provider ─────────────────────────────────────────────
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((arr) => [...arr, { id, ...t }])
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), t.duration || 4000)
  }, [])

  const toast = {
    info:    (msg) => push({ kind: 'info',    msg }),
    success: (msg) => push({ kind: 'success', msg }),
    warn:    (msg) => push({ kind: 'warn',    msg }),
    error:   (msg) => push({ kind: 'error',   msg, duration: 6000 }),
  }

  const confirm = (opts) =>
    new Promise((resolve) => {
      setConfirmState({ ...opts, resolve })
    })

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div key={t.id}
               className={`fade-up px-4 py-3 rounded-md text-xs border shadow-lg backdrop-blur-md ${
                 t.kind === 'success' ? 'bg-ok/10 border-ok/30 text-ok' :
                 t.kind === 'error'   ? 'bg-bad/10 border-bad/30 text-bad' :
                 t.kind === 'warn'    ? 'bg-warn/10 border-warn/30 text-warn' :
                                        'bg-accent/10 border-accent/30 text-accent-400'
               }`}>
            {t.msg}
          </div>
        ))}
      </div>
      {/* Confirm dialog */}
      <Modal
        open={!!confirmState}
        onClose={() => { confirmState?.resolve(false); setConfirmState(null) }}
        title={confirmState?.title || 'Confirm'}
        footer={
          <>
            <button className="btn-ghost"
                    onClick={() => { confirmState?.resolve(false); setConfirmState(null) }}>
              Cancel
            </button>
            <button className={confirmState?.danger ? 'btn-danger' : 'btn-primary'}
                    onClick={() => { confirmState?.resolve(true); setConfirmState(null) }}>
              {confirmState?.confirmLabel || 'Confirm'}
            </button>
          </>
        }
      >
        <div className="text-sm text-slate-300">{confirmState?.message}</div>
      </Modal>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)?.toast
}
