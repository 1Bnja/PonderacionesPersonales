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
  isToday,
  isPast
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Circle, Trash2, X, Edit2, Clock, BookOpen } from 'lucide-react'
import Toast from '../components/Toast'
import { getColorStyles } from '../components/ColorPicker'

export default function CalendarView() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [ramos, setRamos] = useState([])
  const [ramoColors, setRamoColors] = useState({})
  const [customTasks, setCustomTasks] = useState([]) // Tareas personalizadas
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' o 'list'

  // Form states para nueva tarea
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

      // Primero intentar con custom_tasks
      let { data, error } = await supabase
        .from('notas')
        .select('ramos, ramo_colors, custom_tasks')
        .eq('user_id', user.id)
        .single()

      // Si falla porque custom_tasks no existe, intentar sin ella
      if (error && error.code === '42703') {
        console.log('ℹ️ custom_tasks no existe, cargando sin ella')
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

  // Función para parsear fechas
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

  // Obtener todas las evaluaciones con fecha
  const getAllEvents = () => {
    const eventos = []
    
    // Debug: Ver cuántos ramos hay
    console.log('🔍 Ramos cargados:', ramos.length)
    
    // Evaluaciones de ramos
    ramos.forEach(ramo => {
      console.log('📚 Ramo:', ramo.nombre, 'Unidades:', ramo.unidades?.length)
      ramo.unidades?.forEach(unidad => {
        console.log('  📖 Unidad:', unidad.nombre, 'Evaluaciones:', unidad.evaluaciones?.length)
        unidad.evaluaciones?.forEach(evaluacion => {
          console.log('    📝 Evaluación:', evaluacion.nombre, 'Fecha:', evaluacion.fecha)
          if (evaluacion.fecha) {
            const fechaObj = parseFecha(evaluacion.fecha)
            console.log('      🗓️ Fecha parseada:', fechaObj)
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
                completed: evaluacion.nota !== null && evaluacion.nota !== undefined,
                peso: evaluacion.peso,
                nota: evaluacion.nota
              })
            }
          }
        })
      })
    })

    console.log('✅ Total eventos:', eventos.length)

    // Tareas personalizadas
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

  // Generar días del calendario
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }

  const calendarDays = generateCalendarDays()
  const allEvents = getAllEvents()

  // Eventos del día seleccionado
  const getEventsForDay = (day) => {
    return allEvents.filter(event => isSameDay(event.date, day))
  }

  // Guardar tareas personalizadas en Supabase
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
        // Si falla, mostrar advertencia al usuario
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

  // Agregar nueva tarea
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate) {
      setToast({ message: 'Complete título y fecha', type: 'error' })
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

  // Eliminar tarea personalizada
  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Eliminar esta tarea?')) return

    const updatedTasks = customTasks.filter(t => t.id !== taskId)
    setCustomTasks(updatedTasks)
    await saveCustomTasks(updatedTasks)
    setToast({ message: 'Tarea eliminada', type: 'info' })
  }

  // Marcar/desmarcar tarea como completada
  const toggleTaskCompletion = async (taskId) => {
    const updatedTasks = customTasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
    setCustomTasks(updatedTasks)
    await saveCustomTasks(updatedTasks)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
        <p>Cargando calendario...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver
          </button>

          <div className="flex items-center gap-4">
            {/* Toggle Vista */}
            <div className="bg-slate-800 rounded-lg p-1 flex gap-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Lista
              </button>
            </div>

            <button
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Tarea
            </button>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          Calendario y Tareas
        </h1>

        {viewMode === 'calendar' ? (
          <>
            {/* Navegación del mes */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl mb-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
                  <div key={dia} className="text-center text-sm font-semibold text-slate-400 py-2">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Días del calendario */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const eventsForDay = getEventsForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isCurrentDay = isToday(day)
                  const hasEvents = eventsForDay.length > 0

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDay(day)}
                      className={`
                        min-h-[80px] p-2 rounded-lg border transition-all
                        ${!isCurrentMonth ? 'opacity-30' : ''}
                        ${isCurrentDay ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'}
                        ${hasEvents ? 'bg-slate-700/50' : 'bg-slate-800/50'}
                        hover:bg-slate-700 hover:border-slate-600
                      `}
                    >
                      <div className="text-right mb-1">
                        <span className={`text-sm ${isCurrentDay ? 'font-bold text-blue-400' : 'text-slate-300'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      {hasEvents && (
                        <div className="space-y-1">
                          {eventsForDay.slice(0, 2).map((event, i) => (
                            <div
                              key={i}
                              className={`text-xs px-1.5 py-0.5 rounded truncate ${
                                event.type === 'evaluacion'
                                  ? getColorStyles(event.ramoColor).bg + ' ' + getColorStyles(event.ramoColor).text
                                  : 'bg-purple-600/80 text-white'
                              } ${event.completed ? 'line-through opacity-60' : ''}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {eventsForDay.length > 2 && (
                            <div className="text-xs text-slate-400 text-center">
                              +{eventsForDay.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Detalle del día seleccionado */}
            {selectedDay && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">
                    {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
                  </h3>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-1 hover:bg-slate-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <DayEvents
                  events={getEventsForDay(selectedDay)}
                  onDeleteTask={handleDeleteTask}
                  onToggleTask={toggleTaskCompletion}
                />
              </div>
            )}
          </>
        ) : (
          <ListView
            events={allEvents}
            onDeleteTask={handleDeleteTask}
            onToggleTask={toggleTaskCompletion}
          />
        )}
      </div>

      {/* Modal Agregar Tarea */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Nueva Tarea Personalizada</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Estudiar para prueba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha *</label>
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="3"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddTask}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para mostrar eventos de un día
function DayEvents({ events, onDeleteTask, onToggleTask }) {
  if (events.length === 0) {
    return <p className="text-slate-400 text-center py-4">No hay eventos este día</p>
  }

  return (
    <div className="space-y-3">
      {events.map(event => (
        <EventCard
          key={event.id}
          event={event}
          onDeleteTask={onDeleteTask}
          onToggleTask={onToggleTask}
        />
      ))}
    </div>
  )
}

// Tarjeta de evento
function EventCard({ event, onDeleteTask, onToggleTask }) {
  const isEvaluacion = event.type === 'evaluacion'
  const colorStyles = isEvaluacion ? getColorStyles(event.ramoColor) : null

  return (
    <div className={`p-4 rounded-lg border ${
      event.completed ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-700/50 border-slate-600'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isEvaluacion ? (
              <>
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className={`text-xs px-2 py-0.5 rounded ${colorStyles.bg} ${colorStyles.text}`}>
                  {event.ramoNombre}
                </span>
              </>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-600/80 text-white">
                Tarea Personal
              </span>
            )}
          </div>

          <h4 className={`font-semibold mb-1 ${event.completed ? 'line-through text-slate-400' : 'text-white'}`}>
            {event.title}
          </h4>

          {isEvaluacion && (
            <div className="text-sm text-slate-400 space-y-1">
              <p>Unidad: {event.unidadNombre}</p>
              <p>Peso: {event.peso}%</p>
              {event.nota !== null && event.nota !== undefined && (
                <p className="text-green-400">Nota: {event.nota}</p>
              )}
            </div>
          )}

          {!isEvaluacion && event.description && (
            <p className="text-sm text-slate-400 mt-1">{event.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!isEvaluacion && (
            <>
              <button
                onClick={() => onToggleTask(event.id)}
                className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                title={event.completed ? 'Marcar pendiente' : 'Marcar completada'}
              >
                {event.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400" />
                )}
              </button>
              <button
                onClick={() => onDeleteTask(event.id)}
                className="p-1.5 hover:bg-red-600 rounded transition-colors text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {isEvaluacion && event.completed && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
        </div>
      </div>
    </div>
  )
}

// Vista de lista
function ListView({ events, onDeleteTask, onToggleTask }) {
  const today = new Date()
  const futureEvents = events.filter(e => e.date >= today)
  const pastEvents = events.filter(e => e.date < today)

  return (
    <div className="space-y-6">
      {/* Próximos */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Próximas ({futureEvents.length})
        </h3>
        {futureEvents.length > 0 ? (
          <div className="space-y-3">
            {futureEvents.map(event => (
              <div key={event.id} className="flex flex-col gap-2">
                <p className="text-xs text-slate-400">
                  {format(event.date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <EventCard event={event} onDeleteTask={onDeleteTask} onToggleTask={onToggleTask} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-4">No hay eventos próximos</p>
        )}
      </div>

      {/* Pasados */}
      {pastEvents.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-slate-400">
            Pasados ({pastEvents.length})
          </h3>
          <div className="space-y-3">
            {pastEvents.slice(0, 10).map(event => (
              <div key={event.id} className="flex flex-col gap-2 opacity-60">
                <p className="text-xs text-slate-500">
                  {format(event.date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <EventCard event={event} onDeleteTask={onDeleteTask} onToggleTask={onToggleTask} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
