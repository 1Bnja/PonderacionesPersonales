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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Modo Azúl</h1>
          <p className="text-slate-400 mt-2">Gestiona tus ramos y ponderaciones</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Correo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input 
                type="email" 
                placeholder="correo@ejemplo.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center"
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        {/* Link de Registro */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}