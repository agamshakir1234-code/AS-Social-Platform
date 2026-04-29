import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

let id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const tid = ++id
    setToasts((prev) => [...prev, { id: tid, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== tid)), duration)
  }, [])

  const dismiss = (tid) => setToasts((prev) => prev.filter((t) => t.id !== tid))

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
    error:   <AlertCircle size={16} className="text-red-400 shrink-0" />,
    info:    <Info        size={16} className="text-brand-400 shrink-0" />,
  }

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-500/5',
    error:   'border-red-500/30 bg-red-500/5',
    info:    'border-brand-500/30 bg-brand-500/5',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border card animate-fade-in ${borders[t.type]}`}
          >
            {icons[t.type]}
            <span className="text-sm text-slate-200 flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-slate-500 hover:text-slate-300 mt-0.5">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
