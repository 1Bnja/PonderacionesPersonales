import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, User, ArrowLeft, GraduationCap } from 'lucide-react'
import Toast from '../components/Toast'
import AnimatedGridPattern from '../components/AnimatedGridPattern'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Separator } from '../components/ui/separator'

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

    const { error } = await supabase.auth.signUp({
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
    // Detectar si estamos en producción o desarrollo
    const isProduction = window.location.hostname !== 'localhost'
    const redirectUrl = isProduction
      ? 'https://ponderaciones-personales.vercel.app/dashboard'
      : 'http://localhost:5173/dashboard'

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    })

    if (error) {
      setToast({ message: error.message, type: "error" })
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 py-8">
      <AnimatedGridPattern />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Card className="relative z-10 w-full max-w-3xl">
        <CardHeader className="space-y-4">
          <Link
            to="/login"
            className="inline-flex w-fit items-center gap-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>

          <div className="text-center">
            <CardTitle className="text-2xl">Crear cuenta</CardTitle>
            <CardDescription>Unete a Modo Azul y organiza tus notas.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <Button
            onClick={handleGoogleSignup}
            variant="outline"
            className="w-full border-white/20 bg-white text-slate-900 hover:bg-slate-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-muted)]">
              o registrate con email
            </span>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="reg-nombre">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                  <Input
                    id="reg-nombre"
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
                <Label htmlFor="reg-apellido">Apellido</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                  <Input
                    id="reg-apellido"
                    type="text"
                    placeholder="Tu apellido"
                    className="pl-10"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-username">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                  <Input
                    id="reg-username"
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
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reg-universidad">Universidad</Label>
                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-[var(--color-text-muted)]" />
                  <select
                    id="reg-universidad"
                    className="flex h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/70 pl-10 pr-3 text-sm text-[var(--color-text)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/60"
                    value={universidad}
                    onChange={(e) => setUniversidad(e.target.value)}
                    required
                  >
                    <option value="">Selecciona tu universidad</option>
                    {universidadesChile.map((uni) => (
                      <option key={uni} value={uni}>
                        {uni}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Correo electronico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reg-password">Contrasena</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password">Confirmar contrasena</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-muted)]" />
                  <Input
                    id="reg-confirm-password"
                    type="password"
                    placeholder="Repite tu contrasena"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">
              Inicia sesion aqui
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
