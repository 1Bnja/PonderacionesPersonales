import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  }

  const colors = {
    success: 'border-green-500/40 bg-green-500/15 text-green-100',
    error: 'border-red-500/40 bg-red-500/15 text-red-100',
    info: 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/15 text-[var(--color-text)]'
  }

  return (
    <div
      className={cn(
        'fixed right-4 top-4 z-[100] flex min-w-[280px] max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur md:right-6 md:top-6',
        colors[type]
      )}
      role="status"
      aria-live="polite"
    >
      <span className="shrink-0">{icons[type]}</span>
      <span className="flex-1 text-sm font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="rounded-lg p-1 transition-colors hover:bg-white/15"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
