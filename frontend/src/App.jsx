import { Routes, Route, Navigate } from 'react-router-dom'
import { ClipboardList, PlusCircle, Users, Inbox, History, Building2 } from 'lucide-react'

import PrivateRoute from './components/PrivateRoute'
import AppLayout from './layouts/AppLayout'
import { useAuth } from './contexts/AuthContext'

import Login from './pages/Login'
import MisSolicitudes from './pages/guardia/MisSolicitudes'
import NuevaSolicitud from './pages/guardia/NuevaSolicitud'
import DetalleSolicitud from './pages/guardia/DetalleSolicitud'
import Pendientes from './pages/encargado/Pendientes'
import DetalleVisita from './pages/encargado/DetalleVisita'
import Historial from './pages/encargado/Historial'
import Personas from './pages/directorio/Personas'
import Empresas from './pages/directorio/Empresas'

// Placeholder mientras armamos las páginas restantes
function Placeholder({ titulo }) {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
      <p className="text-sm text-slate-500 mt-1">Pantalla en construcción.</p>
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.rol === 'guardia' ? '/guardia' : '/encargado'} replace />
}

// ---------- Config de sidebar por rol ----------

const guardiaItems = [
  { to: '/guardia', label: 'Mis Solicitudes', icon: ClipboardList },
  { to: '/guardia/nueva', label: 'Nueva Solicitud', icon: PlusCircle },
  { to: '/guardia/personas', label: 'Personas', icon: Users },
]

const encargadoItems = [
  { to: '/encargado', label: 'Pendientes', icon: Inbox },
  { to: '/encargado/historial', label: 'Historial', icon: History },
  { to: '/encargado/personas', label: 'Personas', icon: Users },
  { to: '/encargado/empresas', label: 'Empresas', icon: Building2 },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* ━━━━━━━ Guardia ━━━━━━━ */}
      <Route
        element={
          <PrivateRoute roles={['guardia']}>
            <AppLayout items={guardiaItems} />
          </PrivateRoute>
        }
      >
        <Route path="/guardia" element={<MisSolicitudes />} />
        <Route path="/guardia/nueva" element={<NuevaSolicitud />} />
        <Route path="/guardia/visita/:id" element={<DetalleSolicitud />} />
        <Route path="/guardia/personas" element={<Personas />} />
      </Route>

      {/* ━━━━━━━ Encargado ━━━━━━━ */}
      <Route
        element={
          <PrivateRoute roles={['encargado']}>
            <AppLayout items={encargadoItems} />
          </PrivateRoute>
        }
      >
        <Route path="/encargado" element={<Pendientes />} />
<Route path="/encargado/visita/:id" element={<DetalleVisita />} />
<Route path="/encargado/historial" element={<Historial />} />
<Route path="/encargado/personas" element={<Personas />} />
<Route path="/encargado/empresas" element={<Empresas />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
