import { useState } from 'react'
import { X, Send, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react'
import emailjs from '@emailjs/browser'

export default function SuggestionModal({ isOpen, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error' | null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!suggestion.trim()) {
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
      return
    }

    setLoading(true)

    try {
      // Configuración de EmailJS desde variables de entorno
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

      const templateParams = {
        from_name: name || 'Anónimo',
        from_email: email || 'No proporcionado',
        message: suggestion,
        to_name: 'Equipo Modo Azúl',
      }

      await emailjs.send(serviceId, templateId, templateParams, publicKey)

      setStatus('success')
      setTimeout(() => {
        setStatus(null)
        setName('')
        setEmail('')
        setSuggestion('')
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error al enviar sugerencia:', error)
      setStatus('error')
      setTimeout(() => setStatus(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#242B3D] p-6 rounded-2xl border border-[#2E3648] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7AA7EC]/10 rounded-lg">
              <Lightbulb className="w-6 h-6 text-[#7AA7EC]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#E2E8F0]">Enviar Sugerencia</h3>
              <p className="text-xs text-[#94A3B8]">Tu opinión nos ayuda a mejorar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre (opcional) */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
              Tu nombre (opcional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 px-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] outline-none"
              disabled={loading}
            />
          </div>

          {/* Email (opcional) */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
              Tu email (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: juan@ejemplo.com"
              className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 px-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] outline-none"
              disabled={loading}
            />
          </div>

          {/* Sugerencia */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
              Tu sugerencia <span className="text-red-400">*</span>
            </label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Comparte tus ideas para mejorar Modo Azúl..."
              rows={5}
              className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 px-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] outline-none resize-none"
              disabled={loading}
              required
            />
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400 font-medium">¡Sugerencia enviada exitosamente!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-400 font-medium">Error al enviar. Intenta de nuevo.</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#2E3648] hover:bg-[#3A4357] text-[#E2E8F0] py-2.5 rounded-lg font-bold transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#7AA7EC] hover:bg-[#6A96DB] text-white py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
