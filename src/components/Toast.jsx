import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

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
    success: 'bg-green-500/90 border-green-400/50',
    error: 'bg-red-500/90 border-red-400/50',
    info: 'bg-[#7AA7EC]/90 border-[#9BC7F0]/50'
  }

  return (
    <div className={`fixed top-6 right-6 z-[100] ${colors[type]} border-2 text-white px-5 py-4 rounded-xl shadow-2xl backdrop-blur-sm flex items-center gap-3 min-w-[300px] max-w-md animate-in slide-in-from-top-5 fade-in duration-300`}>
      {icons[type]}
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onClose}
        className="hover:bg-white/20 p-1 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
