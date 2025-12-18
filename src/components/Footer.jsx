import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-8 mt-auto border-t border-slate-800 bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p className="text-slate-600 text-xs">
          Modo Azúl © {new Date().getFullYear()} — Calculadora de Ponderaciones
        </p>
      </div>
    </footer>
  )
}
