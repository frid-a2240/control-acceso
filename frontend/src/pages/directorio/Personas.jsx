import { useEffect, useMemo, useState } from 'react'
import {
  Users, Search, RefreshCw, User, Calendar, IdCard, X,
  AlertCircle, UserPlus, Car, Trash2,
} from 'lucide-react'

import { personasService, vehiculosService } from '../../services/visitas'
import FotoPersona from '../../components/FotoPersona'
import { useAuth } from '../../contexts/AuthContext'

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function Personas() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [seleccionada, setSeleccionada] = useState(null)

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await personasService.listar()
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cargar el directorio.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtradas = useMemo(() => {
    if (!filtro.trim()) return items
    const q = filtro.trim().toLowerCase()
    return items.filter((p) =>
      p.nombre.toLowerCase().includes(q) ||
      p.numero_identificacion.toLowerCase().includes(q)
    )
  }, [items, filtro])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--isp-azul), #152238)' }}
          >
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Personas registradas</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Directorio de visitantes — se autocompletan al capturar una nueva solicitud.
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

      {/* Buscador */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nombre o número de identificación…"
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Grid de cards */}
      {loading && items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center text-slate-400">
          Cargando…
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center">
          <UserPlus size={40} className="mx-auto text-slate-300 mb-3" />
          <div className="text-sm font-semibold text-slate-700">
            {items.length === 0
              ? 'Aún no hay personas registradas'
              : 'Sin resultados con tu búsqueda'}
          </div>
          {items.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Los visitantes se agregan aquí desde el módulo "Nueva Solicitud".
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              onClick={() => setSeleccionada(p)}
            />
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {seleccionada && (
        <ModalDetalle
          persona={seleccionada}
          onClose={() => setSeleccionada(null)}
          onEliminada={(id) => {
            setItems((prev) => prev.filter((p) => p.id !== id))
            setSeleccionada(null)
          }}
        />
      )}
    </div>
  )
}

function PersonaCard({ persona, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-[var(--border)] p-4 text-left hover:border-[var(--primary)] hover:shadow-md transition flex gap-3 min-w-0"
    >
      <FotoPersona persona={persona} className="h-20 w-[3.75rem] rounded-xl" iconSize={26} />

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="text-sm font-bold text-slate-900 truncate">
          {persona.nombre}
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
          <IdCard size={12} className="shrink-0" />
          <span className="font-mono truncate">
            {persona.tipo_identificacion}: {persona.numero_identificacion}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Calendar size={11} />
          {persona.ultima_visita
            ? `Última visita: ${formatFecha(persona.ultima_visita)}`
            : 'Sin visitas registradas'}
        </div>
        {persona.vehiculos?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {persona.vehiculos.map((v) => (
              <span
                key={v.id}
                className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600"
              >
                <Car size={10} />
                {v.placas}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function ModalDetalle({ persona, onClose, onEliminada }) {
  const { user } = useAuth()
  const esEncargado = user?.rol === 'encargado'

  const [vehiculos, setVehiculos] = useState(persona.vehiculos || [])
  const [borrando, setBorrando] = useState(false)
  const [borrandoVehiculoId, setBorrandoVehiculoId] = useState(null)
  const [error, setError] = useState('')

  const eliminarPersona = async () => {
    if (!window.confirm(`¿Borrar a ${persona.nombre}? Esta acción no se puede deshacer.`)) return
    setError('')
    setBorrando(true)
    try {
      await personasService.eliminar(persona.id)
      onEliminada(persona.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo borrar la persona.')
      setBorrando(false)
    }
  }

  const eliminarVehiculo = async (v) => {
    if (!window.confirm(`¿Borrar las placas ${v.placas}? Esta acción no se puede deshacer.`)) return
    setError('')
    setBorrandoVehiculoId(v.id)
    try {
      await vehiculosService.eliminar(v.id)
      setVehiculos((prev) => prev.filter((x) => x.id !== v.id))
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo borrar el vehículo.')
    } finally {
      setBorrandoVehiculoId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-900">Detalle</h3>
          </div>
          <div className="flex items-center gap-1">
            {esEncargado && (
              <button
                onClick={eliminarPersona}
                disabled={borrando}
                title="Borrar persona"
                className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col items-center">
          <FotoPersona
            persona={persona}
            className="h-44 w-[8.25rem] rounded-2xl shadow-md ring-1 ring-slate-200"
            iconSize={48}
          />

          <h4 className="mt-4 text-lg font-bold text-slate-900 text-center">
            {persona.nombre}
          </h4>
          <div className="text-sm text-slate-500">{persona.nacionalidad}</div>

          <div className="w-full mt-6 flex flex-col gap-2">
            <InfoRow label="Identificación">
              <span className="font-mono">
                {persona.tipo_identificacion}: {persona.numero_identificacion}
              </span>
            </InfoRow>
            <InfoRow label="Fecha de registro">{formatFecha(persona.fecha_registro)}</InfoRow>
            <InfoRow label="Última visita">
              {persona.ultima_visita
                ? formatFecha(persona.ultima_visita)
                : <span className="text-slate-400 italic">Sin visitas</span>}
            </InfoRow>
          </div>

          {/* Placas ligadas — se autocompletan al capturar una nueva solicitud */}
          <div className="w-full mt-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Car size={13} />
              Vehículos registrados
            </div>
            {vehiculos.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Sin placas registradas.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {vehiculos.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700 truncate">{v.marca} {v.modelo}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-semibold text-slate-900">{v.placas}</span>
                      {esEncargado && (
                        <button
                          onClick={() => eliminarVehiculo(v)}
                          disabled={borrandoVehiculoId === v.id}
                          title="Borrar vehículo"
                          className="p-1 rounded text-slate-300 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="w-full mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 text-sm">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-slate-800 text-right">{children}</span>
    </div>
  )
}