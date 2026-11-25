import axios from 'axios'

// En dev, Vite proxy redirige /control-acceso/api al backend en :8010
// En prod (IIS bajo /control-acceso), la URL relativa funciona directo
const api = axios.create({
  baseURL: '/control-acceso/api',
  timeout: 30000,
})

// Interceptor de request — agrega JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('acceso_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de response — si el token expira, cierra sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('acceso_token')
      localStorage.removeItem('acceso_user')
      // Redirige al login solo si no estamos ya en él
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/control-acceso/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api