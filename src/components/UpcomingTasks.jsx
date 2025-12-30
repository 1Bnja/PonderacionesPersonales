import { format, parseISO, isValid, isPast, isFuture, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { getColorStyles } from './ColorPicker'

export default function UpcomingTasks({ ramos, ramoColors, onNavigateToCalendar }) {
  // Recopilar todas las evaluaciones con fecha
  const todasLasEvaluaciones = []
  
  ramos.forEach(ramo => {
    ramo.unidades?.forEach(unidad => {
      unidad.evaluaciones?.forEach(evaluacion => {
        if (evaluacion.fecha) {
          todasLasEvaluaciones.push({
            ...evaluacion,
            ramoNombre: ramo.nombre,
            ramoId: ramo.id,
            ramoColor: ramoColors[ramo.id] || 'Azul',
            unidadNombre: unidad.nombre,
            pendiente: evaluacion.nota === null || evaluacion.nota === undefined
          })
        }
      })
    })
  })

  // Función para parsear fechas en múltiples formatos
  const parseFecha = (fechaStr) => {
    if (!fechaStr) return null
    
    try {
      // Intentar formato ISO primero (YYYY-MM-DD)
      let fecha = parseISO(fechaStr)
      if (isValid(fecha)) return fecha
      
      // Intentar formato DD/MM/YYYY o DD-MM-YYYY
      const partes = fechaStr.split(/[/-]/)
      if (partes.length === 3) {
        // Detectar si es DD/MM/YYYY o YYYY-MM-DD
        if (partes[0].length === 4) {
          // Formato YYYY-MM-DD o YYYY/MM/DD
          const [anio, mes, dia] = partes
          fecha = new Date(anio, mes - 1, dia)
        } else {
          // Formato DD/MM/YYYY o DD-MM-YYYY
          const [dia, mes, anio] = partes
          const anioCompleto = anio.length === 2 ? '20' + anio : anio
          fecha = new Date(anioCompleto, mes - 1, dia)
        }
        if (isValid(fecha)) return fecha
      }
    } catch (error) {
      console.error('Error parseando fecha:', fechaStr, error)
    }
    
    return null
  }

  // Filtrar y ordenar evaluaciones
  const evaluacionesConFecha = todasLasEvaluaciones
    .map(evaluacion => ({
      ...evaluacion,
      fechaObj: parseFecha(evaluacion.fecha)
    }))
    .filter(evaluacion => evaluacion.fechaObj !== null)
    .sort((a, b) => a.fechaObj - b.fechaObj)

  // Separar en futuras y pasadas
  const proximasEvaluaciones = evaluacionesConFecha
    .filter(evaluacion => isFuture(evaluacion.fechaObj) || isToday(evaluacion.fechaObj))
    .slice(0, 5) // Mostrar solo las próximas 5

  const evaluacionesPasadas = evaluacionesConFecha
    .filter(evaluacion => isPast(evaluacion.fechaObj) && !isToday(evaluacion.fechaObj) && evaluacion.pendiente)
    .slice(0, 3) // Mostrar solo 3 atrasadas

  if (evaluacionesConFecha.length === 0) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Próximas Evaluaciones
          </h2>
          <button
            onClick={onNavigateToCalendar}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ver Calendario →
          </button>
        </div>
        <p className="text-slate-400 text-center py-8">
          No hay evaluaciones con fecha registradas
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Próximas Evaluaciones
        </h2>
        <button
          onClick={onNavigateToCalendar}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Ver Calendario →
        </button>
      </div>

      {/* Evaluaciones Atrasadas */}
      {evaluacionesPasadas.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Atrasadas ({evaluacionesPasadas.length})
          </h3>
          <div className="space-y-2">
            {evaluacionesPasadas.map((evaluacion, idx) => (
              <TaskItem key={`past-${idx}`} evaluacion={evaluacion} isPast={true} />
            ))}
          </div>
        </div>
      )}

      {/* Próximas Evaluaciones */}
      {proximasEvaluaciones.length > 0 ? (
        <div className="space-y-2">
          {proximasEvaluaciones.map((evaluacion, idx) => (
            <TaskItem key={`upcoming-${idx}`} evaluacion={evaluacion} isPast={false} />
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-center py-4 text-sm">
          No hay evaluaciones próximas
        </p>
      )}
    </div>
  )
}

function TaskItem({ evaluacion, isPast }) {
  const colorStyles = getColorStyles(evaluacion.ramoColor)
  const hoy = isToday(evaluacion.fechaObj)
  
  return (
    <div 
      className={`p-3 rounded-lg border transition-all ${
        isPast 
          ? 'bg-red-900/20 border-red-500/30' 
          : hoy
          ? 'bg-yellow-900/20 border-yellow-500/50'
          : 'bg-slate-700/50 border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className={`w-2 h-2 rounded-full ${colorStyles.bg}`}
              title={evaluacion.ramoNombre}
            />
            <p className="text-xs text-slate-400 truncate">
              {evaluacion.ramoNombre}
            </p>
          </div>
          <p className="font-medium text-white text-sm truncate">
            {evaluacion.nombre}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <p className={`text-xs ${
              isPast ? 'text-red-400 font-semibold' : 
              hoy ? 'text-yellow-400 font-semibold' : 
              'text-slate-500'
            }`}>
              {hoy ? 'Hoy' : format(evaluacion.fechaObj, "dd 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {evaluacion.pendiente ? (
            <span className="text-xs px-2 py-1 rounded bg-orange-900/30 text-orange-400 border border-orange-500/30">
              Pendiente
            </span>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
        </div>
      </div>
    </div>
  )
}
