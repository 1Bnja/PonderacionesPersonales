import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isValid,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Circle, Trash2, X, Clock, BookOpen, List } from 'lucide-react'
import Toast from '../components/Toast'
import { getColorStyles } from '../components/ColorPicker'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'

export default function CalendarView() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [ramos, setRamos] = useState([])
  const [ramoColors, setRamoColors] = useState({})
  const [customTasks, setCustomTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [viewMode, setViewMode] = useState('calendar')

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')

      let { data, error } = await supabase
        .from('notas')
        .select('ramos, ramo_colors, custom_tasks')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === '42703') {
        const response = await supabase
          .from('notas')
          .select('ramos, ramo_colors')
          .eq('user_id', user.id)
          .single()
        
        data = response.data
        error = response.error
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error al cargar datos:', error)
      }

      if (data) {
        setRamos(data.ramos || [])
        setRamoColors(data.ramo_colors || {})
        setCustomTasks(data.custom_tasks || [])
      }
    } catch (error) {
      console.error('Error en fetchData:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseFecha = (fechaStr) => {
    if (!fechaStr) return null

    try {
      let fecha = parseISO(fechaStr)
      if (isValid(fecha)) return fecha

      const partes = fechaStr.split(/[/-]/)
      if (partes.length === 3) {
        if (partes[0].length === 4) {
          const [anio, mes, dia] = partes
          fecha = new Date(anio, mes - 1, dia)
        } else {
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

  const getAllEvents = () => {
    const eventos = []

    ramos.forEach(ramo => {
      ramo.unidades?.forEach(unidad => {
        unidad.evaluaciones?.forEach(evaluacion => {
          if (evaluacion.fecha) {
            const fechaObj = parseFecha(evaluacion.fecha)
            if (fechaObj) {
              eventos.push({
                id: evaluacion.id,
                type: 'evaluacion',
                title: evaluacion.nombre,
                date: fechaObj,
                dateStr: evaluacion.fecha,
                ramoNombre: ramo.nombre,
                ramoId: ramo.id,
                ramoColor: ramoColors[ramo.id] || 'Azul',
                unidadNombre: unidad.nombre,
                completed: evaluacion.completada || (evaluacion.nota !== null && evaluacion.nota !== undefined),
                peso: evaluacion.peso,
                nota: evaluacion.nota
              })
            }
          }
        })
      })
    })

    customTasks.forEach(task => {
      const fechaObj = parseFecha(task.date)
      if (fechaObj) {
        eventos.push({
          id: task.id,
          type: 'custom',
          title: task.title,
          date: fechaObj,
          dateStr: task.date,
          description: task.description,
          completed: task.completed || false
        })
      }
    })

    return eventos.sort((a, b) => a.date - b.date)
  }

  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }

  const calendarDays = generateCalendarDays()
  const allEvents = getAllEvents()

  const getEventsForDay = (day) => {
    return allEvents.filter(event => isSameDay(event.date, day))
  }

  const saveCustomTasks = async (tasks) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notas')
        .update({ custom_tasks: tasks })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error guardando custom_tasks:', error)
        if (error.code === '42703') {
          setToast({
            message: 'Para usar tareas personalizadas, agrega la columna custom_tasks en Supabase',
            type: 'error'
          })
        }
      }
    } catch (error) {
      console.error('Error en saveCustomTasks:', error)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate) {
      setToast({ message: 'Completa titulo y fecha', type: 'error' })
      return
    }

    const newTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      date: newTaskDate,
      description: newTaskDescription.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }

    const updatedTasks = [...customTasks, newTask]
    setCustomTasks(updatedTasks)
    await saveCustomTasks(updatedTasks)

    setToast({ message: 'Tarea agregada', type: 'success' })
    setShowAddTaskModal(false)
    setNewTaskTitle('')
    setNewTaskDate('')
    setNewTaskDescription('')
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Eliminar esta tarea?')) return

    const updatedTasks = customTasks.filter(t => t.id !== taskId)
    setCustomTasks(updatedTasks)
    await saveCustomTasks(updatedTasks)
    setToast({ message: 'Tarea eliminada', type: 'info' })
  }

  const toggleTaskCompletion = async (taskId) => {
    const updatedTasks = customTasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
    setCustomTasks(updatedTasks)
    await saveCustomTasks(updatedTasks)
  }

  const toggleEvaluacionCompletion = async (ramoId, evaluacionId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ramosActualizados = ramos.map(ramo => {
        if (ramo.id === ramoId) {
          return {
            ...ramo,
            unidades: ramo.unidades.map(unidad => ({
              ...unidad,
              evaluaciones: unidad.evaluaciones.map(evaluacion => {
                if (evaluacion.id === evaluacionId) {
                  return {
                    ...evaluacion,
                    completada: !evaluacion.completada
                  }
                }
                return evaluacion
              })
            }))
          }
        }
        return ramo
      })

      await supabase
        .from('notas')
        .update({ ramos: ramosActualizados })
        .eq('user_id', user.id)

      setRamos(ramosActualizados)
      setToast({ message: 'Estado actualizado', type: 'success' })
    } catch (error) {
      console.error('Error al marcar evaluación:', error)
      setToast({ message: 'Error al actualizar', type: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center text-[var(--color-text-muted)]">
            Cargando calendario...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 text-[var(--color-text)] md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="gap-2 px-0 text-[var(--color-text-muted)] hover:bg-transparent hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-5 w-5" /> Volver
          </Button>

          <Button onClick={() => setShowAddTaskModal(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva tarea
          </Button>
        </div>

        <h1 className="mb-8 text-center text-3xl font-bold text-gradient-brand md:text-4xl">Calendario y tareas</h1>

        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList className="mb-4">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" /> Calendario
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" /> Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <CardTitle className="text-center text-2xl capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                  </CardTitle>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-2 grid grid-cols-7 gap-2">
                  {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(dia => (
                    <div key={dia} className="py-2 text-center text-sm font-semibold text-[var(--color-text-muted)]">
                      {dia}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const eventsForDay = getEventsForDay(day)
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isCurrentDay = isToday(day)
                    const hasEvents = eventsForDay.length > 0

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDay(day)}
                        className={`min-h-[84px] rounded-xl border p-2 text-left transition-all ${
                          !isCurrentMonth ? 'opacity-30' : ''
                        } ${
                          isCurrentDay
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                            : 'border-[var(--color-border)] bg-[var(--color-background)]/45'
                        } hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-surface-soft)]/70`}
                      >
                        <div className="mb-1 text-right">
                          <span className={`text-sm ${isCurrentDay ? 'font-bold text-[var(--color-primary)]' : 'text-[var(--color-text)]'} `}>
                            {format(day, 'd')}
                          </span>
                        </div>

                        {hasEvents && (
                          <div className="space-y-1">
                            {eventsForDay.slice(0, 2).map((event) => {
                              const color = event.type === 'evaluacion' ? getColorStyles(event.ramoColor) : null
                              return (
                                <div
                                  key={event.id}
                                  className={`truncate rounded px-1.5 py-0.5 text-[11px] ${event.completed ? 'opacity-60 line-through' : ''}`}
                                  style={
                                    event.type === 'evaluacion'
                                      ? { backgroundColor: color.bg, color: '#10203A' }
                                      : { backgroundColor: 'rgba(155, 199, 240, 0.2)', color: '#E2E8F0' }
                                  }
                                >
                                  {event.title}
                                </div>
                              )
                            })}
                            {eventsForDay.length > 2 && (
                              <div className="text-center text-xs text-[var(--color-text-muted)]">
                                +{eventsForDay.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {selectedDay && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="capitalize">
                      {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DayEvents
                    events={getEventsForDay(selectedDay)}
                    onDeleteTask={handleDeleteTask}
                    onToggleTask={toggleTaskCompletion}
                    onToggleEvaluacion={toggleEvaluacionCompletion}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="list">
            <ListView
              events={allEvents}
              onDeleteTask={handleDeleteTask}
              onToggleTask={toggleTaskCompletion}
              onToggleEvaluacion={toggleEvaluacionCompletion}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddTaskModal} onOpenChange={setShowAddTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva tarea personalizada</DialogTitle>
            <DialogDescription>Agrega una tarea para verla junto al calendario academico.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Titulo</Label>
              <Input
                id="task-title"
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ej: Estudiar para prueba"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-date">Fecha</Label>
              <Input
                id="task-date"
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Descripcion (opcional)</Label>
              <Textarea
                id="task-description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
                className="resize-none"
                placeholder="Detalles adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAddTaskModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTask}>Agregar tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DayEvents({ events, onDeleteTask, onToggleTask, onToggleEvaluacion }) {
  if (events.length === 0) {
    return <p className="py-4 text-center text-[var(--color-text-muted)]">No hay eventos este dia.</p>
  }

  return (
    <div className="space-y-3">
      {events.map(event => (
        <EventCard
          key={event.id}
          event={event}
          onDeleteTask={onDeleteTask}
          onToggleTask={onToggleTask}
          onToggleEvaluacion={onToggleEvaluacion}
        />
      ))}
    </div>
  )
}

function EventCard({ event, onDeleteTask, onToggleTask, onToggleEvaluacion }) {
  const isEvaluacion = event.type === 'evaluacion'
  const colorStyles = isEvaluacion ? getColorStyles(event.ramoColor) : null

  return (
    <div className={`rounded-xl border p-4 ${
      event.completed
        ? 'border-[var(--color-border)] bg-[var(--color-background)]/45'
        : 'border-[var(--color-border)] bg-[var(--color-surface-soft)]/35'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isEvaluacion ? (
              <>
                <BookOpen className="h-4 w-4 text-[var(--color-primary)]" />
                <span
                  className="rounded px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: colorStyles.bg, color: '#10203A' }}
                >
                  {event.ramoNombre}
                </span>
              </>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Tarea Personal
              </Badge>
            )}
          </div>

          <h4 className={`mb-1 font-semibold ${event.completed ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text)]'}`}>
            {event.title}
          </h4>

          {isEvaluacion && (
            <div className="space-y-1 text-sm text-[var(--color-text-muted)]">
              <p>Unidad: {event.unidadNombre}</p>
              <p>Peso: {event.peso}%</p>
              {event.nota !== null && event.nota !== undefined && (
                <p className="text-green-300">Nota: {event.nota}</p>
              )}
            </div>
          )}

          {!isEvaluacion && event.description && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{event.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => isEvaluacion ? onToggleEvaluacion(event.ramoId, event.id) : onToggleTask(event.id)}
            variant="ghost"
            size="icon"
            title={event.completed ? 'Marcar pendiente' : 'Marcar completada'}
          >
            {event.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <Circle className="h-5 w-5 text-[var(--color-text-muted)]" />
            )}
          </Button>
          {!isEvaluacion && (
            <Button
              onClick={() => onDeleteTask(event.id)}
              variant="ghost"
              size="icon"
              className="text-red-300 hover:text-red-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ListView({ events, onDeleteTask, onToggleTask, onToggleEvaluacion }) {
  const today = new Date()
  const futureEvents = events.filter(e => e.date >= today)
  const pastEvents = events.filter(e => e.date < today)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-[var(--color-primary)]" />
          Próximas ({futureEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
        {futureEvents.length > 0 ? (
          <div className="space-y-3">
            {futureEvents.map(event => (
              <div key={event.id} className="flex flex-col gap-2">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {format(event.date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <EventCard
                  event={event}
                  onDeleteTask={onDeleteTask}
                  onToggleTask={onToggleTask}
                  onToggleEvaluacion={onToggleEvaluacion}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-[var(--color-text-muted)]">No hay eventos proximos.</p>
        )}
        </CardContent>
      </Card>

      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-[var(--color-text-muted)]">
            Pasados ({pastEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-3">
            {pastEvents.slice(0, 10).map(event => (
              <div key={event.id} className="flex flex-col gap-2 opacity-60">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {format(event.date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <EventCard
                  event={event}
                  onDeleteTask={onDeleteTask}
                  onToggleTask={onToggleTask}
                  onToggleEvaluacion={onToggleEvaluacion}
                />
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
