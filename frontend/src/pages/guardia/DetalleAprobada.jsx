import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'

import { visitasService } from '../../services/visitas'
import FormatoVisita from '../../components/FormatoVisita'

const REFRESCO_MS = 15000

/** Formato completo en solo lectura; si el plazo vence mientras está abierto, se cierra. */
export default function DetalleAprobada() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [visita, setVisita] = useState(null)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      setVisita(await visitasService.obtener(id))
      setError('')
    } catch (err) {
      setVisita(null)
      setError(err.response?.data?.detail || 'Sin conexión con el sistema. No se puede verificar el acceso.')
    }
  }, [id])

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, REFRESCO_MS)
    return () => clearInterval(intervalo)
  }, [cargar])

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/guardia')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft size={14} /> Volver a aprobadas
        </button>
        {visita && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 size={16} />
            Aprobada por OPIP
          </div>
        )}
      </div>

      {error ? (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" /> {error}
        </div>
      ) : visita ? (
        <FormatoVisita visita={visita} />
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center text-slate-400">
          Cargando solicitud…
        </div>
      )}
    </div>
  )
}
