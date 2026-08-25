import api from './api'

export const visitasService = {
  crear: async (payload) => {
    const { data } = await api.post('/visitas', payload)
    return data
  },

  misSolicitudes: async () => {
    const { data } = await api.get('/visitas/mis-solicitudes')
    return data
  },

  pendientes: async () => {
    const { data } = await api.get('/visitas/pendientes')
    return data
  },

  historial: async () => {
    const { data } = await api.get('/visitas/historial')
    return data
  },

  obtener: async (id) => {
    const { data } = await api.get(`/visitas/${id}`)
    return data
  },

  resolver: async (id, aprobar, comentario) => {
    const { data } = await api.post(`/visitas/${id}/resolver`, {
      aprobar,
      comentario: comentario || null,
    })
    return data
  },

  eliminar: async (id) => {
    await api.delete(`/visitas/${id}`)
  },
}

export const personasService = {
  buscarPorIne: async (numero) => {
    try {
      const { data } = await api.get(`/personas/buscar-ine/${encodeURIComponent(numero)}`)
      return data
    } catch (err) {
      if (err.response?.status === 404) return null
      throw err
    }
  },

  listar: async (q) => {
    const { data } = await api.get('/personas', { params: q ? { q } : {} })
    return data
  },

  obtener: async (id) => {
    const { data } = await api.get(`/personas/${id}`)
    return data
  },

  crear: async (payload) => {
    const { data } = await api.post('/personas', payload)
    return data
  },

  // Liga placas (nuevas o ya existentes) a una persona ya registrada
  agregarVehiculo: async (personaId, vehiculo) => {
    const { data } = await api.post(`/personas/${personaId}/vehiculos`, vehiculo)
    return data
  },

  quitarVehiculo: async (personaId, vehiculoId) => {
    await api.delete(`/personas/${personaId}/vehiculos/${vehiculoId}`)
  },

  eliminar: async (id) => {
    await api.delete(`/personas/${id}`)
  },
}

export const empresasService = {
  listar: async (q) => {
    const { data } = await api.get('/empresas', { params: q ? { q } : {} })
    return data
  },

  crear: async (nombre) => {
    const { data } = await api.post('/empresas', { nombre })
    return data
  },

  eliminar: async (id) => {
    await api.delete(`/empresas/${id}`)
  },
}

// Los vehículos son de solo consulta: se dan de alta a través de su dueño
// con personasService.crear / personasService.agregarVehiculo.
export const vehiculosService = {
  buscarPorPlacas: async (placas) => {
    try {
      const { data } = await api.get(`/vehiculos/buscar-placas/${encodeURIComponent(placas)}`)
      return data
    } catch (err) {
      if (err.response?.status === 404) return null
      throw err
    }
  },

  listar: async (q, personaId) => {
    const params = {}
    if (q) params.q = q
    if (personaId) params.persona_id = personaId
    const { data } = await api.get('/vehiculos', { params })
    return data
  },

  eliminar: async (id) => {
    await api.delete(`/vehiculos/${id}`)
  },
}