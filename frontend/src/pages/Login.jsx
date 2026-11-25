import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { inicioDeRol } from '../utils/roles'
import isplogo from '../imports/isplogo.png'
import acceso from '../imports/acceso.png'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setError('')
    if (!username.trim() || !password) {
      setError('Ingresa tu usuario y contraseña para continuar.')
      return
    }
    setLoading(true)
    try {
      const user = await login(username.trim(), password)
      // Redirige a la ruta previa o al home del rol
      const from = location.state?.from?.pathname
      if (from) {
        navigate(from, { replace: true })
      } else {
        navigate(inicioDeRol(user.rol), { replace: true })
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Usuario o contraseña incorrectos.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-5 bg-white">
      {/* ━━━━━━━━━ Izquierda: imagen ━━━━━━━━━ */}
      <div className="relative hidden lg:block lg:col-span-3 overflow-hidden">
        <img src={acceso} alt="" className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-5 left-6 text-xs text-white/90">
          © {new Date().getFullYear()} ISP · Control de Acceso
        </div>
      </div>

      {/* ━━━━━━━━━ Derecha: formulario ━━━━━━━━━ */}
     <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 lg:col-span-2">
        <div className="w-full max-w-md">
          {/* Marca */}
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

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Usuario */}
            <div className="flex flex-col gap-2">
              <label htmlFor="login-user" className="text-sm font-semibold text-slate-800">
                Número de control
              </label>
              <input
                id="login-user"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu número de control"
                autoFocus
                autoComplete="username"
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10 disabled:opacity-50"
              />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-2">
              <label htmlFor="login-pw" className="text-sm font-semibold text-slate-800">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-[#1e293b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-xs">
            <Link to="/olvide-password" className="font-semibold text-slate-500 hover:text-slate-700 transition">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="mt-10 text-center text-[11px] text-slate-400 lg:hidden">
            © {new Date().getFullYear()} ISP · Control de Acceso
          </div>
        </div>
      </div>
    </div>
  )
}