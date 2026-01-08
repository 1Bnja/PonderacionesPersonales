import { motion } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

export default function AnimatedGridPattern() {
  const [squares, setSquares] = useState([])

  // Generar cuadros aleatorios que se iluminarán
  useEffect(() => {
    const generateSquares = () => {
      const newSquares = []

      // Calcular cuántos cuadros caben en el viewport con margen extra por el skew
      const cols = Math.ceil(window.innerWidth / 40) + 15
      const rows = Math.ceil(window.innerHeight / 40) + 15

      // Reducir MUCHO el número de cuadros para mejor rendimiento (máximo 20)
      const numSquares = Math.min(20, Math.floor((cols * rows) / 30))

      for (let i = 0; i < numSquares; i++) {
        newSquares.push({
          id: i,
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
          delay: Math.random() * 3,
          duration: 2 + Math.random() * 2,
        })
      }

      setSquares(newSquares)
    }

    generateSquares()

    // Regenerar cuadros si cambia el tamaño de la ventana (con debounce más largo)
    let resizeTimeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(generateSquares, 500)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  // Configuración de animación compartida para evitar recrear objetos
  const animationConfig = useMemo(() => ({
    opacity: [0, 1, 0],
    scale: [0.8, 1, 0.8],
  }), [])

  const initialConfig = useMemo(() => ({
    opacity: 0,
    scale: 0.8
  }), [])

  return (
    <div className="absolute inset-0 -top-[20%] -bottom-[20%] overflow-hidden pointer-events-none skew-y-12 opacity-70">
      {/* Grid SVG de fondo */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#2E3648"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      {/* Cuadros animados que se iluminan */}
      <div className="absolute inset-0" style={{ transform: 'translate3d(0,0,0)' }}>
        {squares.map((square) => (
          <motion.div
            key={square.id}
            className="absolute w-10 h-10 border border-[#7AA7EC] bg-[#7AA7EC]/20"
            style={{
              left: `${square.x * 40}px`,
              top: `${square.y * 40}px`,
              transform: 'translate3d(0,0,0)',
            }}
            initial={initialConfig}
            animate={animationConfig}
            transition={{
              duration: square.duration,
              delay: square.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}
