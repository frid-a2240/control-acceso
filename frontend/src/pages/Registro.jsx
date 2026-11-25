import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'

import { authService } from '../services/auth'
import isplogo from '../imports/isplogo.png'
import acceso from '../imports/acceso.png'

export default function Registro() {
  const navigate = useNavigate()

  const [numeroControl, setNumeroControl] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setError('')

    if (!numeroControl.trim() || !email.trim() || !password) {
      setError('Completa todos los campos para continuar.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await authService.registro({ numeroControl: numeroControl.trim(), email: email.trim(), password })
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-5 bg-white">
      <div className="relative hidden lg:block lg:col-span-3 overflow-hidden">
        <img src={acceso} alt="" className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-5 left-6 text-xs text-white/90">
          © {new Date().getFullYear()} ISP · Control de Acceso
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 lg:col-span-2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={isplogo} alt="ISP" className="h-16 w-auto object-contain" />
            <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--isp-azul)' }}>
              Infraestructura y Servicios Portuarios
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ color: 'var(--isp-turquesa)' }}>
              SICAPI
            </h1>
          </div>

          <div className="mb-8 h-px w-full bg-slate-200" />

          {exito ? (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Cuenta creada</h2>
              <p className="text-sm text-slate-500">
                Ya puedes iniciar sesión con tu número de control y la contraseña que elegiste.
              </p>
              <Link
                to="/login"
                className="mt-2 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition text-center"
                style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
              >
                Ir a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Crear cuenta</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Usa tu número de control para dar de alta tu acceso por primera vez.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="reg-control" className="text-sm font-semibold text-slate-800">
                    Número de control
                  </label>
                  <input
                    id="reg-control"
                    type="text"
                    value={numeroControl}
                    onChange={(e) => setNumeroControl(e.target.value)}
                    placeholder="Tu número de control"
                    autoFocus
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="reg-email" className="text-sm font-semibold text-slate-800">
                    Correo
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
                  />
                  <p className="text-[11px] text-slate-400">
                    Lo usaremos solo para recuperar tu contraseña si la olvidas.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="reg-pw" className="text-sm font-semibold text-slate-800">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="reg-pw"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="reg-pw2" className="text-sm font-semibold text-slate-800">
                    Confirmar contraseña
                  </label>
                  <input
                    id="reg-pw2"
                    type={showPw ? 'text' : 'password'}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
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
                  {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                </button>
              </form>

              <div className="mt-5">
                <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition">
                  <ArrowLeft size={13} /> Ya tengo cuenta, iniciar sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
