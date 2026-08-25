import { useState } from 'react'
import { User } from 'lucide-react'

/** URL pública de la foto — el backend la sirve bajo /control-acceso/storage. */
function urlFoto(fotoPath) {
  if (!fotoPath) return null
  return `/control-acceso/storage/fotos/${fotoPath.split(/[\\/]/).pop()}`
}

/**
 * Foto del visitante en proporción de credencial (3:4, como la INE).
 * Si el archivo no existe muestra el ícono en vez del ícono de imagen rota.
 *
 * @param {{ persona: object, className?: string, iconSize?: number }} props
 */
export default function FotoPersona({ persona, className = 'h-12 w-9', iconSize = 18 }) {
  const [falla, setFalla] = useState(false)
  const url = urlFoto(persona?.foto_path)

  const base = `${className} rounded-lg border border-slate-200 shrink-0 bg-slate-100`

  if (!url || falla) {
    return (
      <div className={`${base} flex items-center justify-center`}>
        <User size={iconSize} className="text-slate-400" />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={persona?.nombre ? `Foto de ${persona.nombre}` : ''}
      onError={() => setFalla(true)}
      className={`${base} object-cover object-center`}
    />
  )
}
