import { format, parseISO, isValid, isPast, isFuture, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { getColorStyles } from './ColorPicker'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

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
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
              Proximas evaluaciones
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onNavigateToCalendar}>
              Ver calendario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            No hay evaluaciones con fecha registradas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            Proximas evaluaciones
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigateToCalendar}>
            Ver calendario
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {evaluacionesPasadas.length > 0 && (
          <div className="space-y-2">
            <h3 className="flex items-center gap-1 text-sm font-semibold text-red-300">
              <AlertCircle className="h-4 w-4" />
              Atrasadas ({evaluacionesPasadas.length})
            </h3>
            <div className="space-y-2">
              {evaluacionesPasadas.map((evaluacion) => (
                <TaskItem key={evaluacion.id} evaluacion={evaluacion} isPast />
              ))}
            </div>
          </div>
        )}

        {proximasEvaluaciones.length > 0 ? (
          <div className="space-y-2">
            {proximasEvaluaciones.map((evaluacion) => (
              <TaskItem key={evaluacion.id} evaluacion={evaluacion} isPast={false} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
            No hay evaluaciones proximas.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function TaskItem({ evaluacion, isPast }) {
  const colorStyles = getColorStyles(evaluacion.ramoColor)
  const hoy = isToday(evaluacion.fechaObj)
  
  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        isPast
          ? 'border-red-500/30 bg-red-500/10'
          : hoy
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-[var(--color-border)] bg-[var(--color-background)]/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colorStyles.bg }}
              title={evaluacion.ramoNombre}
            />
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {evaluacion.ramoNombre}
            </p>
          </div>
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">
            {evaluacion.nombre}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-[var(--color-text-muted)]" />
            <p className={`text-xs ${
              isPast
                ? 'font-semibold text-red-300'
                : hoy
                ? 'font-semibold text-amber-300'
                : 'text-[var(--color-text-muted)]'
            }`}>
              {hoy ? 'Hoy' : format(evaluacion.fechaObj, "dd 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {evaluacion.pendiente ? (
            <Badge variant="warning" className="text-[11px]">
              Pendiente
            </Badge>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          )}
        </div>
      </div>
    </div>
  )
}
