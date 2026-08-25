import { Clock, CheckCircle2, XCircle } from 'lucide-react'

/** Estilos e icono por estado — compartidos por el encargado y el guardia. */
export const estadoConfig = {
  pendiente: {
    label: 'Pendiente', icon: Clock,
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
  },
  aprobada: {
    label: 'Aprobada', icon: CheckCircle2,
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
  },
  rechazada: {
    label: 'Rechazada', icon: XCircle,
    bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
  },
}

export function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatFechaHora(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
