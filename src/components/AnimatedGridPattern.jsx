import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function AnimatedGridPattern() {
  const [squares, setSquares] = useState([])

  // Generar cuadros aleatorios que se iluminarán
  useEffect(() => {
    const generateSquares = () => {
      const newSquares = []
      const numSquares = 50 // Número de cuadros que se animarán

      for (let i = 0; i < numSquares; i++) {
        newSquares.push({
          id: i,
          x: Math.floor(Math.random() * 30), // Columna aleatoria (0-29)
          y: Math.floor(Math.random() * 30), // Fila aleatoria (0-29)
          delay: Math.random() * 3, // Delay aleatorio entre 0-3s
          duration: 2 + Math.random() * 2, // Duración entre 2-4s
        })
      }

      setSquares(newSquares)
    }

    generateSquares()
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none skew-y-12 opacity-70">
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
      <div className="absolute inset-0">
        {squares.map((square) => (
          <motion.div
            key={square.id}
            className="absolute w-10 h-10 border border-[#7AA7EC]"
            style={{
              left: `${square.x * 40}px`,
              top: `${square.y * 40}px`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.8, 1, 0.8],
              backgroundColor: ['rgba(122, 167, 236, 0)', 'rgba(122, 167, 236, 0.2)', 'rgba(122, 167, 236, 0)'],
            }}
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
