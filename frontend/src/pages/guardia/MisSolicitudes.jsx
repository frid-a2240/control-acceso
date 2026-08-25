import { useEffect, useState } from 'react'
import { useRealtime } from '../../contexts/RealtimeContext'
import { Link } from 'react-router-dom'
import {
  Plus, RefreshCw, ClipboardList, Clock, CheckCircle2, XCircle,
  Building2, User, AlertCircle, ChevronRight,
} from 'lucide-react'

import { visitasService } from '../../services/visitas'

const estadoConfig = {
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500',
  },
  aprobada: {
    label: 'Aprobada',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-500',
  },
  rechazada: {
    label: 'Rechazada',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-red-500',
  },
}

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MisSolicitudes() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { suscribir } = useRealtime()

// Actualiza la lista en vivo cuando el encargado resuelve una solicitud
useEffect(() => {
  return suscribir((evento) => {
    if (evento.type !== 'visita_resuelta') return
    setItems((prev) =>
      prev.map((v) =>
        v.id === evento.visita_id
          ? { ...v, estado: evento.estado }
          : v
      )
    )
  })
}, [suscribir])

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await visitasService.misSolicitudes()
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar tus solicitudes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const stats = {
    total: items.length,
    pendientes: items.filter((i) => i.estado === 'pendiente').length,
    aprobadas: items.filter((i) => i.estado === 'aprobada').length,
    rechazadas: items.filter((i) => i.estado === 'rechazada').length,
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* ━━━━━━━ Header ━━━━━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Solicitudes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historial y estado de las solicitudes de acceso que has capturado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargar}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <Link
            to="/guardia/nueva"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition shadow-sm"
            style={{
              background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)',
            }}
          >
            <Plus size={16} />
            Nueva solicitud
          </Link>
        </div>
      </div>

      {/* ━━━━━━━ Stats cards ━━━━━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} icon={ClipboardList} color="slate" />
        <StatCard label="Pendientes" value={stats.pendientes} icon={Clock} color="amber" />
        <StatCard label="Aprobadas" value={stats.aprobadas} icon={CheckCircle2} color="emerald" />
        <StatCard label="Rechazadas" value={stats.rechazadas} icon={XCircle} color="red" />
      </div>

      {/* ━━━━━━━ Error ━━━━━━━ */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ━━━━━━━ Lista ━━━━━━━ */}
      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Cargando…</div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((v) => (
              <SolicitudRow key={v.id} visita={v} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ---------- Subcomponentes ----------

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }[color]

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-4 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-lg flex items-center justify-center border ${colors}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
      </div>
    </div>
  )
}

function SolicitudRow({ visita }) {
  const cfg = estadoConfig[visita.estado]
  const Icon = cfg.icon

  return (
    <li>
      {/* Al dar click se abre el formato completo, igual que lo ve el encargado */}
      <Link
        to={`/guardia/visita/${visita.id}`}
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-slate-50 transition"
      >
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${cfg.className} shrink-0`}>
          <Icon size={18} className={cfg.iconColor} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded"
            >
              {visita.folio}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.className}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
            <span className="flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400" />
              <span className="font-semibold">{visita.empresa_solicitante}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <User size={13} className="text-slate-400" />
              Visita a: {visita.persona_a_visitar}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {formatFecha(visita.fecha_creacion)} · {visita.total_personas} visitante{visita.total_personas !== 1 ? 's' : ''}
          </div>
        </div>

        <ChevronRight size={16} className="text-slate-300 shrink-0 hidden sm:block" />
      </Link>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
      <div className="text-sm font-semibold text-slate-700">Aún no tienes solicitudes</div>
      <p className="text-xs text-slate-500 mt-1">
        Cuando captures una nueva solicitud aparecerá aquí con su estado.
      </p>
      <Link
        to="/guardia/nueva"
        className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition shadow-sm"
        style={{
          background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)',
        }}
      >
        <Plus size={16} />
        Nueva solicitud
      </Link>
    </div>
  )
}