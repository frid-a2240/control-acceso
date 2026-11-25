import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LogOut, Menu, X, ChevronsLeft, KeyRound, Mail,
} from 'lucide-react'
import Toaster from '../components/Toaster'
import { useRealtime } from '../contexts/RealtimeContext'
import { useAuth } from '../contexts/AuthContext'
import { ETIQUETA_ROL, ROLES_EN_VIVO } from '../utils/roles'
import isplogo from '../imports/isplogo.png'

/**
 * @param {{ items: Array<{ to: string, label: string, icon: React.ComponentType<any> }> }} props
 */
export default function AppLayout({ items }) {
  const { user, logout } = useAuth()
  const { conectado } = useRealtime()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const rolLabel = ETIQUETA_ROL[user?.rol] ?? ''
  const rolColor = user?.rol === 'solicitante'
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-emerald-100 text-emerald-800 border-emerald-200'

  return (
    <div className="min-h-screen w-full flex bg-[var(--background)]">
      {/* ━━━━━━━━━ Sidebar ━━━━━━━━━ */}
      <aside
  className={`${collapsed ? 'w-20' : 'w-64'}
    hidden lg:flex flex-col
    bg-[var(--card)] border-r border-[var(--border)]
    transition-all duration-200 ease-out
    sticky top-0 h-screen shrink-0`}
>
        {/* Logo + colapsar */}
        <div className="flex items-center justify-between gap-2 h-16 px-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 min-w-0">
            <img src={isplogo} alt="ISP" className="h-9 w-9 object-contain shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                  Sistema ISP
                </div>
                <div
                  className="text-sm font-bold truncate"
                  style={{ color: 'var(--isp-azul)' }}
                >
                  SICAPI
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Colapsar sidebar"
          >
            <ChevronsLeft
              size={18}
              className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition
                     ${isActive
                       ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                       : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                     }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Usuario + logout */}
        <div className="border-t border-[var(--border)] p-3">
          {!collapsed ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: 'var(--isp-azul)' }}
                  >
                     {user?.nombre_completo?.charAt(0)?.toUpperCase() || '?'}
                       </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {user?.nombre_completo}
              </div>
                    {user?.departamento && (
                      <div className="text-[11px] text-slate-500 truncate">{user.departamento}</div>
                    )}
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${rolColor}`}
                      >
                    {rolLabel}
                   </span>
                 {ROLES_EN_VIVO.includes(user?.rol) && (
                <span
                   className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                       conectado
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    title={conectado ? 'Notificaciones en vivo' : 'Sin conexión en vivo'}
                    >
        <span className={`h-1.5 w-1.5 rounded-full ${conectado ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
        {conectado ? 'En vivo' : 'Offline'}
         </span>
         )}
         </div>
          </div>
              </div>
              <Link
                to="/mi-correo"
                className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                <Mail size={16} />
                Mi correo
              </Link>
              <Link
                to="/cambiar-password"
                className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                <KeyRound size={16} />
                Cambiar contraseña
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* ━━━━━━━━━ Sidebar móvil (drawer) ━━━━━━━━━ */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/50 z-40"
          />
          <aside className="lg:hidden fixed top-0 left-0 h-full w-64 bg-[var(--card)] border-r border-[var(--border)] z-50 flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <img src={isplogo} alt="ISP" className="h-8 w-8 object-contain" />
                <div className="text-sm font-bold" style={{ color: 'var(--isp-azul)' }}>
                  Control de Acceso
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="flex flex-col gap-1">
                {items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition
                         ${isActive
                           ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                           : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                         }`
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-[var(--border)] p-3">
              <Link
                to="/mi-correo"
                className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                <Mail size={16} />
                Mi correo
              </Link>
              <Link
                to="/cambiar-password"
                className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                <KeyRound size={16} />
                Cambiar contraseña
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ━━━━━━━━━ Contenido principal ━━━━━━━━━ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar móvil */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-[var(--card)] border-b border-[var(--border)]">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm font-bold" style={{ color: 'var(--isp-azul)' }}>
            Control de Acceso
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>

       <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  )
}