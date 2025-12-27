import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedGridPattern from '../components/AnimatedGridPattern'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1A1F2E] text-[#E2E8F0] flex flex-col relative overflow-hidden">

      {/* Animated Grid Background */}
      <AnimatedGridPattern />

      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-[#7AA7EC]">
          <img src="/logo.svg" alt="Modo azul" className="w-8 h-8" />
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
      <header className="flex-1 flex items-center justify-center relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl lg:text-7xl font-extrabold leading-tight bg-gradient-to-r from-[#7AA7EC] to-[#9BC7F0] bg-clip-text text-transparent">
                Tus notas,<br />bajo control.
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-[#94A3B8] leading-relaxed max-w-2xl mx-auto"
            >
              Gestiona tus ramos, calcula tus promedios y proyecta tu semestre académico en una plataforma simple y moderna.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            >
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 bg-[#7AA7EC] hover:bg-[#6A96DB] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Comenzar Gratis <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 bg-[#242B3D] hover:bg-[#2A3142] text-[#E2E8F0] px-8 py-4 rounded-xl font-bold text-lg transition-all border border-[#2E3648]"
              >
                Ya tengo cuenta
              </Link>
            </motion.div>

          </div>
        </div>
      </header>

    </div>
  )
}
