const INICIO_POR_ROL = {
  solicitante: '/solicitante',
  opip: '/opip',
  guardia: '/guardia',
}

/** Pantalla de inicio del rol; con un rol desconocido manda al login. */
export function inicioDeRol(rol) {
  return INICIO_POR_ROL[rol] ?? '/login'
}

export const ETIQUETA_ROL = {
  solicitante: 'Solicitante',
  opip: 'OPIP',
  guardia: 'Guardia',
}

/** Roles que reciben avisos en vivo por WebSocket. */
export const ROLES_EN_VIVO = ['solicitante', 'opip', 'guardia']
