import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'

import { visitasService } from '../../services/visitas'
import { useRealtime } from '../../contexts/RealtimeContext'
import FormatoVisita from '../../components/FormatoVisita'
import { estadoConfig } from '../../utils/formatoVisita'

/** El mismo formato que ve OPIP, en solo lectura para el solicitante. */
export default function DetalleSolicitud() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { suscribir } = useRealtime()

  const [visita, setVisita] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      setVisita(await visitasService.obtener(id))
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cargar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  // Si OPIP la resuelve mientras el solicitante la tiene abierta, se actualiza sola
  useEffect(() => {
    return suscribir((evento) => {
      if (evento.type !== 'visita_resuelta') return
      if (String(evento.visita_id) !== String(id)) return
      setVisita((prev) =>
        prev
          ? {
              ...prev,
              estado: evento.estado,
              comentario_resolucion: evento.comentario,
              fecha_resolucion: evento.fecha_resolucion,
            }
          : prev,
      )
    })
  }, [suscribir, id])

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
          onClick={() => navigate('/solicitante')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft size={14} /> Volver a mis solicitudes
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-2">
          <AlertCircle size={18} />
          {error || 'Solicitud no encontrada'}
        </div>
      </div>
    )
  }

  const cfg = estadoConfig[visita.estado]
  const EstadoIcon = cfg.icon

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/solicitante')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft size={14} /> Volver a mis solicitudes
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={cargar}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <EstadoIcon size={16} />
            {cfg.label}
          </div>
        </div>
      </div>

      <FormatoVisita visita={visita} />
    </div>
  )
}
