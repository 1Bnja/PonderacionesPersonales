import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, GraduationCap, Edit2, Save, X, Trash2, Plus, Check } from 'lucide-react'
import Toast from '../components/Toast'
import { calcularEstadisticasRamo } from '../utils/gradeMath'

export default function RamoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ramo, setRamo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [editingEval, setEditingEval] = useState(null) // { unidadIdx, evalIdx, field }
  const [editingUnidad, setEditingUnidad] = useState(null) // { unidadIdx, field }
  const [editingRamo, setEditingRamo] = useState(null) // 'nombre'
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

  // ============================================
  // FUNCIONES DE GUARDADO EN LA NUBE
  // ============================================
  const saveRamoToCloud = async (ramoActualizado) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notas')
      .select('ramos')
      .eq('user_id', user.id)
      .single()

    if (data && data.ramos) {
      const todosLosRamos = data.ramos.map(r =>
        r.id === id ? ramoActualizado : r
      )

      await supabase
        .from('notas')
        .update({ ramos: todosLosRamos })
        .eq('user_id', user.id)
    }
  }

  // ============================================
  // EDICIÓN DE EVALUACIONES
  // ============================================
  const startEditingEval = (unidadIdx, evalIdx, field, currentValue) => {
    setEditingEval({ unidadIdx, evalIdx, field })
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '')
  }

  const cancelEditingEval = () => {
    setEditingEval(null)
    setEditValue('')
  }

  const saveEvalField = async (unidadIdx, evalIdx, field) => {
    let valor = editValue

    // Validaciones por campo
    if (field === 'nota') {
      if (editValue === '') {
        valor = null
      } else {
        const notaNum = parseFloat(editValue)
        if (isNaN(notaNum) || notaNum < 1.0 || notaNum > 7.0) {
          setToast({ message: "Nota debe estar entre 1.0 y 7.0", type: "error" })
          return
        }
        valor = notaNum
      }
    } else if (field === 'peso') {
      const pesoNum = parseInt(editValue)
      if (isNaN(pesoNum) || pesoNum < 0 || pesoNum > 100) {
        setToast({ message: "Peso debe estar entre 0 y 100", type: "error" })
        return
      }
      valor = pesoNum
    } else if (field === 'fecha') {
      valor = editValue.trim()
    } else if (field === 'nombre') {
      valor = editValue.trim()
    }

    const ramoActualizado = { ...ramo }
    ramoActualizado.unidades[unidadIdx].evaluaciones[evalIdx][field] = valor

    const ramoConEstadisticas = calcularEstadisticasRamo(ramoActualizado)
    setRamo(ramoConEstadisticas)
    await saveRamoToCloud(ramoConEstadisticas)

    setToast({ message: "Actualizado", type: "success" })
    cancelEditingEval()
  }

  const deleteEvaluacion = async (unidadIdx, evalIdx) => {
    if (!confirm('¿Eliminar esta evaluación?')) return

    const ramoActualizado = { ...ramo }
    ramoActualizado.unidades[unidadIdx].evaluaciones.splice(evalIdx, 1)

    const ramoConEstadisticas = calcularEstadisticasRamo(ramoActualizado)
    setRamo(ramoConEstadisticas)
    await saveRamoToCloud(ramoConEstadisticas)

    setToast({ message: "Evaluación eliminada", type: "info" })
  }

  const addEvaluacion = async (unidadIdx) => {
    const ramoActualizado = { ...ramo }
    ramoActualizado.unidades[unidadIdx].evaluaciones.push({
      id: crypto.randomUUID(),
      nombre: "Nueva Evaluación",
      fecha: new Date().toLocaleDateString('es-CL'),
      peso: 0,
      nota: null
    })

    const ramoConEstadisticas = calcularEstadisticasRamo(ramoActualizado)
    setRamo(ramoConEstadisticas)
    await saveRamoToCloud(ramoConEstadisticas)

    setToast({ message: "Evaluación agregada", type: "success" })
  }

  // ============================================
  // EDICIÓN DE UNIDADES
  // ============================================
  const startEditingUnidad = (unidadIdx, field, currentValue) => {
    setEditingUnidad({ unidadIdx, field })
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '')
  }

  const cancelEditingUnidad = () => {
    setEditingUnidad(null)
    setEditValue('')
  }

  const saveUnidadField = async (unidadIdx, field) => {
    let valor = editValue

    if (field === 'peso') {
      const pesoNum = parseInt(editValue)
      if (isNaN(pesoNum) || pesoNum < 0 || pesoNum > 100) {
        setToast({ message: "Peso debe estar entre 0 y 100", type: "error" })
        return
      }
      valor = pesoNum
    }

    const ramoActualizado = { ...ramo }
    ramoActualizado.unidades[unidadIdx][field] = valor

    const ramoConEstadisticas = calcularEstadisticasRamo(ramoActualizado)
    setRamo(ramoConEstadisticas)
    await saveRamoToCloud(ramoConEstadisticas)

    setToast({ message: "Actualizado", type: "success" })
    cancelEditingUnidad()
  }

  const addUnidad = async () => {
    const ramoActualizado = { ...ramo }
    ramoActualizado.unidades.push({
      id: crypto.randomUUID(),
      nombre: "Nueva Unidad",
      peso: 0,
      evaluaciones: []
    })

    const ramoConEstadisticas = calcularEstadisticasRamo(ramoActualizado)
    setRamo(ramoConEstadisticas)
    await saveRamoToCloud(ramoConEstadisticas)

    setToast({ message: "Unidad agregada", type: "success" })
  }

  const deleteUnidad = async (unidadIdx) => {
    if (!confirm('¿Eliminar esta unidad y todas sus evaluaciones?')) return

    const ramoActualizado = { ...ramo }
    ramoActualizado.unidades.splice(unidadIdx, 1)

    const ramoConEstadisticas = calcularEstadisticasRamo(ramoActualizado)
    setRamo(ramoConEstadisticas)
    await saveRamoToCloud(ramoConEstadisticas)

    setToast({ message: "Unidad eliminada", type: "info" })
  }

  // ============================================
  // EDICIÓN DEL NOMBRE DEL RAMO
  // ============================================
  const startEditingRamo = (field, currentValue) => {
    setEditingRamo(field)
    setEditValue(currentValue || '')
  }

  const cancelEditingRamo = () => {
    setEditingRamo(null)
    setEditValue('')
  }

  const saveRamoField = async (field) => {
    if (!editValue.trim()) {
      setToast({ message: "El nombre no puede estar vacío", type: "error" })
      return
    }

    const ramoActualizado = { ...ramo, [field]: editValue.trim() }
    const ramoConEstadisticas = calcularEstadisticasRamo(ramoActualizado)
    setRamo(ramoConEstadisticas)
    await saveRamoToCloud(ramoConEstadisticas)

    setToast({ message: "Nombre actualizado", type: "success" })
    cancelEditingRamo()
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

            {editingRamo === 'nombre' ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRamoField('nombre')
                    if (e.key === 'Escape') cancelEditingRamo()
                  }}
                  className="flex-1 bg-slate-900 border border-blue-500 rounded-lg px-4 py-2 text-white text-2xl md:text-4xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <button onClick={() => saveRamoField('nombre')} className="p-2 hover:bg-green-600 rounded-lg text-green-400 hover:text-white">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={cancelEditingRamo} className="p-2 hover:bg-red-600 rounded-lg text-red-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => startEditingRamo('nombre', ramo.nombre)}
                className="cursor-pointer group/ramo-nombre mb-2 inline-flex items-center gap-2"
              >
                <h1 className="text-2xl md:text-4xl font-bold text-white">{ramo.nombre}</h1>
                <Edit2 className="w-5 h-5 text-slate-600 opacity-0 group-hover/ramo-nombre:opacity-100 transition-opacity" />
              </div>
            )}

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
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-bold text-slate-300">Desglose de Notas</h3>
              <button
                onClick={addUnidad}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Unidad
              </button>
            </div>

            {unidades.map((unidad, index) => (
                <div key={index} className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                    {/* Header de la Unidad */}
                    <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700 group">
                        <div className="flex-1">
                          {editingUnidad?.unidadIdx === index && editingUnidad?.field === 'nombre' ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveUnidadField(index, 'nombre')
                                  if (e.key === 'Escape') cancelEditingUnidad()
                                }}
                                className="flex-1 bg-slate-900 border border-blue-500 rounded px-2 py-1 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                              />
                              <button onClick={() => saveUnidadField(index, 'nombre')} className="p-1 hover:bg-green-600 rounded text-green-400 hover:text-white">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEditingUnidad(index, 'nombre', unidad.nombre)}
                              className="flex items-center gap-2 cursor-pointer group/nombre"
                            >
                              <h4 className="font-bold text-white">{unidad.nombre}</h4>
                              <Edit2 className="w-3 h-3 text-slate-600 opacity-0 group-hover/nombre:opacity-100 transition-opacity" />
                            </div>
                          )}

                          {editingUnidad?.unidadIdx === index && editingUnidad?.field === 'peso' ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveUnidadField(index, 'peso')
                                  if (e.key === 'Escape') cancelEditingUnidad()
                                }}
                                className="w-16 bg-slate-900 border border-blue-500 rounded px-2 py-0.5 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                              />
                              <span className="text-xs text-slate-400">% del ramo</span>
                              <button onClick={() => saveUnidadField(index, 'peso')} className="p-0.5 hover:bg-green-600 rounded text-green-400 hover:text-white">
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEditingUnidad(index, 'peso', unidad.peso)}
                              className="flex items-center gap-2 mt-1 cursor-pointer group/peso"
                            >
                              <span className="text-xs text-slate-400">Ponderación: {unidad.peso}% del ramo</span>
                              <Edit2 className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover/peso:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {unidad.progreso > 0 && (
                            <span className="text-xl font-bold text-slate-200">{unidad.promedioActual}</span>
                          )}
                          <button
                            onClick={() => deleteUnidad(index)}
                            className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar unidad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                    </div>

                    {/* Lista de Evaluaciones */}
                    <div className="divide-y divide-slate-700/50">
                        {unidad.evaluaciones.map((eva, evalIdx) => {
                            const isEditingNombre = editingEval?.unidadIdx === index && editingEval?.evalIdx === evalIdx && editingEval?.field === 'nombre'
                            const isEditingFecha = editingEval?.unidadIdx === index && editingEval?.evalIdx === evalIdx && editingEval?.field === 'fecha'
                            const isEditingPeso = editingEval?.unidadIdx === index && editingEval?.evalIdx === evalIdx && editingEval?.field === 'peso'
                            const isEditingNota = editingEval?.unidadIdx === index && editingEval?.evalIdx === evalIdx && editingEval?.field === 'nota'

                            return (
                                <div key={evalIdx} className="p-4 flex justify-between items-center hover:bg-slate-700/30 transition-colors group">
                                    <div className="flex-1 flex items-start gap-3">
                                        {isEditingNombre ? (
                                          <div className="flex-1 flex items-center gap-2">
                                            <input
                                              type="text"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEvalField(index, evalIdx, 'nombre')
                                                if (e.key === 'Escape') cancelEditingEval()
                                              }}
                                              className="flex-1 bg-slate-900 border border-blue-500 rounded px-2 py-1 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                              autoFocus
                                            />
                                            <button onClick={() => saveEvalField(index, evalIdx, 'nombre')} className="p-1 hover:bg-green-600 rounded text-green-400 hover:text-white">
                                              <Save className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={cancelEditingEval} className="p-1 hover:bg-red-600 rounded text-red-400 hover:text-white">
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex-1">
                                            <div
                                              onClick={() => startEditingEval(index, evalIdx, 'nombre', eva.nombre)}
                                              className="cursor-pointer group/nombre"
                                            >
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-200">{eva.nombre || "Evaluación"}</p>
                                                <Edit2 className="w-3 h-3 text-slate-600 opacity-0 group-hover/nombre:opacity-100 transition-opacity" />
                                              </div>
                                            </div>

                                            {isEditingFecha ? (
                                              <div className="flex items-center gap-2 mt-1">
                                                <input
                                                  type="text"
                                                  value={editValue}
                                                  onChange={(e) => setEditValue(e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEvalField(index, evalIdx, 'fecha')
                                                    if (e.key === 'Escape') cancelEditingEval()
                                                  }}
                                                  className="bg-slate-900 border border-blue-500 rounded px-2 py-0.5 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                  autoFocus
                                                  placeholder="dd/mm/yyyy"
                                                />
                                                <button onClick={() => saveEvalField(index, evalIdx, 'fecha')} className="p-0.5 hover:bg-green-600 rounded text-green-400 hover:text-white">
                                                  <Check className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ) : (
                                              <div
                                                onClick={() => startEditingEval(index, evalIdx, 'fecha', eva.fecha)}
                                                className="cursor-pointer group/fecha flex items-center gap-1 mt-1"
                                              >
                                                <p className="text-xs text-slate-500">{eva.fecha || 'Sin fecha'}</p>
                                                <Edit2 className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover/fecha:opacity-100 transition-opacity" />
                                              </div>
                                            )}
                                          </div>
                                        )}
                                    </div>

                                    <div className="text-right flex items-center gap-3">
                                        {isEditingPeso ? (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEvalField(index, evalIdx, 'peso')
                                                if (e.key === 'Escape') cancelEditingEval()
                                              }}
                                              className="w-14 bg-slate-900 border border-blue-500 rounded px-2 py-1 text-center text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                              autoFocus
                                            />
                                            <span className="text-xs text-slate-400">%</span>
                                            <button onClick={() => saveEvalField(index, evalIdx, 'peso')} className="p-0.5 hover:bg-green-600 rounded text-green-400 hover:text-white">
                                              <Save className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div
                                            onClick={() => startEditingEval(index, evalIdx, 'peso', eva.peso)}
                                            className="cursor-pointer group/peso px-2 py-1 rounded hover:bg-slate-800"
                                          >
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs font-mono text-slate-400">{eva.peso}%</span>
                                              <Edit2 className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover/peso:opacity-100 transition-opacity" />
                                            </div>
                                          </div>
                                        )}

                                        {isEditingNota ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="1.0"
                                                    max="7.0"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEvalField(index, evalIdx, 'nota')
                                                        if (e.key === 'Escape') cancelEditingEval()
                                                    }}
                                                    className="w-16 bg-slate-900 border border-blue-500 rounded px-2 py-1 text-center text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                    autoFocus
                                                    placeholder="--"
                                                />
                                                <button
                                                    onClick={() => saveEvalField(index, evalIdx, 'nota')}
                                                    className="p-1 hover:bg-green-600 rounded text-green-400 hover:text-white transition-colors"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={cancelEditingEval}
                                                    className="p-1 hover:bg-red-600 rounded text-red-400 hover:text-white transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                              onClick={() => startEditingEval(index, evalIdx, 'nota', eva.nota)}
                                              className="flex items-center gap-2 cursor-pointer group/nota px-2 py-1 rounded hover:bg-slate-800"
                                            >
                                                {eva.nota ? (
                                                    <span className={`text-lg font-bold w-12 text-center ${eva.nota >= 4.0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {eva.nota}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-600 italic w-12 text-center">--</span>
                                                )}
                                                <Edit2 className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover/nota:opacity-100 transition-opacity" />
                                            </div>
                                        )}

                                        <button
                                          onClick={() => deleteEvaluacion(index, evalIdx)}
                                          className="p-1 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Eliminar evaluación"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* BOTÓN AGREGAR EVALUACIÓN */}
                    <div className="p-3 border-t border-slate-700/50">
                      <button
                        onClick={() => addEvaluacion(index)}
                        className="w-full border border-dashed border-slate-600 hover:border-green-500 bg-slate-900/30 hover:bg-green-900/20 rounded-lg py-2 flex items-center justify-center gap-2 text-slate-500 hover:text-green-400 transition-all text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Nueva Evaluación
                      </button>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  )
}