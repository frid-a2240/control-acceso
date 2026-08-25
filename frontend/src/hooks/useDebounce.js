import { useEffect, useState } from 'react'

/** Devuelve `valor` con retraso — evita pegarle al backend en cada tecla. */
export default function useDebounce(valor, ms = 300) {
  const [debounced, setDebounced] = useState(valor)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])

  return debounced
}
