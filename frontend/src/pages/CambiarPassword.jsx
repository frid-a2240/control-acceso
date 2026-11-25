import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import { inicioDeRol } from '../utils/roles'
import { authService } from '../services/auth'
import isplogo from '../imports/isplogo.png'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50'

/** Obligatoria en el primer ingreso; después se abre desde el menú lateral. */
export default function CambiarPassword() {
  const { user, logout, actualizarUsuario } = useAuth()
  const { addToast } = useRealtime()
  const navigate = useNavigate()
  const obligatorio = !!user?.debe_cambiar_password
  const faltaCorreo = !user?.email

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [email, setEmail] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const home = inicioDeRol(user?.rol)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!actual || !nueva) { setError('Completa tu contraseña actual y la nueva.'); return }
    if (nueva.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return }
    if (faltaCorreo && !email.trim()) { setError('El correo es obligatorio para recibir notificaciones.'); return }
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    try {
      await authService.cambiarPassword({
        passwordActual: actual,
        nuevaPassword: nueva,
        email: faltaCorreo ? email.trim() : null,
      })
      actualizarUsuario({
        debe_cambiar_password: false,
        email: user.email || email.trim(),
      })
      addToast({ tipo: 'success', titulo: 'Contraseña actualizada' })
      navigate(home, { replace: true })
    } catch (err) {
      const detalle = err.response?.data?.detail
      // En errores de validación (422) FastAPI manda una lista, no un texto
      setError(typeof detalle === 'string' ? detalle : 'Revisa los datos e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const volver = () => {
    if (obligatorio) {
      logout()
      navigate('/login', { replace: true })
    } else {
      navigate(home)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={isplogo} alt="ISP" className="h-14 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Cambiar contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">
            {obligatorio
              ? 'Es tu primer ingreso. Elige una contraseña personal y registra tu correo.'
              : user?.nombre_completo}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="pw-actual" className="text-sm font-semibold text-slate-800">
              Contraseña actual
            </label>
            <input
              id="pw-actual"
              type={showPw ? 'text' : 'password'}
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              autoComplete="current-password"
              autoFocus
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="pw-nueva" className="text-sm font-semibold text-slate-800">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="pw-nueva"
                type={showPw ? 'text' : 'password'}
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                disabled={loading}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="pw-confirmar" className="text-sm font-semibold text-slate-800">
              Confirmar nueva contraseña
            </label>
            <input
              id="pw-confirmar"
              type={showPw ? 'text' : 'password'}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              className={inputClass}
            />
          </div>

          {faltaCorreo && (
            <div className="flex flex-col gap-2">
              <label htmlFor="pw-email" className="text-sm font-semibold text-slate-800">
                Correo <span className="text-red-500">*</span>
              </label>
              <input
                id="pw-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-correo@ejemplo.com"
                autoComplete="email"
                disabled={loading}
                className={inputClass}
              />
              <p className="text-[11px] text-slate-400">
                Ahí te llegarán los avisos de las solicitudes y sirve para recuperar tu contraseña.
              </p>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-lg bg-[#1e293b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>

        <button
          type="button"
          onClick={volver}
          className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft size={13} /> {obligatorio ? 'Salir' : 'Volver'}
        </button>
      </div>
    </div>
  )
}
