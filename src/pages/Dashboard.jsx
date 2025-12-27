import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { magicParser } from '../utils/magicParser'
import { calcularEstadisticasRamo } from '../utils/gradeMath'
import { LogOut, Plus, Save, Trash2, Calculator, AlertCircle, CheckCircle, ChevronDown, ChevronRight, FolderPlus, FileText, X, ClipboardList, BarChart3, Target, Edit2, Check, HelpCircle, UserCircle, User } from 'lucide-react'
import Toast from '../components/Toast'

export default function Dashboard() {
  const [ramos, setRamos] = useState([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

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
  const [editingSemester, setEditingSemester] = useState(null)
  const [editedSemesterName, setEditedSemesterName] = useState('')
  const [deletingConfirmation, setDeletingConfirmation] = useState(null)

  // TOAST
  const [toast, setToast] = useState(null)
  
  // TOOLTIP AYUDA
  const [showHelpTooltip, setShowHelpTooltip] = useState(false)

  const navigate = useNavigate()

  useEffect(() => { fetchNotas() }, [])

  const fetchNotas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')

      // Obtener username del usuario (si no existe, extraer del email antes del @)
      const usernameFromMetadata = user.user_metadata?.username
      const usernameFromEmail = user.email?.split('@')[0] || 'Usuario'
      setUsername(usernameFromMetadata || usernameFromEmail)

      // Obtener avatar del usuario
      setAvatarUrl(user.user_metadata?.avatar_url || '')

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

  const startEditingSemester = (semestre, e) => {
    e.stopPropagation()
    setEditingSemester(semestre)
    setEditedSemesterName(semestre)
  }

  const saveEditedSemester = async (oldName, e) => {
    e.stopPropagation()
    if (!editedSemesterName.trim() || editedSemesterName === oldName) {
      setEditingSemester(null)
      return
    }

    // Actualizar ramos con el nuevo nombre de semestre
    const nuevaLista = ramos.map(r => 
      r.semestre === oldName ? { ...r, semestre: editedSemesterName } : r
    )
    
    // Actualizar localSemesters
    if (localSemesters.includes(oldName)) {
      setLocalSemesters(prev => prev.map(s => s === oldName ? editedSemesterName : s))
    }
    
    // Actualizar expandedSemesters
    const wasExpanded = expandedSemesters[oldName]
    setExpandedSemesters(prev => {
      const newState = { ...prev }
      delete newState[oldName]
      if (wasExpanded) newState[editedSemesterName] = true
      return newState
    })

    setRamos(nuevaLista)
    await saveNotasToCloud(nuevaLista)
    setEditingSemester(null)
    setToast({ message: "Semestre renombrado", type: "success" })
  }

  const deleteSemester = async (semestre, e) => {
    e.stopPropagation()
    setDeletingConfirmation(semestre)
  }

  const confirmDeleteSemester = async () => {
    const semestre = deletingConfirmation
    if (!semestre) return

    // Eliminar todos los ramos de este semestre
    const nuevaLista = ramos.filter(r => r.semestre !== semestre)
    
    // Eliminar de localSemesters
    setLocalSemesters(prev => prev.filter(s => s !== semestre))
    
    // Eliminar de expandedSemesters
    setExpandedSemesters(prev => {
      const newState = { ...prev }
      delete newState[semestre]
      return newState
    })

    setRamos(nuevaLista)
    await saveNotasToCloud(nuevaLista)
    setDeletingConfirmation(null)
    setToast({ message: "Semestre eliminado", type: "info" })
  }

  // FUNCIÓN PARA CREAR RAMO MANUAL
  const addManualRamo = async (semestre) => {
    const nuevoRamo = {
      id: crypto.randomUUID(),
      nombre: "Nuevo Ramo",
      semestre: semestre,
      unidades: [{
        id: crypto.randomUUID(),
        nombre: "Evaluaciones",
        peso: 100,
        evaluaciones: []
      }]
    }

    const ramoConEstadisticas = calcularEstadisticasRamo(nuevoRamo)
    const nuevaLista = [...ramos, ramoConEstadisticas]
    setRamos(nuevaLista)

    await saveNotasToCloud(nuevaLista)
    setToast({ message: "Ramo creado. Haz clic para editarlo.", type: "success" })
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

  if (loading) return <div className="min-h-screen bg-[#1A1F2E] flex items-center justify-center"><div className="text-center text-[#E2E8F0] text-lg font-medium">Cargando...</div></div>

  return (
    <div className="min-h-screen bg-[#1A1F2E] text-[#E2E8F0] p-4 md:p-8 relative">

      {/* TOAST NOTIFICATION */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deletingConfirmation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#242B3D] p-6 rounded-2xl border border-red-500/30 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#E2E8F0] mb-2">¿Eliminar semestre?</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Estás a punto de eliminar el semestre <span className="font-bold text-[#E2E8F0]">"{deletingConfirmation}"</span> y todos sus ramos. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingConfirmation(null)}
                className="flex-1 bg-[#2E3648] hover:bg-[#3A4357] text-[#E2E8F0] py-2.5 rounded-lg font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteSemester}
                className="flex-1 bg-red-500/90 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Modo Azúl" className="w-10 h-10" />
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#7AA7EC] to-[#9BC7F0]">
            Bienvenido a Modo Azúl, {username}!
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <button
            onClick={() => navigate('/profile')}
            className="relative group"
            title="Editar perfil"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#7AA7EC] bg-[#242B3D] flex items-center justify-center hover:border-[#9BC7F0] transition-colors">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#94A3B8]" />
              )}
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-[#242B3D] rounded-full transition"
            title="Cerrar sesión"
          >
            <LogOut className="text-[#94A3B8] hover:text-[#E2E8F0] w-5 h-5 transition-colors" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* SECCIÓN EXPLICATIVA */}
        <div className="bg-[#242B3D] border border-[#2E3648] rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#E2E8F0] mb-2">¿Qué es Modo Azúl?</h2>
              <p className="text-[#94A3B8] text-sm mb-6 leading-relaxed">
                Es tu calculadora inteligente de notas universitarias. Importa directamente desde UTalmatico,
                calcula automáticamente tus promedios ponderados y descubre qué nota necesitas en tus evaluaciones
                pendientes para aprobar cada ramo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2E3648]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#7AA7EC]/10 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-[#7AA7EC]" />
                    </div>
                    <h3 className="font-bold text-[#E2E8F0] text-sm">1. Importa</h3>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Copia y pega tus notas desde UTalmatico. El sistema detecta automáticamente ramos, evaluaciones y ponderaciones.
                  </p>
                </div>

                <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2E3648]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#7AA7EC]/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-[#7AA7EC]" />
                    </div>
                    <h3 className="font-bold text-[#E2E8F0] text-sm">2. Visualiza</h3>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Organiza tus ramos por semestres. Ve tu promedio actual, progreso y estado de cada ramo en tiempo real.
                  </p>
                </div>

                <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2E3648]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#7AA7EC]/10 rounded-lg">
                        <Target className="w-5 h-5 text-[#7AA7EC]" />
                    </div>
                    <h3 className="font-bold text-[#E2E8F0] text-sm">3. Planifica</h3>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
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
                className="flex items-center gap-2 bg-[#7AA7EC] hover:bg-[#6A96DB] text-white px-4 py-2 rounded-lg font-medium transition-all text-sm shadow-sm"
            >
                <FolderPlus className="w-4 h-4" /> Nuevo Semestre
            </button>
        </div>

        {/* ------------------------------------------- */}
        {/* MODAL 1: CREAR SEMESTRE (NUEVO DISEÑO)      */}
        {/* ------------------------------------------- */}
        {isCreating && (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-[#242B3D] p-6 rounded-2xl border border-[#2E3648] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-[#E2E8F0]">Nueva Carpeta</h3>
                        <button onClick={() => setIsCreating(false)} className="text-[#94A3B8] hover:text-[#E2E8F0]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Nombre del Semestre</label>
                    <input
                        autoFocus
                        type="text"
                        value={newSemesterName}
                        onChange={(e) => setNewSemesterName(e.target.value)}
                        placeholder="Ej: 2/2026"
                        className="w-full bg-[#1A1F2E] border border-[#2E3648] rounded-lg py-3 px-4 text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] outline-none mb-6"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveNewSemester()}
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveNewSemester}
                            className="flex-1 bg-[#7AA7EC] hover:bg-[#6A96DB] text-white py-2.5 rounded-lg font-bold transition-colors"
                        >
                            Crear
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="flex-1 bg-[#2E3648] hover:bg-[#3A4357] text-[#E2E8F0] py-2.5 rounded-lg font-bold transition-colors"
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
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-[#242B3D] p-6 rounded-2xl border border-[#2E3648] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-start gap-2">
                            <div>
                                <h3 className="font-bold text-lg text-[#E2E8F0]">Importar Ramos</h3>
                                <p className="text-sm text-[#7AA7EC] font-medium">Destino: {targetSemester}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsImporting(false)} className="text-[#94A3B8] hover:text-[#E2E8F0]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-[#1A1F2E] p-4 rounded-lg border border-[#2E3648] mb-4 space-y-3">
                        <div className="flex items-start gap-2">
                            <div className="text-xs text-[#E2E8F0] space-y-1">
                                <p className="font-semibold text-[#E2E8F0]">Instrucciones:</p>
                                <ol className="list-decimal list-inside space-y-1 text-[#94A3B8]">
                                    <li>Entra a <span className="font-mono text-[#7AA7EC]">UTalmatico</span> → <span className="font-mono text-[#7AA7EC]">Notas Parciales</span></li>
                                    <li>Selecciona tu ramo</li>
                                    <li>Copia <strong className="text-[#E2E8F0]">desde el nombre del ramo</strong> hasta la última evaluación (incluye todo)</li>
                                    <li>Pega el contenido abajo</li>
                                </ol>
                                <div className="mt-2 pt-2 border-t border-[#2E3648]">
                                    <button
                                        onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                                        className="font-bold text-[#7AA7EC] hover:text-[#6A96DB] hover:underline cursor-pointer transition-all"
                                    >
                                        Ejemplo demo
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {showHelpTooltip && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="bg-[#242B3D] border-2 border-[#7AA7EC] rounded-xl shadow-2xl overflow-hidden">
                                    <div className="p-3 bg-[#1A1F2E] border-b border-[#2E3648]">
                                        <p className="text-sm font-bold text-[#7AA7EC]">Guía Visual de Importación</p>
                                    </div>
                                    <img 
                                        src="/ayuda.gif" 
                                        alt="Guía de importación desde UTalmatico" 
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Pegar contenido aquí..."
                        className="w-full h-40 bg-[#1A1F2E] border border-[#2E3648] rounded-lg p-3 text-xs font-mono text-[#E2E8F0] placeholder-[#94A3B8]/50 focus:ring-2 focus:ring-[#7AA7EC] focus:border-[#7AA7EC] outline-none mb-4"
                    />

                    <button
                        onClick={handleMagicPaste}
                        className="w-full bg-[#7AA7EC] hover:bg-[#6A96DB] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" /> Procesar y Guardar
                    </button>
                </div>
            </div>
        )}


        {/* LISTA DE SEMESTRES */}
        {todosLosSemestres.length === 0 ? (
            <div className="text-center py-20 bg-[#242B3D] rounded-3xl border-2 border-dashed border-[#2E3648]">
                <Calculator className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                <h3 className="text-xl font-semibold text-[#E2E8F0]">Sin semestres</h3>
                <p className="text-[#94A3B8] mt-2 mb-4">Crea tu primer semestre para empezar.</p>
                <button onClick={openCreateModal} className="bg-[#7AA7EC] hover:bg-[#6A96DB] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
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
                        <div key={semestre} className="bg-[#242B3D] rounded-2xl border border-[#2E3648] overflow-hidden transition-all shadow-lg">

                            {/* CABECERA DEL SEMESTRE */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2A3142] transition-colors select-none group"
                                onClick={() => toggleSemestre(semestre)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-[#7AA7EC] text-white' : 'bg-[#2E3648] text-[#94A3B8] group-hover:text-[#E2E8F0]'}`}>
                                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        {editingSemester === semestre ? (
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editedSemesterName}
                                                    onChange={(e) => setEditedSemesterName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveEditedSemester(semestre, e)}
                                                    className="bg-[#1A1F2E] border border-[#7AA7EC] rounded-lg px-3 py-1 text-[#E2E8F0] text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#7AA7EC]"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={(e) => saveEditedSemester(semestre, e)}
                                                    className="p-2 bg-green-500/90 hover:bg-green-500 text-white rounded-lg transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingSemester(null); }}
                                                    className="p-2 bg-[#2E3648] hover:bg-[#3A4357] text-[#E2E8F0] rounded-lg transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <h2 className="text-lg md:text-xl font-bold text-[#E2E8F0]">{semestre}</h2>
                                                    <p className="text-xs text-[#94A3B8]">
                                                        {count === 0 ? "Carpeta vacía" : `${count} ramos`}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                    <button
                                                        onClick={(e) => startEditingSemester(semestre, e)}
                                                        className="p-1.5 hover:bg-[#2E3648] rounded-lg transition-colors text-[#94A3B8] hover:text-[#7AA7EC]"
                                                        title="Editar nombre"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => deleteSemester(semestre, e)}
                                                        className="p-1.5 hover:bg-[#2E3648] rounded-lg transition-colors text-[#94A3B8] hover:text-red-400"
                                                        title="Eliminar semestre"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {count > 0 && (
                                        <div className="text-right hidden md:block">
                                            <span className="block text-[10px] text-[#94A3B8] uppercase font-bold">Promedio</span>
                                            <span className={`font-bold ${promedioSemestre >= 4.0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {promedioSemestre.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CONTENIDO DESPLEGABLE */}
                            {isOpen && (
                                <div className="p-6 border-t border-[#2E3648] bg-[#1A1F2E] animate-in fade-in slide-in-from-top-2">

                                    {/* GRID DE RAMOS */}
                                    {count > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                            {ramosDeEsteSemestre.map((ramo) => (
                                                <RamoCard key={ramo.id} ramo={ramo} onDelete={() => deleteRamo(ramo.id)} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-[#94A3B8] text-sm italic border-2 border-dashed border-[#2E3648] rounded-xl mb-6 bg-[#242B3D]">
                                            Esta carpeta está vacía. Importa tus ramos.
                                        </div>
                                    )}

                                    {/* BOTONES DE ACCIÓN */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openImportModal(semestre);
                                            }}
                                            className="flex-1 border border-[#2E3648] bg-[#242B3D] hover:bg-[#7AA7EC] hover:border-[#7AA7EC] hover:text-white text-[#E2E8F0] rounded-xl p-3 flex items-center justify-center gap-2 transition-all font-medium text-sm"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Importar desde UTalmatico
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addManualRamo(semestre);
                                            }}
                                            className="flex-1 border border-[#7AA7EC] bg-[#242B3D] hover:bg-[#7AA7EC] hover:text-white text-[#7AA7EC] rounded-xl p-3 flex items-center justify-center gap-2 transition-all font-medium text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Crear Ramo Manual
                                        </button>
                                    </div>
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

    let badgeColor = "bg-[#94A3B8]/50"
    if (estadisticas.estado === "APROBADO") badgeColor = "bg-green-500/90"
    if (estadisticas.estado === "REPROBADO") badgeColor = "bg-red-500/90"
    if (estadisticas.estado === "CRÍTICO") badgeColor = "bg-orange-500/90"
    if (estadisticas.estado === "EN CURSO") badgeColor = "bg-[#7AA7EC]/90"

    return (
        <div
            onClick={() => navigate(`/ramo/${ramo.id}`)}
            className="bg-[#242B3D] rounded-2xl p-5 border border-[#2E3648] shadow-lg hover:shadow-xl hover:border-[#7AA7EC]/50 transition-all hover:-translate-y-1 relative group cursor-pointer"
        >
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1 hover:bg-[#2E3648] rounded"
                title="Eliminar ramo"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mb-3 tracking-wide ${badgeColor}`}>
                {estadisticas.estado}
            </div>

            <h3 className="text-lg font-bold text-[#E2E8F0] mb-1 truncate pr-6" title={ramo.nombre}>
                {ramo.nombre}
            </h3>

            <div className="flex items-end gap-2 mb-4">
                <span className={`text-4xl font-bold tracking-tighter ${aprobado ? 'text-green-400' : 'text-red-400'}`}>
                    {nota.toFixed(1)}
                </span>
                <span className="text-[#94A3B8] text-xs font-medium mb-1.5 uppercase">Promedio</span>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-[10px] uppercase font-bold text-[#94A3B8] mb-1">
                    <span>Progreso</span>
                    <span>{estadisticas.pesoEvaluado}%</span>
                </div>
                <div className="w-full bg-[#1A1F2E] rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${aprobado ? 'bg-green-400' : 'bg-[#7AA7EC]'}`}
                        style={{ width: `${estadisticas.pesoEvaluado}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-[#1A1F2E] rounded-lg p-3 text-sm border border-[#2E3648]">
                {estadisticas.notaNecesaria > 0 ? (
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                        <span className="text-[#94A3B8] text-xs leading-relaxed">
                            Meta: <strong className="text-[#E2E8F0] text-sm">{estadisticas.notaNecesaria}</strong> en el {100 - estadisticas.pesoEvaluado}% restante.
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-[#94A3B8] text-xs">¡Ramo finalizado!</span>
                    </div>
                )}
            </div>
        </div>
    )
}