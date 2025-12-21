import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { BookOpen, Lock, Mail } from 'lucide-react'
import Toast from '../components/Toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setToast({ message: error.message, type: "error" })
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1F2E] p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-[#242B3D] p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#2E3648]">

        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img src="/logo.svg" alt="Modo Azúl" className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-[#E2E8F0]">Modo Azúl</h1>
          <p className="text-[#94A3B8] mt-2">Gestiona tus ramos y ponderaciones</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#E2E8F0] mb-1">Correo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-[#94A3B8] w-5 h-5" />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E2E8F0] mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-[#94A3B8] w-5 h-5" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7AA7EC] hover:bg-[#6A96DB] text-white font-semibold py-3 rounded-lg transition-colors flex justify-center"
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        {/* Link de Registro */}
        <div className="mt-6 text-center">
          <p className="text-[#94A3B8] text-sm">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="text-[#7AA7EC] hover:text-[#9BC7F0] font-medium hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}