import { useEffect, useRef, useState } from 'react'
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react'

/**
 * Modal para capturar una foto con la cámara.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onCapture: (dataUrl: string) => void,
 * }} props
 */
export default function CamaraCaptura({ open, onClose, onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)  // dataURL de la foto tomada
  const [starting, setStarting] = useState(false)

  // Arranca la cámara cuando el modal se abre
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setError('')
    setPreview(null)
    setStarting(true)

    const arrancar = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        setError(
          err.name === 'NotAllowedError'
            ? 'Permiso denegado. Habilita la cámara en el navegador.'
            : err.name === 'NotFoundError'
              ? 'No se detectó ninguna cámara.'
              : 'No se pudo iniciar la cámara: ' + err.message
        )
      } finally {
        if (!cancelled) setStarting(false)
      }
    }
    arrancar()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [open])

  const tomarFoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    // JPEG con calidad 0.85 — buena compresión, foto de rostro no necesita más
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPreview(dataUrl)
  }

  const confirmar = () => {
    if (!preview) return
    onCapture(preview)
    onClose()
  }

  const repetir = () => setPreview(null)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70">
      <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-900">Capturar foto</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <AlertCircle size={32} className="text-red-400" />
              <div className="text-white text-sm">{error}</div>
            </div>
          )}

          {starting && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
              Iniciando cámara…
            </div>
          )}

          {/* El <video> se mantiene montado siempre para no perder el srcObject
              del stream al volver de la vista previa (antes causaba pantalla
              negra al presionar "Repetir", porque un <video> nuevo no
              reutilizaba el stream ya abierto). Se oculta con CSS en vez de
              desmontarse. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${error || preview ? 'hidden' : ''}`}
          />
          {preview && (
            <img src={preview} alt="Vista previa" className="w-full h-full object-contain" />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Cancelar
          </button>

          {!preview ? (
            <button
              onClick={tomarFoto}
              disabled={!!error || starting}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition shadow-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
            >
              <Camera size={16} />
              Tomar foto
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={repetir}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <RotateCcw size={16} />
                Repetir
              </button>
              <button
                onClick={confirmar}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition shadow-sm"
                style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
              >
                <Check size={16} />
                Usar esta foto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}