import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Calendar, Users, Car, FileText,
  Send, AlertCircle, CheckCircle2, ArrowLeft,
} from 'lucide-react'

import PersonaSelector from '../../components/PersonaSelector'
import VehiculosVisita from '../../components/VehiculosVisita'
import { visitasService } from '../../services/visitas'

export default function NuevaSolicitud() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    empresa_solicitante: '',
    justificacion: '',
    persona_a_visitar: '',
    area_a_visitar: '',
    fecha_inicio: '',
    fecha_fin: '',
    duracion_horas: '',
    hora_inicio: '',
    observaciones: '',
  })
  const [personas, setPersonas] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(null)  // objeto visita

  const variosDias = !!form.fecha_inicio && form.fecha_fin > form.fecha_inicio
  const totalDias = variosDias
    ? Math.round((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000) + 1
    : 1

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // ━━━━ Visitantes y sus placas ━━━━
  // Al agregar a una persona, las placas que ya trae registradas entran solas
  // a la solicitud — no hay que buscarlas a mano.
  const agregarPersona = (p) => {
    setPersonas((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]))
    setVehiculos((prev) => {
      const ids = new Set(prev.map((v) => v.id))
      const nuevos = (p.vehiculos || []).filter((v) => !ids.has(v.id))
      return nuevos.length ? [...prev, ...nuevos] : prev
    })
  }

  const quitarPersona = (id) => {
    const restantes = personas.filter((x) => x.id !== id)
    setPersonas(restantes)
    // Se van también sus placas, salvo que otro visitante que sigue en la
    // solicitud también las tenga registradas.
    const idsRestantes = restantes.map((x) => x.id)
    const placasDelQueSale = new Set(
      (personas.find((x) => x.id === id)?.vehiculos || []).map((v) => v.id),
    )
    setVehiculos((prev) =>
      prev.filter((v) => {
        if (!placasDelQueSale.has(v.id)) return true
        return (v.personas || []).some((duenio) => idsRestantes.includes(duenio.id))
      }),
    )
  }

  const actualizarPersona = (p) =>
    setPersonas((prev) => prev.map((x) => (x.id === p.id ? p : x)))

  const agregarVehiculo = (v) =>
    setVehiculos((prev) => (prev.some((x) => x.id === v.id) ? prev : [...prev, v]))

  const enviar = async (e) => {
    e?.preventDefault?.()
    setError('')

    // Validaciones mínimas
    if (!form.empresa_solicitante.trim()) { setError('Empresa solicitante es obligatoria.'); return }
    if (!form.justificacion.trim()) { setError('Justificación es obligatoria.'); return }
    if (!form.persona_a_visitar.trim()) { setError('Persona a visitar es obligatoria.'); return }
    if (!form.area_a_visitar.trim()) { setError('Área a visitar es obligatoria.'); return }
    if (!form.fecha_inicio || !form.fecha_fin) { setError('Fechas de inicio y fin son obligatorias.'); return }
    if (form.fecha_fin < form.fecha_inicio) { setError('La fecha fin no puede ser anterior a la de inicio.'); return }
    if (!variosDias && !form.hora_inicio) { setError('La hora de llegada es obligatoria.'); return }
    if (personas.length === 0) { setError('Agrega al menos un visitante.'); return }

    setEnviando(true)
    try {
      const payload = {
        ...form,
        duracion_horas: !variosDias && form.duracion_horas ? parseInt(form.duracion_horas, 10) : null,
        hora_inicio: variosDias ? null : form.hora_inicio,
        observaciones: form.observaciones || null,
        persona_ids: personas.map((p) => p.id),
        vehiculo_ids: vehiculos.map((v) => v.id),
      }
      const creada = await visitasService.crear(payload)
      setExito(creada)
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'No se pudo crear la solicitud. Revisa los datos.')
    } finally {
      setEnviando(false)
    }
  }

  // ━━━━ Pantalla de éxito ━━━━
  if (exito) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Solicitud enviada</h2>
          <p className="text-sm text-slate-500 mb-4">
            OPIP ha sido notificado por correo y debe aprobarla o rechazarla.
          </p>
          <div className="inline-block bg-slate-100 rounded-lg px-4 py-2 mb-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Folio</div>
            <div className="font-mono text-lg font-bold text-slate-900">{exito.folio}</div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate('/solicitante')}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Ver mis solicitudes
            </button>
            <button
              onClick={() => {
                setExito(null)
                setForm({
                  empresa_solicitante: '', justificacion: '', persona_a_visitar: '',
                  area_a_visitar: '', fecha_inicio: '', fecha_fin: '',
                  duracion_horas: '', hora_inicio: '', observaciones: '',
                })
                setPersonas([])
                setVehiculos([])
              }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
            >
              Nueva solicitud
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/solicitante')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 transition"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nueva Solicitud de Acceso</h1>
        <p className="text-sm text-slate-500 mt-1">
          Formato PDP-PPIP-F-03 · Plan de Protección de la Instalación Portuaria
        </p>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-5">
        {/* ━━━━ Datos generales ━━━━ */}
        <Card icon={Building2} title="Datos generales">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Empresa que solicita el acceso" required span={2}>
              <input
                className="input"
                value={form.empresa_solicitante}
                onChange={(e) => setField('empresa_solicitante', e.target.value)}
                placeholder="Ej. Constructora Silva S.A."
              />
            </Field>
            <Field label="Justificación de la visita" required>
              <input
                className="input"
                value={form.justificacion}
                onChange={(e) => setField('justificacion', e.target.value)}
                placeholder="Ej. Visita técnica"
              />
            </Field>
            <Field label="Persona a visitar" required>
              <input
                className="input"
                value={form.persona_a_visitar}
                onChange={(e) => setField('persona_a_visitar', e.target.value)}
                placeholder="Nombre del contacto interno"
              />
            </Field>
            <Field label="Área a visitar" required span={2}>
              <input
                className="input"
                value={form.area_a_visitar}
                onChange={(e) => setField('area_a_visitar', e.target.value)}
                placeholder="Ej. Ingeniería"
              />
            </Field>
          </div>
        </Card>

        {/* ━━━━ Tiempos ━━━━ */}
        <Card icon={Calendar} title="Tiempos de la visita">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Fecha desde" required>
              <input
                type="date"
                className="input"
                value={form.fecha_inicio}
                onChange={(e) => setField('fecha_inicio', e.target.value)}
              />
            </Field>
            <Field label="Fecha hasta" required>
              <input
                type="date"
                className="input"
                value={form.fecha_fin}
                onChange={(e) => setField('fecha_fin', e.target.value)}
              />
            </Field>
            {variosDias ? (
              <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <strong>{totalDias} días</strong> · el acceso vale de <strong>8:00 a.m. a 5:00 p.m.</strong> cada día.
              </div>
            ) : (
              <>
                <Field label="Hora de llegada" required>
                  <input
                    type="time"
                    className="input"
                    value={form.hora_inicio}
                    onChange={(e) => setField('hora_inicio', e.target.value)}
                  />
                </Field>
                <Field label="Duración en horas">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    className="input"
                    value={form.duracion_horas}
                    onChange={(e) => setField('duracion_horas', e.target.value)}
                    placeholder="Ej. 4"
                  />
                </Field>
                <p className="md:col-span-2 text-[11px] text-slate-500">
                  Las horas cuentan desde la hora de llegada. Si OPIP aprueba después de esa hora,
                  cuentan desde la aprobación. Sin horas, el acceso vale hasta terminar el día.
                </p>
              </>
            )}
          </div>
        </Card>

        {/* ━━━━ Visitantes ━━━━ */}
        <Card icon={Users} title="Datos de las visitas" subtitle="Al menos un visitante">
          <PersonaSelector
            personas={personas}
            onAdd={agregarPersona}
            onRemove={quitarPersona}
            onActualizarPersona={actualizarPersona}
            onAgregarVehiculo={agregarVehiculo}
          />
        </Card>

        {/* ━━━━ Vehículos — solo consulta ━━━━ */}
        <Card
          icon={Car}
          title="Datos del vehículo"
          subtitle="Solo consulta · se llena con las placas del visitante"
        >
          <VehiculosVisita vehiculos={vehiculos} />
        </Card>

        {/* ━━━━ Observaciones ━━━━ */}
        <Card icon={FileText} title="Observaciones" subtitle="Opcional">
          <textarea
            className="input"
            rows={3}
            value={form.observaciones}
            onChange={(e) => setField('observaciones', e.target.value)}
            placeholder="Notas adicionales sobre la visita…"
          />
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ━━━━ Submit ━━━━ */}
        <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-[var(--background)] py-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/solicitante')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition shadow-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
          >
            <Send size={16} />
            {enviando ? 'Enviando…' : 'Enviar a aprobación'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ━━━━ Subcomponentes ━━━━

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
        >
          <Icon size={16} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          {subtitle && <div className="text-[11px] text-slate-500">{subtitle}</div>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({ label, required, span, children }) {
  return (
    <label className={`flex flex-col gap-1.5 ${span === 2 ? 'md:col-span-2' : ''}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}