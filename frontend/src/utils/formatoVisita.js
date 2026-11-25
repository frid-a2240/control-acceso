import { Clock, CheckCircle2, XCircle } from 'lucide-react'

/** Estilos e icono por estado — compartidos por OPIP y el solicitante. */
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

/**
 * Fecha del backend → Date local. Las fechas sin hora (2026-11-25) son días
 * de calendario y las fechas con hora sin zona vienen en UTC; con `new Date`
 * directo saldrían un día antes y con horas de diferencia.
 */
export function parseFecha(iso) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(`${iso}T00:00:00`)
  return new Date(/(Z|[+-]\d{2}:\d{2})$/.test(iso) ? iso : `${iso}Z`)
}

export function formatHora(iso) {
  return parseFecha(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export function formatFecha(iso) {
  return parseFecha(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatFechaHora(iso) {
  return parseFecha(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
