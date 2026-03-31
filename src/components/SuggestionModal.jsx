import { useState } from 'react'
import { Send, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react'
import emailjs from '@emailjs/browser'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { cn } from '../lib/utils'

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-xl bg-[var(--color-primary)]/15 p-2">
              <Lightbulb className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <DialogTitle>Enviar sugerencia</DialogTitle>
              <DialogDescription>Tu opinion nos ayuda a mejorar Modo Azul.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suggestion-name">Tu nombre (opcional)</Label>
            <Input
              id="suggestion-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Perez"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestion-email">Tu email (opcional)</Label>
            <Input
              id="suggestion-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: juan@ejemplo.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestion-text">Tu sugerencia</Label>
            <Textarea
              id="suggestion-text"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Comparte tus ideas para mejorar Modo Azul..."
              rows={5}
              className="resize-none"
              disabled={loading}
              required
            />
          </div>

          {status && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                status === 'success'
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              )}
            >
              {status === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {status === 'success' ? 'Sugerencia enviada exitosamente.' : 'Error al enviar. Intenta de nuevo.'}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Send className="h-4 w-4" />
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
