import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('acceso_token')
    const stored = localStorage.getItem('acceso_user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('acceso_user')
      }
      // Refresca rol, correo y demás: pudieron cambiar desde el último ingreso
      authService.perfil()
        .then((perfil) => {
          localStorage.setItem('acceso_user', JSON.stringify(perfil))
          setUser(perfil)
        })
        .catch(() => {})  // sin conexión se usa lo guardado; un 401 cierra sesión en api.js
        .finally(() => setLoading(false))
      return
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    // El backend usa OAuth2PasswordRequestForm — se envía como form-data
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)

    const { data } = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const userData = {
      username,
      nombre_completo: data.nombre_completo,
      rol: data.rol,
      departamento: data.departamento,
      email: data.email,
      debe_cambiar_password: data.debe_cambiar_password,
    }
    localStorage.setItem('acceso_token', data.access_token)
    localStorage.setItem('acceso_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const actualizarUsuario = (cambios) => {
    const actualizado = { ...user, ...cambios }
    localStorage.setItem('acceso_user', JSON.stringify(actualizado))
    setUser(actualizado)
  }

  const logout = () => {
    localStorage.removeItem('acceso_token')
    localStorage.removeItem('acceso_user')
    setUser(null)
  }

  const token = () => localStorage.getItem('acceso_token')

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}