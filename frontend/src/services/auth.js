import api from './api'

export const authService = {
  registro: async ({ numeroControl, email, password }) => {
    const { data } = await api.post('/auth/registro', {
      numero_control: numeroControl,
      email,
      password,
    })
    return data
  },

  cambiarPassword: async ({ passwordActual, nuevaPassword, email }) => {
    const { data } = await api.post('/auth/cambiar-password', {
      password_actual: passwordActual,
      nueva_password: nuevaPassword,
      email,
    })
    return data
  },

  guardarCorreo: async ({ email, passwordActual }) => {
    const { data } = await api.post('/auth/mi-correo', {
      email,
      password_actual: passwordActual,
    })
    return data
  },

  perfil: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },

  olvidePassword: async ({ numeroControl, email }) => {
    const { data } = await api.post('/auth/olvide-password', {
      numero_control: numeroControl,
      email,
    })
    return data
  },

  restablecerPassword: async ({ numeroControl, email, codigo, nuevaPassword }) => {
    const { data } = await api.post('/auth/restablecer-password', {
      numero_control: numeroControl,
      email,
      codigo,
      nueva_password: nuevaPassword,
    })
    return data
  },
}
