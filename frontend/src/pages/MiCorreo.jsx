import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import { inicioDeRol } from '../utils/roles'
import { authService } from '../services/auth'
import isplogo from '../imports/isplogo.png'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50'

/** Obligatoria si la cuenta no tiene correo; después se abre desde el menú. */
export default function MiCorreo() {
  const { user, logout, actualizarUsuario } = useAuth()
  const { addToast } = useRealtime()
  const navigate = useNavigate()
  const location = useLocation()
  const obligatorio = !user?.email

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Ingresa tu correo.'); return }
    if (!obligatorio && !password) { setError('Ingresa tu contraseña para cambiar el correo.'); return }

    setLoading(true)
    try {
      await authService.guardarCorreo({ email: email.trim(), passwordActual: password || null })
      // El destino se decide antes: al guardar, la pantalla deja de ser obligatoria
      const destino = location.state?.from?.pathname ?? inicioDeRol(user.rol)
      actualizarUsuario({ email: email.trim() })
      addToast({ tipo: 'success', titulo: 'Correo registrado' })
      navigate(destino, { replace: true })
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'Revisa que el correo esté bien escrito.')
    } finally {
      setLoading(false)
    }
  }

  const volver = () => {
    if (obligatorio) {
      logout()
      navigate('/login', { replace: true })
    } else {
      navigate(inicioDeRol(user?.rol))
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={isplogo} alt="ISP" className="h-14 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {obligatorio ? 'Registra tu correo' : 'Mi correo'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {obligatorio
              ? 'Es obligatorio: ahí te llegarán los avisos de las solicitudes.'
              : `Tus avisos llegan a ${user.email}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="mc-email" className="text-sm font-semibold text-slate-800">
              {obligatorio ? 'Correo' : 'Nuevo correo'}
            </label>
            <input
              id="mc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@ejemplo.com"
              autoComplete="email"
              autoFocus
              disabled={loading}
              className={inputClass}
            />
          </div>

          {!obligatorio && (
            <div className="flex flex-col gap-2">
              <label htmlFor="mc-pw" className="text-sm font-semibold text-slate-800">
                Contraseña
              </label>
              <input
                id="mc-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                className={inputClass}
              />
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
            {loading ? 'Guardando…' : 'Guardar correo'}
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
