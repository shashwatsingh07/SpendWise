import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { spring } from '../lib/motion'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastApi {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastApi>({ toast: () => {} })

/** Fire a toast from anywhere: `const { toast } = useToast()`. */
export const useToast = () => useContext(ToastContext)

let counter = 0

const STYLES: Record<ToastType, { icon: ReactNode; ring: string }> = {
  success: {
    icon: <CheckCircle2 size={18} className="text-emerald-400" />,
    ring: 'border-emerald-400/30',
  },
  error: {
    icon: <AlertCircle size={18} className="text-rose-400" />,
    ring: 'border-rose-400/30',
  },
  info: {
    icon: <Info size={18} className="text-violet-400" />,
    ring: 'border-violet-400/30',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = `toast-${++counter}`
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => remove(id), 3500)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const style = STYLES[t.type]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.18 } }}
                transition={spring}
                className={`pointer-events-auto flex items-center gap-3 min-w-[260px] max-w-sm
                  rounded-2xl border ${style.ring} bg-white/90 dark:bg-slate-900/85
                  backdrop-blur-xl shadow-glass px-4 py-3`}
              >
                {style.icon}
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-100">
                  {t.message}
                </span>
                <button
                  onClick={() => remove(t.id)}
                  className="p-1 -mr-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
