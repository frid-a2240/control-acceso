import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RefreshCw, Inbox, Clock, Building2, User, Users, AlertCircle,
  ChevronRight, Bell,
} from 'lucide-react'

import { useRealtime } from '../../contexts/RealtimeContext'
import { visitasService } from '../../services/visitas'
import { formatFechaHora, parseFecha } from '../../utils/formatoVisita'

function tiempoRelativo(iso) {
  const diff = (Date.now() - parseFecha(iso).getTime()) / 1000
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} d`
}

export default function Pendientes() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { suscribir } = useRealtime()

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await visitasService.pendientes()
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar las solicitudes pendientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // Entra sola cuando un solicitante la envía
  useEffect(() => suscribir((evento) => {
    if (evento.type === 'visita_nueva') cargar()
  }), [suscribir])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
          >
            <Inbox size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Solicitudes Pendientes</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Formatos capturados por coordinadores, jefes de área y colaboradores que esperan tu aprobación.
            </p>
          </div>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Alerta si hay pendientes */}
      {items.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-amber-900">
              {items.length} solicitud{items.length !== 1 ? 'es' : ''} pendiente{items.length !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-amber-700">
              Revisa los formatos y toma una decisión — el solicitante verá la respuesta al instante.
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Lista */}
      {loading && items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center text-slate-400">
          Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Inbox size={28} className="text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">Bandeja vacía</div>
          <p className="text-sm text-slate-500 mt-1">
            No hay solicitudes pendientes por aprobar. Todo al día.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((v) => (
            <PendienteCard key={v.id} visita={v} />
          ))}
        </div>
      )}
    </div>
  )
}

function PendienteCard({ visita }) {
  return (
    <Link
      to={`/opip/visita/${visita.id}`}
      className="group relative bg-white rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:shadow-md transition flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {visita.folio}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1">
            <Clock size={10} />
            Pendiente
          </span>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-[var(--primary)] transition shrink-0" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-sm">
          <Building2 size={14} className="text-slate-400 shrink-0" />
          <span className="font-bold text-slate-900 truncate">{visita.empresa_solicitante}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User size={14} className="text-slate-400 shrink-0" />
          <span className="truncate">Visita a: {visita.persona_a_visitar}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users size={14} className="text-slate-400 shrink-0" />
          <span>{visita.total_personas} visitante{visita.total_personas !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
        <span>{formatFechaHora(visita.fecha_creacion)}</span>
        <span className="font-semibold text-amber-600">{tiempoRelativo(visita.fecha_creacion)}</span>
      </div>
    </Link>
  )
}