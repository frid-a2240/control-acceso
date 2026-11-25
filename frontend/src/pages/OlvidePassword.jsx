import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Mail } from 'lucide-react'

import { authService } from '../services/auth'
import isplogo from '../imports/isplogo.png'
import acceso from '../imports/acceso.png'

export default function OlvidePassword() {
  const [paso, setPaso] = useState('solicitar')  // 'solicitar' | 'restablecer' | 'listo'
  const [numeroControl, setNumeroControl] = useState('')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const solicitarFolio = async (e) => {
    e?.preventDefault?.()
    setError('')
    if (!numeroControl.trim() || !email.trim()) { setError('Ingresa tu número de control y tu correo.'); return }
    setLoading(true)
    try {
      await authService.olvidePassword({ numeroControl: numeroControl.trim(), email: email.trim() })
      setPaso('restablecer')
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  const restablecer = async (e) => {
    e?.preventDefault?.()
    setError('')
    if (!codigo.trim() || !password) { setError('Ingresa el folio y tu nueva contraseña.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    try {
      await authService.restablecerPassword({ numeroControl: numeroControl.trim(), email: email.trim(), codigo: codigo.trim(), nuevaPassword: password })
      setPaso('listo')
    } catch (err) {
      setError(err.response?.data?.detail || 'Folio o correo inválidos.')
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

          {paso === 'listo' ? (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Contraseña actualizada</h2>
              <p className="text-sm text-slate-500">
                Ya puedes iniciar sesión con tu número de control y tu nueva contraseña.
              </p>
              <Link
                to="/login"
                className="mt-2 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition text-center"
                style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
              >
                Ir a iniciar sesión
              </Link>
            </div>
          ) : paso === 'solicitar' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Olvidé mi contraseña</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ingresa tu número de control y el correo que registraste. Te enviaremos un folio para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={solicitarFolio} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="fp-control" className="text-sm font-semibold text-slate-800">
                    Número de control
                  </label>
                  <input
                    id="fp-control"
                    type="text"
                    value={numeroControl}
                    onChange={(e) => setNumeroControl(e.target.value)}
                    placeholder="Tu número de control"
                    autoFocus
                    autoComplete="username"
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="fp-email" className="text-sm font-semibold text-slate-800">
                    Correo
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    autoComplete="email"
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
                  {loading ? 'Enviando…' : 'Enviar folio por correo'}
                </button>
              </form>

              <div className="mt-5">
                <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition">
                  <ArrowLeft size={13} /> Volver a iniciar sesión
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Ingresa tu folio</h2>
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <Mail size={14} className="shrink-0 mt-0.5 text-slate-400" />
                  <span>Si <strong>{email}</strong> es el correo de tu cuenta, te llegó un folio de 6 dígitos. Cópialo aquí junto con tu nueva contraseña.</span>
                </div>
              </div>

              <form onSubmit={restablecer} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="fp-codigo" className="text-sm font-semibold text-slate-800">
                    Folio recibido por correo
                  </label>
                  <input
                    id="fp-codigo"
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej. 483920"
                    autoFocus
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono tracking-widest text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="fp-pw" className="text-sm font-semibold text-slate-800">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="fp-pw"
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
                  <label htmlFor="fp-pw2" className="text-sm font-semibold text-slate-800">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    id="fp-pw2"
                    type={showPw ? 'text' : 'password'}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
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
                  {loading ? 'Guardando…' : 'Restablecer contraseña'}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between text-xs">
                <button
                  onClick={() => setPaso('solicitar')}
                  className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-700 transition"
                >
                  <ArrowLeft size={13} /> Cambiar correo / reenviar folio
                </button>
                <Link to="/login" className="font-semibold text-slate-500 hover:text-slate-700 transition">
                  Cancelar
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
