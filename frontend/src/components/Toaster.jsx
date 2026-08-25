import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useRealtime } from '../contexts/RealtimeContext'

const config = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
    ring: 'ring-emerald-200',
  },
  error: {
    icon: XCircle,
    bar: 'bg-red-500',
    iconColor: 'text-red-500',
    ring: 'ring-red-200',
  },
  info: {
    icon: Info,
    bar: 'bg-blue-500',
    iconColor: 'text-blue-500',
    ring: 'ring-blue-200',
  },
}

export default function Toaster() {
  const { toasts, dismissToast } = useRealtime()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const cfg = config[t.tipo] || config.info
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 bg-white rounded-xl border border-slate-200 shadow-xl ring-4 ${cfg.ring} overflow-hidden animate-slide-in-right`}
          >
            <div className={`w-1 self-stretch ${cfg.bar}`} />
            <div className="flex-1 py-3 pr-3">
              <div className="flex items-start gap-2">
                <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconColor}`} />
                <div className="flex-1 min-w-0">
                  {t.titulo && (
                    <div className="text-sm font-bold text-slate-900 leading-tight">
                      {t.titulo}
                    </div>
                  )}
                  {t.mensaje && (
                    <div className="text-xs text-slate-600 mt-1">
                      {t.mensaje}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => dismissToast(t.id)}
                  className="p-0.5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Cerrar"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}