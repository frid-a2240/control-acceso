import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, Send, Loader2, Shield,
} from 'lucide-react'

import { visitasService } from '../../services/visitas'
import FormatoVisita from '../../components/FormatoVisita'
import { estadoConfig } from '../../utils/formatoVisita'

export default function DetalleVisita() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [visita, setVisita] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estado del panel de resolución
  const [decision, setDecision] = useState(null)  // 'aprobar' | 'rechazar' | null
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorResolucion, setErrorResolucion] = useState('')

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await visitasService.obtener(id)
      setVisita(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cargar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  const resolver = async () => {
    setErrorResolucion('')
    if (decision === 'rechazar' && !comentario.trim()) {
      setErrorResolucion('Es obligatorio indicar un motivo al rechazar.')
      return
    }
    setEnviando(true)
    try {
      const actualizada = await visitasService.resolver(
        visita.id,
        decision === 'aprobar',
        comentario.trim() || null,
      )
      setVisita(actualizada)
      setDecision(null)
      setComentario('')
    } catch (err) {
      setErrorResolucion(err.response?.data?.detail || 'No se pudo procesar la resolución.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center text-slate-400">
          Cargando solicitud…
        </div>
      </div>
    )
  }

  if (error || !visita) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-2">
          <AlertCircle size={18} />
          {error || 'Solicitud no encontrada'}
        </div>
      </div>
    )
  }

  const yaResuelta = visita.estado !== 'pendiente'
  const cfg = estadoConfig[visita.estado]
  const EstadoIcon = cfg.icon

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header con botón volver + estado */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <EstadoIcon size={16} />
          {cfg.label}
        </div>
      </div>

      <FormatoVisita visita={visita} />

      {/* ━━━━━━━━ Panel de resolución (fijo abajo) ━━━━━━━━ */}
      {!yaResuelta && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-300 shadow-lg z-30">
          <div className="max-w-4xl mx-auto p-4">
            {!decision ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Shield size={16} className="text-slate-400" />
                  <span>¿Autoriza el acceso a esta persona?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDecision('rechazar')}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition"
                  >
                    <XCircle size={16} />
                    Rechazar
                  </button>
                  <button
                    onClick={() => setDecision('aprobar')}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                  >
                    <CheckCircle2 size={16} />
                    Aprobar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {decision === 'aprobar' ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                      <CheckCircle2 size={16} /> Vas a aprobar esta solicitud
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-700">
                      <XCircle size={16} /> Vas a rechazar esta solicitud
                    </span>
                  )}
                </div>
                <textarea
                  className="input"
                  rows={2}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder={
                    decision === 'rechazar'
                      ? 'Motivo del rechazo (obligatorio)…'
                      : 'Comentario opcional…'
                  }
                />
                {errorResolucion && (
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle size={16} /> {errorResolucion}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => { setDecision(null); setComentario(''); setErrorResolucion('') }}
                    disabled={enviando}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={resolver}
                    disabled={enviando}
                    className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white transition shadow-sm disabled:opacity-50 ${
                      decision === 'aprobar' ? '' : 'bg-red-600 hover:bg-red-700'
                    }`}
                    style={decision === 'aprobar' ? { background: 'linear-gradient(135deg, #059669, #047857)' } : {}}
                  >
                    {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Confirmar {decision === 'aprobar' ? 'aprobación' : 'rechazo'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
