import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { inicioDeRol } from '../utils/roles'
import { Box, CircularProgress } from '@mui/material'

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Con la contraseña inicial solo se puede entrar a cambiarla
  if (user.debe_cambiar_password && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />
  }

  // El correo es obligatorio para recibir los avisos
  if (!user.debe_cambiar_password && !user.email && location.pathname !== '/mi-correo') {
    return <Navigate to="/mi-correo" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.rol)) {
    // Sin permiso — redirige a su home según rol
    return <Navigate to={inicioDeRol(user.rol)} replace />
  }

  return children
}