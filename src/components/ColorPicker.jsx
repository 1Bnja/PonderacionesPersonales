import React from 'react'
import { Check } from 'lucide-react'

// Paleta de colores pasteles oscuros que combinan con el tema
export const COLOR_PALETTE = [
  { name: 'Azul', bg: '#7AA7EC', border: '#6A96DB', light: '#7AA7EC20' },      // Color original
  { name: 'Celeste', bg: '#9BC7F0', border: '#8BB7E0', light: '#9BC7F020' },   // Accent original
  { name: 'Lavanda', bg: '#B4A7F0', border: '#A497E0', light: '#B4A7F020' },
  { name: 'Rosa', bg: '#F0A7D8', border: '#E097C8', light: '#F0A7D820' },
  { name: 'Coral', bg: '#F0B4A7', border: '#E0A497', light: '#F0B4A720' },
  { name: 'Melocotón', bg: '#F0D4A7', border: '#E0C497', light: '#F0D4A720' },
  { name: 'Verde', bg: '#A7F0B4', border: '#97E0A4', light: '#A7F0B420' },
  { name: 'Menta', bg: '#A7F0E4', border: '#97E0D4', light: '#A7F0E420' },
  { name: 'Turquesa', bg: '#A7D8F0', border: '#97C8E0', light: '#A7D8F020' },
  { name: 'Lila', bg: '#D4A7F0', border: '#C497E0', light: '#D4A7F020' },
  { name: 'Amarillo', bg: '#F0ECA7', border: '#E0DC97', light: '#F0ECA720' },
  { name: 'Gris', bg: '#A7B4C0', border: '#97A4B0', light: '#A7B4C020' },
]

export default function ColorPicker({ selectedColor, onSelectColor, label = "Color" }) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="grid grid-cols-6 gap-2">
        {COLOR_PALETTE.map((color) => {
          const isSelected = selectedColor === color.name
          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onSelectColor(color.name)}
              className={`
                relative w-10 h-10 rounded-lg transition-all duration-200
                hover:scale-110 hover:shadow-lg
                ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[#242B3D] scale-110' : 'hover:ring-1 hover:ring-offset-1 hover:ring-offset-[#242B3D]'}
              `}
              style={{
                backgroundColor: color.bg,
                ringColor: color.border
              }}
              title={color.name}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white drop-shadow-lg" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
      {selectedColor && (
        <p className="text-xs text-[#7AA7EC] font-medium">
          Seleccionado: {selectedColor}
        </p>
      )}
    </div>
  )
}

// Función helper para obtener los estilos de un color por nombre
export function getColorStyles(colorName) {
  const color = COLOR_PALETTE.find(c => c.name === colorName)
  return color || COLOR_PALETTE[0] // Default al primer color (Azul original)
}
