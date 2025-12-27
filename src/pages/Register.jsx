import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, User, ArrowLeft, GraduationCap } from 'lucide-react'
import Toast from '../components/Toast'

// Lista de instituciones de educación superior de Chile
const universidadesChile = [
  "Universidad de Chile",
  "Pontificia Universidad Católica de Chile",
  "Universidad de Santiago de Chile",
  "Universidad de Concepción",
  "Universidad Técnica Federico Santa María",
  "Universidad Austral de Chile",
  "Universidad Católica de Valparaíso",
  "Universidad de Valparaíso",
  "Universidad Adolfo Ibáñez",
  "Universidad de los Andes",
  "Universidad del Desarrollo",
  "Universidad Diego Portales",
  "Universidad Alberto Hurtado",
  "Universidad Andrés Bello",
  "Universidad Católica del Norte",
  "Universidad de La Frontera",
  "Universidad de La Serena",
  "Universidad de Magallanes",
  "Universidad de Talca",
  "Universidad de Tarapacá",
  "Universidad Arturo Prat",
  "Universidad del Bío-Bío",
  "Universidad Católica de la Santísima Concepción",
  "Universidad Católica del Maule",
  "Universidad Católica de Temuco",
  "Universidad de Playa Ancha",
  "Universidad Metropolitana de Ciencias de la Educación",
  "Universidad Tecnológica Metropolitana",
  "Universidad de Atacama",
  "Universidad de Antofagasta",
  "Universidad de O'Higgins",
  "Universidad de Aysén",
  "DUOC UC",
  "INACAP",
  "Instituto Profesional AIEP",
  "CFT Santo Tomás",
  "Instituto Profesional Santo Tomás",
  "Otra"
].sort()

export default function Register() {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [username, setUsername] = useState('')
  const [universidad, setUniversidad] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    // Validaciones
    if (!nombre.trim()) {
      setToast({ message: "El nombre es obligatorio", type: "error" })
      return
    }

    if (!apellido.trim()) {
      setToast({ message: "El apellido es obligatorio", type: "error" })
      return
    }

    if (!username.trim()) {
      setToast({ message: "El nombre de usuario es obligatorio", type: "error" })
      return
    }

    if (username.length < 3) {
      setToast({ message: "El nombre de usuario debe tener al menos 3 caracteres", type: "error" })
      return
    }

    if (!universidad) {
      setToast({ message: "Debes seleccionar una universidad", type: "error" })
      return
    }

    if (password !== confirmPassword) {
      setToast({ message: "Las contraseñas no coinciden", type: "error" })
      return
    }

    if (password.length < 6) {
      setToast({ message: "La contraseña debe tener al menos 6 caracteres", type: "error" })
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          username: username.trim(),
          universidad: universidad,
          nombre_completo: `${nombre.trim()} ${apellido.trim()}`
        }
      }
    })

    if (error) {
      setToast({ message: error.message, type: "error" })
      setLoading(false)
    } else {
      setToast({ message: "Cuenta creada exitosamente. Redirigiendo...", type: "success" })

      // Esperar un momento y redirigir al dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    }
  }

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (error) {
      setToast({ message: error.message, type: "error" })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1F2E] p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-[#242B3D] p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#2E3648]">

        {/* Botón Volver */}
        <Link
          to="/login"
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#E2E8F0] mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img src="/logo.svg" alt="Modo Azúl" className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-[#E2E8F0]">Crear Cuenta</h1>
          <p className="text-[#94A3B8] mt-2">Únete a Modo Azúl</p>
        </div>

        {/* Botón de Google */}
        <button
          onClick={handleGoogleSignup}
          className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-3 border border-gray-300 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        {/* Separador */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2E3648]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#242B3D] text-[#94A3B8]">o regístrate con email</span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#E2E8F0] mb-1">Nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-[#94A3B8] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] focus:outline-none"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E2E8F0] mb-1">Apellido</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-[#94A3B8] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tu apellido"
                  className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] focus:outline-none"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E2E8F0] mb-1">Nombre de usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-[#94A3B8] w-5 h-5" />
              <input
                type="text"
                placeholder="usuario123"
                className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] focus:outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E2E8F0] mb-1">Universidad</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-3 text-[#94A3B8] w-5 h-5 pointer-events-none z-10" />
              <select
                className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#E2E8F0] focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] focus:outline-none appearance-none cursor-pointer"
                value={universidad}
                onChange={(e) => setUniversidad(e.target.value)}
                required
              >
                <option value="" className="bg-[#1A1F2E]">Selecciona tu institución</option>
                {universidadesChile.map((uni) => (
                  <option key={uni} value={uni} className="bg-[#1A1F2E]">
                    {uni}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E2E8F0] mb-1">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-[#94A3B8] w-5 h-5" />
              <input
                type="password"
                placeholder="Repite tu contraseña"
                className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7AA7EC] hover:bg-[#6A96DB] text-white font-semibold py-3 rounded-lg transition-colors flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        {/* Link a Login */}
        <div className="mt-6 text-center">
          <p className="text-[#94A3B8] text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="text-[#7AA7EC] hover:text-[#9BC7F0] font-medium hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
