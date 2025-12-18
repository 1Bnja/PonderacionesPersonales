import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Calculator, Calendar, GraduationCap, Edit2, Save, X } from 'lucide-react'
import Toast from '../components/Toast'
import { calcularEstadisticasRamo } from '../utils/gradeMath'

export default function RamoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ramo, setRamo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [editingEval, setEditingEval] = useState(null) // { unidadIdx, evalIdx }
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    fetchRamo()
  }, [])

  const fetchRamo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate('/login')

    const { data } = await supabase
      .from('notas')
      .select('ramos')
      .eq('user_id', user.id)
      .single()

    if (data && data.ramos) {
        const ramoEncontrado = data.ramos.find(r => r.id === id)
        if (ramoEncontrado) {
            setRamo(ramoEncontrado)
        } else {
            setToast({ message: "Ramo no encontrado", type: "error" })
            setTimeout(() => navigate('/dashboard'), 2000)
        }
    }
    setLoading(false)
  }

  const startEditing = (unidadIdx, evalIdx, currentNota) => {
    setEditingEval({ unidadIdx, evalIdx })
    setEditValue(currentNota !== null ? String(currentNota) : '')
  }

  const cancelEditing = () => {
    setEditingEval(null)
    setEditValue('')
  }

  const saveNota = async (unidadIdx, evalIdx) => {
    const notaNum = parseFloat(editValue)

    if (editValue !== '' && (isNaN(notaNum) || notaNum < 1.0 || notaNum > 7.0)) {
      setToast({ message: "Nota debe estar entre 1.0 y 7.0", type: "error" })
      return
    }

    // Actualizar el ramo localmente
    const ramoActualizado = { ...ramo }
    ramoActualizado.unidades[unidadIdx].evaluaciones[evalIdx].nota = editValue === '' ? null : notaNum

    // Recalcular estadísticas
    const ramoConEstadisticas = calcularEstadisticasRamo(ramoActualizado)
    setRamo(ramoConEstadisticas)

    // Guardar en Supabase
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notas')
      .select('ramos')
      .eq('user_id', user.id)
      .single()

    if (data && data.ramos) {
      const todosLosRamos = data.ramos.map(r =>
        r.id === id ? ramoConEstadisticas : r
      )

      await supabase
        .from('notas')
        .update({ ramos: todosLosRamos })
        .eq('user_id', user.id)

      setToast({ message: "Nota actualizada", type: "success" })
    }

    cancelEditing()
  }

  if (loading) return <div className="p-10 text-center text-white">Cargando detalles...</div>
  if (!ramo) return null

  const { estadisticas, unidades } = ramo
  const promedio = estadisticas.promedioActual
  const esAzul = promedio >= 4.0

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto">
        
        {/* BOTÓN VOLVER */}
        <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
            <ArrowLeft className="w-5 h-5" /> Volver al Dashboard
        </button>

        {/* ENCABEZADO DEL RAMO */}
        <div className="bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-700 shadow-2xl mb-8 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10 ${esAzul ? 'bg-green-500' : 'bg-red-500'}`}></div>
            
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{ramo.nombre}</h1>
            <div className="flex items-center gap-2 text-slate-400 mb-6">
                <GraduationCap className="w-5 h-5" />
                <span>{ramo.semestre || 'Semestre General'}</span>
            </div>

            <div className="flex gap-8">
                <div>
                    <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Promedio Actual</span>
                    <span className={`text-5xl font-bold ${esAzul ? 'text-green-400' : 'text-red-400'}`}>
                        {promedio.toFixed(1)}
                    </span>
                </div>
                <div>
                    <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Estado</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${esAzul ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {estadisticas.estado}
                    </span>
                </div>
            </div>
        </div>

        {/* LISTA DE UNIDADES */}
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-300 px-2">Desglose de Notas</h3>
            
            {unidades.map((unidad, index) => (
                <div key={index} className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                    {/* Header de la Unidad */}
                    <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                        <div>
                            <h4 className="font-bold text-white">{unidad.nombre}</h4>
                            <span className="text-xs text-slate-400">Ponderación: {unidad.peso}% del ramo</span>
                        </div>
                        <div className="text-right">
                             {/* Mostramos el promedio de la unidad si tiene notas */}
                             {unidad.progreso > 0 ? (
                                <span className="text-xl font-bold text-slate-200">{unidad.promedioActual}</span>
                             ) : (
                                <span className="text-xs text-slate-500">Sin notas</span>
                             )}
                        </div>
                    </div>

                    {/* Lista de Evaluaciones */}
                    <div className="divide-y divide-slate-700/50">
                        {unidad.evaluaciones.map((eva, evalIdx) => {
                            const isEditing = editingEval?.unidadIdx === index && editingEval?.evalIdx === evalIdx

                            return (
                                <div key={evalIdx} className="p-4 flex justify-between items-center hover:bg-slate-700/30 transition-colors group">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-slate-700 p-2 rounded-lg mt-1">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-200">{eva.nombre || "Evaluación"}</p>
                                            <p className="text-xs text-slate-500">{eva.fecha}</p>
                                        </div>
                                    </div>

                                    <div className="text-right flex items-center gap-3">
                                        <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">{eva.peso}%</span>

                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="1.0"
                                                    max="7.0"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveNota(index, evalIdx)
                                                        if (e.key === 'Escape') cancelEditing()
                                                    }}
                                                    className="w-16 bg-slate-900 border border-blue-500 rounded px-2 py-1 text-center text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveNota(index, evalIdx)}
                                                    className="p-1 hover:bg-green-600 rounded text-green-400 hover:text-white transition-colors"
                                                    title="Guardar"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="p-1 hover:bg-red-600 rounded text-red-400 hover:text-white transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {eva.nota ? (
                                                    <span className={`text-lg font-bold w-12 text-center ${eva.nota >= 4.0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {eva.nota}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-600 italic w-12 text-center">--</span>
                                                )}
                                                <button
                                                    onClick={() => startEditing(index, evalIdx, eva.nota)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-600 rounded text-slate-400 hover:text-white transition-all"
                                                    title="Editar nota"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  )
}