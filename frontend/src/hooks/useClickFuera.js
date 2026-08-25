import { useEffect } from 'react'

/** Ejecuta `onFuera` cuando se hace click fuera del elemento referenciado. */
export default function useClickFuera(ref, onFuera) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onFuera()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onFuera])
}
