import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  History, RefreshCw, CheckCircle2, XCircle, Search, AlertCircle,
  Building2, User, ChevronRight, Trash2,
} from 'lucide-react'

import { visitasService } from '../../services/visitas'

const estadoConfig = {
  aprobada: {
    label: 'Aprobada', icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-500',
  },
  rechazada: {
    label: 'Rechazada', icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-red-500',
  },
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Historial() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todas')  // todas | aprobada | rechazada
  const [borrando, setBorrando] = useState(null)  // id de la solicitud en proceso de borrado

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await visitasService.historial()
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cargar el historial.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtradas = useMemo(() => {
    return items.filter((v) => {
      if (filtroEstado !== 'todas' && v.estado !== filtroEstado) return false
      if (!filtro.trim()) return true
      const q = filtro.trim().toLowerCase()
      return (
        v.folio.toLowerCase().includes(q) ||
        v.empresa_solicitante.toLowerCase().includes(q) ||
        v.persona_a_visitar.toLowerCase().includes(q)
      )
    })
  }, [items, filtro, filtroEstado])

  const eliminar = async (v) => {
    if (!window.confirm(`¿Borrar la solicitud ${v.folio}? Esta acción no se puede deshacer.`)) return
    setBorrando(v.id)
    try {
      await visitasService.eliminar(v.id)
      setItems((prev) => prev.filter((x) => x.id !== v.id))
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo borrar la solicitud.')
    } finally {
      setBorrando(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--isp-azul), #152238)' }}
          >
            <History size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Historial</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Solicitudes ya resueltas — aprobadas y rechazadas.
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

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por folio, empresa o persona a visitar…"
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {['todas', 'aprobada', 'rechazada'].map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition ${
                filtroEstado === e
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {e === 'todas' ? 'Todas' : e === 'aprobada' ? 'Aprobadas' : 'Rechazadas'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Cargando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center">
            <History size={40} className="mx-auto text-slate-300 mb-3" />
            <div className="text-sm font-semibold text-slate-700">
              {items.length === 0 ? 'Sin historial' : 'Sin resultados con los filtros aplicados'}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtradas.map((v) => {
              const cfg = estadoConfig[v.estado]
              const Icon = cfg.icon
              return (
                <li key={v.id} className="flex items-center gap-1">
                  <Link
                    to={`/encargado/visita/${v.id}`}
                    className="flex flex-1 min-w-0 items-center gap-3 p-4 hover:bg-slate-50 transition"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${cfg.className} shrink-0`}>
                      <Icon size={18} className={cfg.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {v.folio}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400" />
                          <span className="font-semibold">{v.empresa_solicitante}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <User size={13} className="text-slate-400" />
                          {v.persona_a_visitar}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {formatFecha(v.fecha_creacion)} · {v.total_personas} visitante{v.total_personas !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  </Link>
                  <button
                    onClick={() => eliminar(v)}
                    disabled={borrando === v.id}
                    title="Borrar solicitud"
                    className="mr-3 p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}