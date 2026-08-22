'use client'

import { createContext, useContext, useCallback, useState, ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const newToast: Toast = { ...t, id }
    setToasts(prev => [...prev.slice(-4), newToast]) // max 5 toasts
    const duration = t.duration ?? 4500
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const success = useCallback((title: string, message?: string) =>
    toast({ type: 'success', title, message }), [toast])
  const error = useCallback((title: string, message?: string) =>
    toast({ type: 'error', title, message, duration: 6000 }), [toast])
  const warning = useCallback((title: string, message?: string) =>
    toast({ type: 'warning', title, message }), [toast])
  const info = useCallback((title: string, message?: string) =>
    toast({ type: 'info', title, message }), [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const ICONS = {
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}

const COLORS = {
  success: { bg: '#1a3d30', border: '#2e6e55', icon: '#34d399', title: '#a7f3d0' },
  error: { bg: '#3d1a1a', border: '#6e2e2e', icon: '#f87171', title: '#fca5a5' },
  warning: { bg: '#3d2e1a', border: '#6e561a', icon: '#fbbf24', title: '#fde68a' },
  info: { bg: '#1a2a3d', border: '#2e4a6e', icon: '#60a5fa', title: '#bfdbfe' },
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
        width: '100%',
      }}
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(t => {
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
              animation: 'toast-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>
              {ICONS[t.type]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ color: c.title, fontSize: '13px', display: 'block' }}>
                {t.title}
              </strong>
              {t.message && (
                <span style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px', display: 'block' }}>
                  {t.message}
                </span>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                flexShrink: 0,
                padding: '0',
                lineHeight: 1,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(24px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
