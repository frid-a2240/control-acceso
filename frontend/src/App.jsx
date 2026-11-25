import { Routes, Route, Navigate } from 'react-router-dom'
import { ClipboardList, PlusCircle, Users, Inbox, History, Building2, ShieldCheck } from 'lucide-react'

import PrivateRoute from './components/PrivateRoute'
import AppLayout from './layouts/AppLayout'
import { useAuth } from './contexts/AuthContext'
import { inicioDeRol } from './utils/roles'

import Login from './pages/Login'
import Registro from './pages/Registro'
import OlvidePassword from './pages/OlvidePassword'
import CambiarPassword from './pages/CambiarPassword'
import MiCorreo from './pages/MiCorreo'
import MisSolicitudes from './pages/solicitante/MisSolicitudes'
import NuevaSolicitud from './pages/solicitante/NuevaSolicitud'
import DetalleSolicitud from './pages/solicitante/DetalleSolicitud'
import Pendientes from './pages/opip/Pendientes'
import DetalleVisita from './pages/opip/DetalleVisita'
import Historial from './pages/opip/Historial'
import Aprobadas from './pages/guardia/Aprobadas'
import DetalleAprobada from './pages/guardia/DetalleAprobada'
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
  return <Navigate to={inicioDeRol(user.rol)} replace />
}

// ---------- Config de sidebar por rol ----------

const solicitanteItems = [
  { to: '/solicitante', label: 'Mis Solicitudes', icon: ClipboardList },
  { to: '/solicitante/nueva', label: 'Nueva Solicitud', icon: PlusCircle },
  { to: '/solicitante/personas', label: 'Personas', icon: Users },
]

const opipItems = [
  { to: '/opip', label: 'Pendientes', icon: Inbox },
  { to: '/opip/aprobadas', label: 'Aprobadas', icon: ShieldCheck },
  { to: '/opip/historial', label: 'Historial', icon: History },
  { to: '/opip/personas', label: 'Personas', icon: Users },
  { to: '/opip/empresas', label: 'Empresas', icon: Building2 },
]

const guardiaItems = [
  { to: '/guardia', label: 'Solicitudes Aprobadas', icon: ShieldCheck },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/olvide-password" element={<OlvidePassword />} />
      <Route
        path="/cambiar-password"
        element={
          <PrivateRoute>
            <CambiarPassword />
          </PrivateRoute>
        }
      />
      <Route
        path="/mi-correo"
        element={
          <PrivateRoute>
            <MiCorreo />
          </PrivateRoute>
        }
      />

      {/* ━━━━━━━ Solicitante (coordinador / jefe de área / colaborador) ━━━━━━━ */}
      <Route
        element={
          <PrivateRoute roles={['solicitante']}>
            <AppLayout items={solicitanteItems} />
          </PrivateRoute>
        }
      >
        <Route path="/solicitante" element={<MisSolicitudes />} />
        <Route path="/solicitante/nueva" element={<NuevaSolicitud />} />
        <Route path="/solicitante/visita/:id" element={<DetalleSolicitud />} />
        <Route path="/solicitante/personas" element={<Personas />} />
      </Route>

      {/* ━━━━━━━ OPIP ━━━━━━━ */}
      <Route
        element={
          <PrivateRoute roles={['opip']}>
            <AppLayout items={opipItems} />
          </PrivateRoute>
        }
      >
        <Route path="/opip" element={<Pendientes />} />
<Route path="/opip/visita/:id" element={<DetalleVisita />} />
<Route path="/opip/aprobadas" element={<Aprobadas base="/opip" />} />
<Route path="/opip/historial" element={<Historial />} />
<Route path="/opip/personas" element={<Personas />} />
<Route path="/opip/empresas" element={<Empresas />} />
      </Route>

      {/* ━━━━━━━ Guardia — solo consulta ━━━━━━━ */}
      <Route
        element={
          <PrivateRoute roles={['guardia']}>
            <AppLayout items={guardiaItems} />
          </PrivateRoute>
        }
      >
        <Route path="/guardia" element={<Aprobadas base="/guardia" />} />
        <Route path="/guardia/visita/:id" element={<DetalleAprobada />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
