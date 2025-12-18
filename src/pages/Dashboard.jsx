import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { magicParser } from '../utils/magicParser'
import { calcularEstadisticasRamo } from '../utils/gradeMath'
import { LogOut, Plus, Save, Trash2, Calculator, AlertCircle, CheckCircle, ChevronDown, ChevronRight, FolderPlus, FileText, X, ClipboardList, BarChart3, Target } from 'lucide-react'
import Toast from '../components/Toast'

export default function Dashboard() {
  const [ramos, setRamos] = useState([])
  const [loading, setLoading] = useState(true)

  // MODALES
  const [isImporting, setIsImporting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [targetSemester, setTargetSemester] = useState('')

  // INPUTS
  const [inputText, setInputText] = useState('')
  const [newSemesterName, setNewSemesterName] = useState('')

  // SEMESTRES
  const [expandedSemesters, setExpandedSemesters] = useState({})
  const [localSemesters, setLocalSemesters] = useState([])

  // TOAST
  const [toast, setToast] = useState(null)

  const navigate = useNavigate()

  useEffect(() => { fetchNotas() }, [])

  const fetchNotas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')

      const { data } = await supabase.from('notas').select('ramos').eq('user_id', user.id).single()

      if (data && data.ramos) {
          setRamos(data.ramos)
          const sems = [...new Set(data.ramos.map(r => r.semestre || "Otros"))].sort().reverse()
          if(sems.length > 0) setExpandedSemesters({ [sems[0]]: true })
      }
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const saveNotasToCloud = async (nuevosRamos) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: existing } = await supabase.from('notas').select('id').eq('user_id', user.id).single()
    if (!existing) await supabase.from('notas').insert([{ user_id: user.id, ramos: nuevosRamos }])
    else await supabase.from('notas').update({ ramos: nuevosRamos }).eq('user_id', user.id)
  }

  // 1. ABRIR MODAL CREAR
  const openCreateModal = () => {
      setNewSemesterName('')
      setIsCreating(true)
  }

  // 2. GUARDAR NUEVO SEMESTRE (Crear caja vacía)
  const handleSaveNewSemester = () => {
      if (!newSemesterName.trim()) return

      const limpio = newSemesterName.trim()
      setLocalSemesters(prev => [...prev, limpio])
      setExpandedSemesters(prev => ({ ...prev, [limpio]: true }))
      
      setIsCreating(false) // Cierra el modal
  }

  // 3. ABRIR EL IMPORTADOR PARA UN SEMESTRE ESPECÍFICO
  const openImportModal = (semestre) => {
      setTargetSemester(semestre)
      setIsImporting(true)
      setInputText('')
  }

  // 4. PROCESAR EL TEXTO Y GUARDAR EN EL SEMESTRE TARGET
  const handleMagicPaste = async () => {
    if (!inputText.trim()) return
    const ramosDetectados = magicParser(inputText)
    if (ramosDetectados.length === 0) {
      setToast({ message: "No se detectaron ramos. Verifica el formato.", type: "error" })
      return
    }

    const ramosProcesados = ramosDetectados.map(r => ({
        ...calcularEstadisticasRamo(r),
        semestre: targetSemester 
    }))

    const nuevaLista = [...ramos, ...ramosProcesados]
    setRamos(nuevaLista)
    setInputText('')
    setIsImporting(false)

    if(localSemesters.includes(targetSemester)) {
        setLocalSemesters(prev => prev.filter(s => s !== targetSemester))
    }

    await saveNotasToCloud(nuevaLista)
    setToast({ message: `${ramosProcesados.length} ramo(s) importado(s) exitosamente`, type: "success" })
  }

  const deleteRamo = async (id) => {
      const nuevaLista = ramos.filter(r => r.id !== id)
      setRamos(nuevaLista)
      await saveNotasToCloud(nuevaLista)
      setToast({ message: "Ramo eliminado", type: "info" })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const toggleSemestre = (semestre) => {
      setExpandedSemesters(prev => ({ ...prev, [semestre]: !prev[semestre] }))
  }

  // AGRUPAR Y UNIR SEMESTRES
  const ramosPorSemestre = ramos.reduce((acc, ramo) => {
    const sem = ramo.semestre || "Otros";
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(ramo);
    return acc;
  }, {});

  const todosLosSemestres = [...new Set([
      ...Object.keys(ramosPorSemestre),
      ...localSemesters
  ])].sort().reverse();

  if (loading) return <div className="p-10 text-center text-white">Cargando...</div>

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 relative">

      {/* TOAST NOTIFICATION */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
            Modo Azúl
        </h1>
        <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full transition">
            <LogOut className="text-slate-400 w-5 h-5" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* SECCIÓN EXPLICATIVA */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">¿Qué es Modo Azúl?</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Es tu calculadora inteligente de notas universitarias. Importa directamente desde UTalmatico, 
                calcula automáticamente tus promedios ponderados y descubre qué nota necesitas en tus evaluaciones 
                pendientes para aprobar cada ramo.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-slate-200 text-sm">1. Importa</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Copia y pega tus notas desde UTalmatico. El sistema detecta automáticamente ramos, evaluaciones y ponderaciones.
                  </p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="font-bold text-slate-200 text-sm">2. Visualiza</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Organiza tus ramos por semestres. Ve tu promedio actual, progreso y estado de cada ramo en tiempo real.
                  </p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-slate-200 text-sm">3. Planifica</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Calcula la nota mínima que necesitas en las evaluaciones restantes. Simula diferentes escenarios.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* BOTÓN CREAR SEMESTRE */}
        <div className="flex justify-end">
            <button 
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-4 py-2 rounded-lg font-medium transition-all text-sm shadow-sm"
            >
                <FolderPlus className="w-4 h-4" /> Nuevo Semestre
            </button>
        </div>

        {/* ------------------------------------------- */}
        {/* MODAL 1: CREAR SEMESTRE (NUEVO DISEÑO)      */}
        {/* ------------------------------------------- */}
        {isCreating && (
             <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-white">Nueva Carpeta</h3>
                        <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Semestre</label>
                    <input 
                        autoFocus
                        type="text" 
                        value={newSemesterName}
                        onChange={(e) => setNewSemesterName(e.target.value)}
                        placeholder="Ej: 2/2026"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveNewSemester()}
                    />
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={handleSaveNewSemester}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition-colors"
                        >
                            Crear
                        </button>
                        <button 
                            onClick={() => setIsCreating(false)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
             </div>
        )}

        {/* ------------------------------------------- */}
        {/* MODAL 2: IMPORTAR RAMOS                   */}
        {/* ------------------------------------------- */}
        {isImporting && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-white">Importar Ramos</h3>
                            <p className="text-sm text-blue-400 font-medium">Destino: {targetSemester}</p>
                        </div>
                        <button onClick={() => setIsImporting(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 mb-4 space-y-3">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold text-sm shrink-0">📋</span>
                            <div className="text-xs text-slate-300 space-y-1">
                                <p className="font-semibold text-white">Instrucciones:</p>
                                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                                    <li>Entra a <span className="font-mono text-blue-400">UTalmatico</span> → <span className="font-mono text-blue-400">Notas Parciales</span></li>
                                    <li>Selecciona tu ramo</li>
                                    <li>Copia <strong className="text-white">desde el nombre del ramo</strong> hasta la última evaluación (incluye todo)</li>
                                    <li>Pega el contenido abajo</li>
                                </ol>
                            </div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1.5">
                            <p className="text-xs text-yellow-300">
                                💡 <strong>Tip:</strong> Selecciona arrastrando desde el título hasta el final de la tabla
                            </p>
                        </div>
                    </div>

                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Pegar contenido aquí..."
                        className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                    />
                    
                    <button 
                        onClick={handleMagicPaste}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" /> Procesar y Guardar
                    </button>
                </div>
            </div>
        )}


        {/* LISTA DE SEMESTRES */}
        {todosLosSemestres.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-800">
                <Calculator className="w-16 h-16 mx-auto text-slate-700 mb-4" />
                <h3 className="text-xl font-semibold text-slate-400">Sin semestres</h3>
                <p className="text-slate-600 mt-2 mb-4">Crea tu primer semestre para empezar.</p>
                <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                    + Crear Semestre
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                {todosLosSemestres.map((semestre) => {
                    const isOpen = expandedSemesters[semestre];
                    const ramosDeEsteSemestre = ramosPorSemestre[semestre] || [];
                    const count = ramosDeEsteSemestre.length;
                    
                    const promedioSemestre = count > 0 
                        ? ramosDeEsteSemestre.reduce((acc, r) => acc + r.estadisticas.promedioActual, 0) / count
                        : 0;

                    return (
                        <div key={semestre} className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden transition-all">
                            
                            {/* CABECERA DEL SEMESTRE */}
                            <div 
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800 transition-colors select-none group"
                                onClick={() => toggleSemestre(semestre)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 group-hover:text-white'}`}>
                                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg md:text-xl font-bold text-slate-200">{semestre}</h2>
                                        <p className="text-xs text-slate-500">
                                            {count === 0 ? "Carpeta vacía" : `${count} ramos`}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    {count > 0 && (
                                        <div className="text-right hidden md:block">
                                            <span className="block text-[10px] text-slate-500 uppercase font-bold">Promedio</span>
                                            <span className={`font-bold ${promedioSemestre >= 4.0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {promedioSemestre.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CONTENIDO DESPLEGABLE */}
                            {isOpen && (
                                <div className="p-6 border-t border-slate-700 bg-slate-900/30 animate-in fade-in slide-in-from-top-2">
                                    
                                    {/* GRID DE RAMOS */}
                                    {count > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                            {ramosDeEsteSemestre.map((ramo) => (
                                                <RamoCard key={ramo.id} ramo={ramo} onDelete={() => deleteRamo(ramo.id)} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 text-sm italic border-2 border-dashed border-slate-800 rounded-xl mb-6">
                                            Esta carpeta está vacía. Importa tus ramos.
                                        </div>
                                    )}

                                    {/* BOTÓN "IMPORTAR" */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            openImportModal(semestre);
                                        }}
                                        className="w-full border border-slate-600 bg-slate-800 hover:bg-blue-600 hover:border-blue-500 hover:text-white text-slate-300 rounded-xl p-3 flex items-center justify-center gap-2 transition-all font-medium text-sm shadow-sm"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Importar Ramos a {semestre}
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )}
      </div>
    </div>
  )
}

function RamoCard({ ramo, onDelete }) {
    const navigate = useNavigate()
    const { estadisticas } = ramo
    const nota = estadisticas.promedioActual
    const aprobado = nota >= 4.0

    let badgeColor = "bg-slate-600"
    if (estadisticas.estado === "APROBADO") badgeColor = "bg-green-500"
    if (estadisticas.estado === "REPROBADO") badgeColor = "bg-red-500"
    if (estadisticas.estado === "CRÍTICO") badgeColor = "bg-orange-500"
    if (estadisticas.estado === "EN CURSO") badgeColor = "bg-blue-600"

    return (
        <div 
            onClick={() => navigate(`/ramo/${ramo.id}`)} 
            className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative group cursor-pointer"
        >
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1 hover:bg-slate-900 rounded"
                title="Eliminar ramo"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mb-3 tracking-wide ${badgeColor}`}>
                {estadisticas.estado}
            </div>

            <h3 className="text-lg font-bold text-white mb-1 truncate pr-6" title={ramo.nombre}>
                {ramo.nombre}
            </h3>
            
            <div className="flex items-end gap-2 mb-4">
                <span className={`text-4xl font-bold tracking-tighter ${aprobado ? 'text-green-400' : 'text-red-400'}`}>
                    {nota.toFixed(1)}
                </span>
                <span className="text-slate-500 text-xs font-medium mb-1.5 uppercase">Promedio</span>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1">
                    <span>Progreso</span>
                    <span>{estadisticas.pesoEvaluado}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${aprobado ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${estadisticas.pesoEvaluado}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 text-sm border border-slate-800/50">
                {estadisticas.notaNecesaria > 0 ? (
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                        <span className="text-slate-400 text-xs leading-relaxed">
                            Meta: <strong className="text-white text-sm">{estadisticas.notaNecesaria}</strong> en el {100 - estadisticas.pesoEvaluado}% restante.
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-slate-400 text-xs">¡Ramo finalizado!</span>
                    </div>
                )}
            </div>
        </div>
    )
}