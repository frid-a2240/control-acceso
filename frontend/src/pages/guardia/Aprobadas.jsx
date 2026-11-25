import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, RefreshCw, Search, AlertCircle, Building2, User, MapPin,
  Car, Clock, CheckCircle2,
} from 'lucide-react'

import { visitasService } from '../../services/visitas'
import { useRealtime } from '../../contexts/RealtimeContext'
import FotoPersona from '../../components/FotoPersona'
import { formatFecha, formatHora } from '../../utils/formatoVisita'

// Además del aviso en vivo, se vuelve a consultar: así salen solas las que
// vencen y la lista sigue al día aunque se caiga la conexión.
const REFRESCO_MS = 15000

/**
 * Solicitudes aprobadas dentro de su plazo, en solo lectura.
 * La usan los guardias (entrada) y OPIP.
 *
 * @param {{ base: string }} props  Ruta del rol: '/guardia' | '/opip'
 */
export default function Aprobadas({ base }) {
  const { suscribir } = useRealtime()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')

  const cargar = useCallback(async () => {
    try {
      setItems(await visitasService.aprobadas())
      setError('')
    } catch (err) {
      // Sin confirmación del servidor no se muestran accesos que pudieron vencer
      setItems([])
      setError(err.response?.data?.detail || 'Sin conexión con el sistema. No se pueden verificar los accesos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, REFRESCO_MS)
    return () => clearInterval(intervalo)
  }, [cargar])

  useEffect(() => suscribir((evento) => {
    if (evento.type === 'visita_aprobada') cargar()
  }), [suscribir, cargar])

  const filtradas = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return items
    return items.filter((v) =>
      [
        v.folio, v.empresa_solicitante, v.persona_a_visitar, v.area_a_visitar,
        ...v.personas.flatMap((p) => [p.nombre, p.numero_identificacion]),
        ...v.vehiculos.map((x) => x.placas),
      ].some((texto) => texto?.toLowerCase().includes(q)),
    )
  }, [items, filtro])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Solicitudes Aprobadas</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Accesos autorizados por OPIP dentro de su plazo. Al vencer salen solas de esta lista.
            </p>
          </div>
        </div>
        <button
          onClick={cargar}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por visitante, identificación, placas, empresa o folio…"
          aria-label="Buscar solicitud aprobada"
          className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
        />
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center text-slate-400">
          Cargando…
        </div>
      ) : filtradas.length === 0 ? (
        !error && (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center">
            <ShieldCheck size={40} className="mx-auto text-slate-300 mb-3" />
            <div className="text-sm font-semibold text-slate-700">
              {items.length === 0 ? 'No hay accesos aprobados vigentes' : 'Sin resultados para tu búsqueda'}
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtradas.map((v) => <AprobadaCard key={v.id} visita={v} base={base} />)}
        </div>
      )}
    </div>
  )
}

function AprobadaCard({ visita, base }) {
  return (
    <Link
      to={`${base}/visita/${visita.id}`}
      className="bg-white rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:shadow-md transition flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {visita.folio}
        </span>
        <Plazo visita={visita} />
      </div>

      <ul className="flex flex-col gap-2">
        {visita.personas.map((p) => (
          <li key={p.id} className="flex items-center gap-3 min-w-0">
            <FotoPersona persona={p} className="h-14 w-11" iconSize={16} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{p.nombre}</div>
              <div className="text-xs text-slate-500 font-mono truncate">
                {p.tipo_identificacion}: {p.numero_identificacion}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 text-sm text-slate-600">
        <Dato icon={Building2}>{visita.empresa_solicitante}</Dato>
        <Dato icon={User}>Visita a: {visita.persona_a_visitar}</Dato>
        <Dato icon={MapPin}>{visita.area_a_visitar}</Dato>
        {visita.vehiculos.map((x) => (
          <Dato key={x.id} icon={Car}>
            <span className="font-mono font-bold text-slate-900">{x.placas}</span> · {x.marca} {x.modelo} {x.anio ?? ''}
          </Dato>
        ))}
      </div>
    </Link>
  )
}

function Plazo({ visita }) {
  const { en_horario: enHorario, inicio, fin } = visita
  const esHoy = new Date(inicio).toDateString() === new Date().toDateString()
  const Icon = enHorario ? CheckCircle2 : Clock
  const inicia = esHoy ? formatHora(inicio) : `${formatFecha(inicio)} ${formatHora(inicio)}`

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${
        enHorario
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      <Icon size={12} />
      {enHorario ? `Vigente hasta ${formatHora(fin)}` : `Aún no · inicia ${inicia}`}
    </span>
  )
}

function Dato({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={14} className="text-slate-400 shrink-0" />
      <span className="truncate">{children}</span>
    </div>
  )
}
