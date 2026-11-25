import { useEffect, useMemo, useState } from 'react'
import {
  Building2, Search, RefreshCw, AlertCircle, Calendar,
} from 'lucide-react'

import { empresasService } from '../../services/visitas'
import { formatFechaHora } from '../../utils/formatoVisita'

export default function Empresas() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await empresasService.listar()
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
    return items.filter((e) => e.nombre.toLowerCase().includes(q))
  }, [items, filtro])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--isp-azul), #152238)' }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Empresas proveedoras</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Se registran solas con cada solicitud que envían los solicitantes.
            </p>
          </div>
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
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--border)] p-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar empresa…"
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Cargando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
            <div className="text-sm font-semibold text-slate-700">
              {items.length === 0
                ? 'Aún no hay empresas registradas'
                : 'Sin resultados con tu búsqueda'}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtradas.map((e) => (
              <li key={e.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition">
                <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-slate-100 border border-slate-200 shrink-0">
                  <Building2 size={20} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{e.nombre}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar size={11} />
                    Registrada el {formatFechaHora(e.fecha_creacion)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
