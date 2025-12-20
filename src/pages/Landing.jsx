import { Link } from 'react-router-dom'
import { Calculator, BarChart3, Zap, ShieldCheck, ArrowRight, GraduationCap } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1A1F2E] text-[#E2E8F0] flex flex-col">

      {/* Navbar simple */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-[#7AA7EC]">
          <GraduationCap className="w-8 h-8" />
          <span>Modo azul</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-[#94A3B8] hover:text-[#E2E8F0] font-medium transition-colors">
            Iniciar Sesión
          </Link>
          <Link to="/register" className="bg-[#7AA7EC] hover:bg-[#6A96DB] text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 py-20 text-center lg:text-left lg:flex lg:items-center lg:gap-12">
        <div className="lg:w-1/2 space-y-6">
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight bg-gradient-to-r from-[#7AA7EC] to-[#9BC7F0] bg-clip-text text-transparent">
            Tus notas, <br /> bajo control.
          </h1>
          <p className="text-xl text-[#94A3B8] leading-relaxed">
            Olvídate de las planillas de Excel complicadas. Gestiona tus ramos, calcula tus promedios y proyecta tu semestre académico en una sola plataforma moderna y fácil de usar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <Link to="/register" className="flex items-center justify-center gap-2 bg-[#7AA7EC] hover:bg-[#6A96DB] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
              Comenzar Gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 bg-[#242B3D] hover:bg-[#2A3142] text-[#E2E8F0] px-8 py-4 rounded-xl font-bold text-lg transition-all border border-[#2E3648]">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Hero Visual / Abstract Representation */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-[#7AA7EC]/20 blur-3xl rounded-full"></div>
          <div className="relative bg-[#242B3D] border border-[#2E3648] p-6 rounded-2xl shadow-2xl backdrop-blur-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center justify-between mb-6 border-b border-[#2E3648] pb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="text-[#94A3B8] text-sm">Dashboard</div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#1A1F2E] p-4 rounded-lg border border-[#2E3648]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#7AA7EC]/10 text-[#7AA7EC] rounded-lg"><Calculator size={20}/></div>
                  <div>
                    <div className="font-medium text-[#E2E8F0]">Cálculo I</div>
                    <div className="text-xs text-[#94A3B8]">4 Créditos</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400 text-lg">6.5</div>
                  <div className="text-xs text-[#94A3B8]">Promedio</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-[#1A1F2E] p-4 rounded-lg border border-[#2E3648]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#7AA7EC]/10 text-[#7AA7EC] rounded-lg"><BarChart3 size={20}/></div>
                  <div>
                    <div className="font-medium text-[#E2E8F0]">Física Mecánica</div>
                    <div className="text-xs text-[#94A3B8]">6 Créditos</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-400 text-lg">5.2</div>
                  <div className="text-xs text-[#94A3B8]">Promedio</div>
                </div>
              </div>
               <div className="flex justify-between items-center bg-[#1A1F2E] p-4 rounded-lg border border-[#2E3648] opacity-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#2E3648] text-[#94A3B8] rounded-lg"><Zap size={20}/></div>
                  <div className="h-4 w-24 bg-[#2E3648] rounded"></div>
                </div>
                <div className="h-8 w-12 bg-[#2E3648] rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="bg-[#242B3D]/50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas</h2>
            <p className="text-[#94A3B8] max-w-2xl mx-auto">
              Diseñado por estudiantes, para estudiantes. Herramientas potentes para que solo te preocupes de estudiar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Importación Mágica"
              description="Copia y pega tu portafolio académico y nuestro sistema detectará automáticamente tus ramos y notas."
            />
            <FeatureCard
              icon={<Calculator className="w-8 h-8 text-[#7AA7EC]" />}
              title="Cálculos Precisos"
              description="Configura ponderaciones personalizadas y obtén promedios exactos al instante. Sin errores manuales."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8 text-green-400" />}
              title="Siempre Seguro"
              description="Tus datos se guardan en la nube de forma segura. Accede desde tu celular o computador cuando quieras."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-br from-[#242B3D] to-[#1A1F2E] border border-[#7AA7EC]/30 rounded-3xl p-12 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#E2E8F0]">¿Listo para organizar tu semestre?</h2>
            <p className="text-[#94A3B8] mb-8 max-w-xl mx-auto">
              Únete a otros estudiantes que ya están gestionando sus notas de forma inteligente.
            </p>
            <Link to="/register" className="inline-block bg-[#7AA7EC] hover:bg-[#6A96DB] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors">
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-[#242B3D] p-8 rounded-2xl border border-[#2E3648] hover:border-[#7AA7EC]/50 transition-colors group">
      <div className="mb-6 p-4 bg-[#1A1F2E] rounded-xl inline-block group-hover:scale-110 transition-transform border border-[#2E3648]">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-[#E2E8F0]">{title}</h3>
      <p className="text-[#94A3B8] leading-relaxed">
        {description}
      </p>
    </div>
  )
}
