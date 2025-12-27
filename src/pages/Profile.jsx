import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { User, Mail, GraduationCap, ArrowLeft, Save } from 'lucide-react'
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

export default function Profile() {
  const [user, setUser] = useState(null)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [username, setUsername] = useState('')
  const [universidad, setUniversidad] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login')
        return
      }

      setUser(user)

      // Cargar datos del perfil desde user_metadata
      const metadata = user.user_metadata || {}
      setNombre(metadata.nombre || '')
      setApellido(metadata.apellido || '')
      setUsername(metadata.username || user.email?.split('@')[0] || '')
      setUniversidad(metadata.universidad || '')
    }

    getUser()
  }, [navigate])

  const handleSaveProfile = async (e) => {
    e.preventDefault()

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

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        username: username.trim(),
        universidad: universidad,
        nombre_completo: `${nombre.trim()} ${apellido.trim()}`
      }
    })

    if (error) {
      setToast({ message: error.message, type: "error" })
    } else {
      setToast({ message: "Perfil actualizado exitosamente", type: "success" })
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    }

    setLoading(false)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#1A1F2E] text-[#E2E8F0] p-4 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-[#E2E8F0] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-[#94A3B8] mt-2">Edita tu información personal</p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#242B3D] border border-[#2E3648] rounded-2xl p-6 shadow-lg">

          {/* Email (no editable) */}
          <div className="mb-6 pb-6 border-b border-[#2E3648]">
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-[#94A3B8] w-5 h-5" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-2.5 pl-10 pr-4 text-[#94A3B8] cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">El correo no se puede cambiar</p>
          </div>

          {/* Formulario editable */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7AA7EC] hover:bg-[#6A96DB] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
