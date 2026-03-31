import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { User, Mail, GraduationCap, ArrowLeft, Save, Camera, X } from 'lucide-react'
import Toast from '../components/Toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

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
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)
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

      // Cargar avatar (priorizar avatar personalizado sobre el de Google)
      const customAvatar = metadata.custom_avatar_url || metadata.avatar_url
      setAvatarUrl(customAvatar || '')
      setAvatarPreview(customAvatar || '')
    }

    getUser()
  }, [navigate])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setToast({ message: "Por favor selecciona una imagen válida", type: "error" })
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: "La imagen debe ser menor a 2MB", type: "error" })
      return
    }

    setAvatarFile(file)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(avatarUrl || '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return null

    setUploadingAvatar(true)

    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setUploadingAvatar(false)
      return publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setUploadingAvatar(false)
      setToast({ message: "Error al subir la imagen", type: "error" })
      return null
    }
  }

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

    // Subir avatar si hay uno nuevo
    let newAvatarUrl = avatarUrl
    if (avatarFile) {
      const uploadedUrl = await uploadAvatar()
      if (uploadedUrl) {
        newAvatarUrl = uploadedUrl
      }
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        username: username.trim(),
        universidad: universidad,
        nombre_completo: `${nombre.trim()} ${apellido.trim()}`,
        custom_avatar_url: newAvatarUrl  // Usar custom_avatar_url en lugar de avatar_url
      }
    })

    if (error) {
      setToast({ message: error.message, type: "error" })
    } else {
      // Actualizar el estado local con la nueva URL
      setAvatarUrl(newAvatarUrl)
      setAvatarPreview(newAvatarUrl)
      setAvatarFile(null)

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
    <div className="min-h-screen p-4 text-[var(--color-text)] md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 gap-2 px-0 text-[var(--color-text-muted)] hover:bg-transparent hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-5 w-5" /> Volver al dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Mi perfil</CardTitle>
            <CardDescription>Edita tu informacion personal.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-6 flex flex-col items-center border-b border-[var(--color-border)] pb-6">
            <div className="relative group">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--color-primary)] bg-[var(--color-background)]">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-[#94A3B8]" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>

              {avatarFile && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <p className="mt-3 text-center text-sm text-[var(--color-text-muted)]">
              Haz click en la foto para cambiarla
              <br />
              <span className="text-xs">Máximo 2MB - JPG, PNG o GIF</span>
            </p>
            </div>

          <div className="mb-6 border-b border-[var(--color-border)] pb-6">
            <Label htmlFor="profile-email" className="mb-2 block text-[var(--color-text-muted)]">Correo electronico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
              <Input
                id="profile-email"
                type="email"
                value={user.email}
                disabled
                className="cursor-not-allowed pl-10 text-[var(--color-text-muted)]"
              />
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">El correo no se puede cambiar.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-nombre">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                  <Input
                    id="profile-nombre"
                    type="text"
                    placeholder="Tu nombre"
                    className="pl-10"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-apellido">Apellido</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                  <Input
                    id="profile-apellido"
                    type="text"
                    placeholder="Tu apellido"
                    className="pl-10"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-username">Nombre de usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                <Input
                  id="profile-username"
                  type="text"
                  placeholder="usuario123"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-universidad">Universidad</Label>
              <div className="relative">
                <GraduationCap className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-[var(--color-text-muted)]" />
                <select
                  id="profile-universidad"
                  className="flex h-10 w-full cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/70 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/60"
                  value={universidad}
                  onChange={(e) => setUniversidad(e.target.value)}
                  required
                >
                  <option value="">Selecciona tu institucion</option>
                  {universidadesChile.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || uploadingAvatar}
              className="w-full gap-2"
            >
              <Save className="h-4 w-4" />
              {uploadingAvatar ? 'Subiendo imagen...' : loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
