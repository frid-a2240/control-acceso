import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'

const RealtimeContext = createContext(null)

// Máximo de intentos de reconexión antes de rendirse
const MAX_RETRIES = 5

export function RealtimeProvider({ children }) {
  const { user, token } = useAuth()

  const [toasts, setToasts] = useState([])
  const [conectado, setConectado] = useState(false)

  const wsRef = useRef(null)
  const retryRef = useRef(0)
  const suscritosRef = useRef(new Set())  // callbacks que reciben eventos

  // ━━━━ Toast API ━━━━
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const t = {
      id,
      tipo: 'info',       // 'info' | 'success' | 'error'
      titulo: '',
      mensaje: '',
      duracion: 6000,
      ...toast,
    }
    setToasts((prev) => [...prev, t])
    if (t.duracion > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, t.duracion)
    }
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ━━━━ Subscripciones para componentes que quieren reaccionar a eventos ━━━━
  const suscribir = useCallback((callback) => {
    suscritosRef.current.add(callback)
    return () => suscritosRef.current.delete(callback)
  }, [])

  // ━━━━ Manejo del WebSocket (solo para guardias) ━━━━
  useEffect(() => {
    if (!user || user.rol !== 'guardia') {
      // Cierra WS si el usuario ya no es guardia (logout)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setConectado(false)
      return
    }

    const jwt = token()
    if (!jwt) return

    let cerradoAdrede = false

    const conectar = () => {
      // Ruta relativa al deploy — Vite proxy la enruta al backend en dev
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const url = `${proto}://${window.location.host}/control-acceso/ws/guardia?token=${encodeURIComponent(jwt)}`

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConectado(true)
        retryRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // Emite a suscritos
          suscritosRef.current.forEach((cb) => {
            try { cb(data) } catch (e) { console.error(e) }
          })
          // Dispara toast según tipo
          if (data.type === 'visita_resuelta') {
            const aprobada = data.estado === 'aprobada'
            addToast({
              tipo: aprobada ? 'success' : 'error',
              titulo: aprobada
                ? `Solicitud ${data.folio} APROBADA`
                : `Solicitud ${data.folio} RECHAZADA`,
              mensaje: data.comentario
                ? `Comentario del encargado: ${data.comentario}`
                : (aprobada
                    ? 'El acceso ha sido autorizado.'
                    : 'El acceso ha sido denegado.'),
              duracion: 10000,
            })
          }
        } catch (err) {
          console.error('WS mensaje inválido:', err)
        }
      }

      ws.onclose = () => {
        setConectado(false)
        wsRef.current = null
        // Reintenta con backoff exponencial
        if (!cerradoAdrede && retryRef.current < MAX_RETRIES) {
          const delay = Math.min(1000 * (2 ** retryRef.current), 15000)
          retryRef.current += 1
          setTimeout(conectar, delay)
        }
      }

      ws.onerror = () => {
        // El navegador loguea el error solo; onclose se dispara después
      }
    }

    conectar()

    return () => {
      cerradoAdrede = true
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [user, token, addToast])

  return (
    <RealtimeContext.Provider value={{ toasts, addToast, dismissToast, suscribir, conectado }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime debe usarse dentro de <RealtimeProvider>')
  return ctx
}