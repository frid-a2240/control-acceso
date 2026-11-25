import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Search, UserPlus, X, Camera, Trash2, User, AlertCircle,
  Car, Plus, Loader2,
} from 'lucide-react'

import { personasService } from '../services/visitas'
import useDebounce from '../hooks/useDebounce'
import useClickFuera from '../hooks/useClickFuera'
import CamaraCaptura from './CamaraCaptura'
import FotoPersona from './FotoPersona'

const MIN_CARACTERES = 2

/**
 * @param {{
 *   personas: Array,             // visitantes ya agregados a la solicitud
 *   onAdd: (persona) => void,    // el padre agrega la persona Y sus placas
 *   onRemove: (personaId) => void,
 *   onActualizarPersona: (persona) => void,
 *   onAgregarVehiculo: (vehiculo) => void,
 * }} props
 */
export default function PersonaSelector({
  personas,
  onAdd,
  onRemove,
  onActualizarPersona,
  onAgregarVehiculo,
}) {
  const [busqueda, setBusqueda] = useState('')
  // Guardamos el término al que pertenece la respuesta para no mostrar
  // coincidencias viejas mientras se teclea.
  const [respuesta, setRespuesta] = useState({ termino: '', items: [] })
  const [buscando, setBuscando] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')
  const [modalCrear, setModalCrear] = useState(false)
  const [personaParaPlacas, setPersonaParaPlacas] = useState(null)

  const contenedorRef = useRef(null)
  const termino = useDebounce(busqueda.trim(), 300)

  useClickFuera(contenedorRef, useCallback(() => setAbierto(false), []))

  // Búsqueda incremental: con 2-3 caracteres ya salen las coincidencias
  useEffect(() => {
    if (termino.length < MIN_CARACTERES) return

    let cancelado = false
    setBuscando(true)
    setError('')
    personasService
      .listar(termino)
      .then((data) => { if (!cancelado) setRespuesta({ termino, items: data }) })
      .catch((err) => {
        if (!cancelado) setError(err.response?.data?.detail || 'Error al buscar')
      })
      .finally(() => { if (!cancelado) setBuscando(false) })
    return () => { cancelado = true }
  }, [termino])

  const alDia = respuesta.termino === termino
  const resultados = alDia ? respuesta.items : []

  const yaAgregada = (id) => personas.some((p) => p.id === id)

  const seleccionar = (p) => {
    if (yaAgregada(p.id)) return
    onAdd(p)
    setBusqueda('')
    setAbierto(false)
  }

  const cerrarCrear = (personaCreada) => {
    setModalCrear(false)
    if (personaCreada) {
      if (yaAgregada(personaCreada.id)) {
        onActualizarPersona(personaCreada)
      } else {
        onAdd(personaCreada)
      }
      setBusqueda('')
      setAbierto(false)
    }
  }

  // Placas nuevas para una persona que ya está en la solicitud
  const cerrarPlacasNuevas = (vehiculoCreado) => {
    const persona = personaParaPlacas
    setPersonaParaPlacas(null)
    if (!vehiculoCreado || !persona) return

    onActualizarPersona({
      ...persona,
      vehiculos: [...(persona.vehiculos || []), vehiculoCreado],
    })
    onAgregarVehiculo(vehiculoCreado)
  }

  const sinResultados =
    termino.length >= MIN_CARACTERES && !buscando && alDia && resultados.length === 0

  return (
    <div>
      {/* ━━━━ Buscador con dropdown ━━━━ */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1" ref={contenedorRef}>
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setAbierto(true) }}
            onFocus={() => setAbierto(true)}
            placeholder="Escribe nombre o número de INE (2 letras bastan)…"
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
          />
          {buscando && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
            />
          )}

          {abierto && termino.length >= MIN_CARACTERES && (
            <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {sinResultados ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-slate-600 mb-2">
                    Ninguna persona coincide con «{termino}».
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAbierto(false); setModalCrear(true) }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
                  >
                    <UserPlus size={14} />
                    Registrarla ahora
                  </button>
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {resultados.map((p) => {
                    const agregada = yaAgregada(p.id)
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={agregada}
                          onClick={() => seleccionar(p)}
                          className={`w-full flex items-center gap-3 p-2.5 text-left transition ${
                            agregada ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                          }`}
                        >
                          <FotoPersona persona={p} className="h-12 w-9" iconSize={16} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {p.nombre}
                            </div>
                            <div className="text-xs text-slate-500 truncate font-mono">
                              {p.tipo_identificacion}: {p.numero_identificacion}
                            </div>
                            {/* En la búsqueda sí se muestran, para confirmar
                                que es la persona correcta antes de agregarla */}
                            {p.vehiculos?.length > 0 && (
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                {p.vehiculos.map((v) => (
                                  <span
                                    key={v.id}
                                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600"
                                  >
                                    <Car size={10} />
                                    {v.placas}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {agregada && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                              Ya agregada
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalCrear(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shrink-0"
        >
          <UserPlus size={16} />
          Registrar nueva
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ━━━━ Visitantes agregados — formato del PDF: foto, nombre,
              nacionalidad e identificación ━━━━ */}
      <div className="bg-slate-50 rounded-xl p-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
          <span>Visitantes en esta solicitud</span>
          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">
            {personas.length}
          </span>
        </div>

        {personas.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400">
            Ningún visitante agregado todavía.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {personas.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-2.5"
              >
                <FotoPersona persona={p} className="h-14 w-11" iconSize={20} />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{p.nombre}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {p.nacionalidad} ·{' '}
                    <span className="font-mono">
                      {p.tipo_identificacion}: {p.numero_identificacion}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPersonaParaPlacas(p)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shrink-0"
                  title={`Registrar otras placas a nombre de ${p.nombre}`}
                >
                  <Plus size={13} />
                  Placas nuevas
                </button>

                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition shrink-0"
                  aria-label="Quitar visitante"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalCrear && (
        <ModalCrearPersona busquedaInicial={busqueda.trim()} onClose={cerrarCrear} />
      )}

      {personaParaPlacas && (
        <ModalPlacasNuevas persona={personaParaPlacas} onClose={cerrarPlacasNuevas} />
      )}
    </div>
  )
}

/** Año de 4 dígitos, hasta el modelo del año siguiente. */
function anioValido(anio) {
  const n = Number(anio)
  return /^\d{4}$/.test(anio) && n >= 1950 && n <= new Date().getFullYear() + 1
}

/** Si lo escrito son puros dígitos lo tratamos como INE, si no como nombre. */
function repartirBusqueda(texto) {
  const t = (texto || '').trim()
  if (!t) return { nombre: '', numero_identificacion: '' }
  return /^[0-9]+$/.test(t)
    ? { nombre: '', numero_identificacion: t }
    : { nombre: t, numero_identificacion: '' }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Modal para crear persona nueva (con foto y sus placas)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ModalCrearPersona({ busquedaInicial, onClose }) {
  const inicial = repartirBusqueda(busquedaInicial)
  const [form, setForm] = useState({
    nombre: inicial.nombre,
    nacionalidad: 'Mexicano',
    tipo_identificacion: 'INE',
    numero_identificacion: inicial.numero_identificacion,
  })
  const [vehiculos, setVehiculos] = useState([])
  const [fotoBase64, setFotoBase64] = useState('')
  const [camaraAbierta, setCamaraAbierta] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const setVehiculo = (i, k, v) =>
    setVehiculos((prev) => prev.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)))

  const guardar = async () => {
    setError('')
    if (!form.nombre.trim() || !form.numero_identificacion.trim()) {
      setError('Nombre y número de identificación son obligatorios.')
      return
    }
    // Un vehículo a medio llenar es un error de captura, no algo que ignorar
    const incompleto = vehiculos.find(
      (v) => !v.marca.trim() || !v.modelo.trim() || !anioValido(v.anio) || !v.placas.trim(),
    )
    if (incompleto) {
      setError('Completa marca, modelo, año (4 dígitos) y placas de cada vehículo (o quítalo).')
      return
    }
    const placas = vehiculos.map((v) => v.placas.trim().toUpperCase())
    if (new Set(placas).size !== placas.length) {
      setError('Capturaste las mismas placas dos veces.')
      return
    }

    setGuardando(true)
    try {
      const nueva = await personasService.crear({
        nombre: form.nombre.trim(),
        nacionalidad: form.nacionalidad.trim(),
        tipo_identificacion: form.tipo_identificacion,
        numero_identificacion: form.numero_identificacion.trim(),
        foto_base64: fotoBase64 || null,
        vehiculos: vehiculos.map((v, i) => ({
          marca: v.marca.trim(),
          modelo: v.modelo.trim(),
          anio: Number(v.anio),
          placas: placas[i],
        })),
      })
      onClose(nueva)
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'No se pudo registrar la persona. Revisa los datos.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-900">Registrar nueva persona</h3>
          </div>
          <button
            onClick={() => onClose(null)}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Foto — proporción de credencial */}
          <div className="flex items-center gap-4">
            {fotoBase64 ? (
              <img
                src={fotoBase64}
                alt=""
                className="h-32 w-24 rounded-xl object-cover object-center border border-slate-200"
              />
            ) : (
              <div className="h-32 w-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <User size={32} className="text-slate-400" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setCamaraAbierta(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Camera size={16} />
                {fotoBase64 ? 'Cambiar foto' : 'Tomar foto'}
              </button>
              {fotoBase64 && (
                <button
                  type="button"
                  onClick={() => setFotoBase64('')}
                  className="text-xs text-red-600 hover:underline text-left"
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>

          {/* Campos */}
          <Field label="Nombre completo" required>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              className="input"
              placeholder="Nombre y apellidos"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nacionalidad" required>
              <input
                type="text"
                value={form.nacionalidad}
                onChange={(e) => setField('nacionalidad', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Tipo de identificación" required>
              <select
                value={form.tipo_identificacion}
                onChange={(e) => setField('tipo_identificacion', e.target.value)}
                className="input"
              >
                <option>INE</option>
                <option>Pasaporte</option>
                <option>Licencia</option>
                <option>Otro</option>
              </select>
            </Field>
          </div>

          <Field label="Número de identificación" required>
            <input
              type="text"
              value={form.numero_identificacion}
              onChange={(e) => setField('numero_identificacion', e.target.value)}
              className="input font-mono"
              placeholder="INE / Pasaporte / etc."
            />
          </Field>

          {/* ━━━━ Placas de esta persona ━━━━ */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Car size={13} />
                Placas que trae
              </span>
              <button
                type="button"
                onClick={() =>
                  setVehiculos((prev) => [...prev, { marca: '', modelo: '', anio: '', placas: '' }])
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Plus size={13} />
                Agregar
              </button>
            </div>

            {vehiculos.length === 0 ? (
              <p className="text-xs text-slate-400">
                Opcional. Las placas que registres aquí quedan ligadas a esta persona y se
                autocompletan en sus próximas visitas.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {vehiculos.map((v, i) => (
                  <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <input
                      type="text"
                      value={v.marca}
                      onChange={(e) => setVehiculo(i, 'marca', e.target.value)}
                      className="input flex-1 min-w-0"
                      placeholder="Marca"
                    />
                    <input
                      type="text"
                      value={v.modelo}
                      onChange={(e) => setVehiculo(i, 'modelo', e.target.value)}
                      className="input flex-1 min-w-0"
                      placeholder="Modelo"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={v.anio}
                      onChange={(e) => setVehiculo(i, 'anio', e.target.value.replace(/\D/g, ''))}
                      className="input !w-20 shrink-0"
                      placeholder="Año"
                      aria-label="Año"
                    />
                    <input
                      type="text"
                      value={v.placas}
                      onChange={(e) => setVehiculo(i, 'placas', e.target.value.toUpperCase())}
                      className="input flex-1 min-w-0 font-mono"
                      placeholder="Placas"
                    />
                    <button
                      type="button"
                      onClick={() => setVehiculos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition shrink-0"
                      aria-label="Quitar vehículo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            onClick={() => onClose(null)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition shadow-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
          >
            {guardando ? 'Guardando…' : 'Registrar y agregar'}
          </button>
        </div>
      </div>

      <CamaraCaptura
        open={camaraAbierta}
        onClose={() => setCamaraAbierta(false)}
        onCapture={setFotoBase64}
      />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Modal: placas nuevas para una persona ya registrada
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ModalPlacasNuevas({ persona, onClose }) {
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', placas: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    setError('')
    if (!form.marca.trim() || !form.modelo.trim() || !form.placas.trim()) {
      setError('Todos los campos son obligatorios.')
      return
    }
    if (!anioValido(form.anio)) {
      setError('Escribe el año del vehículo con 4 dígitos, por ejemplo 2015.')
      return
    }
    setGuardando(true)
    try {
      const v = await personasService.agregarVehiculo(persona.id, {
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio: Number(form.anio),
        placas: form.placas.trim().toUpperCase(),
      })
      onClose(v)
    } catch (err) {
      // El backend rechaza placas que ya son de otra persona
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'No se pudieron registrar las placas. Revisa los datos.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Car size={18} className="text-slate-500" />
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">Placas nuevas</h3>
              <div className="text-xs text-slate-500">Quedarán ligadas a {persona.nombre}</div>
            </div>
          </div>
          <button
            onClick={() => onClose(null)}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <Field label="Marca" required>
            <input
              type="text"
              value={form.marca}
              onChange={(e) => setForm({ ...form, marca: e.target.value })}
              className="input"
              placeholder="Ej. HONDA"
            />
          </Field>
          <Field label="Modelo" required>
            <input
              type="text"
              value={form.modelo}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              className="input"
              placeholder="Ej. CRV"
            />
          </Field>
          <Field label="Año" required>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: e.target.value.replace(/\D/g, '') })}
              className="input"
              placeholder="Ej. 2015"
            />
          </Field>
          <Field label="Placas" required>
            <input
              type="text"
              value={form.placas}
              onChange={(e) => setForm({ ...form, placas: e.target.value.toUpperCase() })}
              className="input font-mono"
              placeholder="Ej. C55-NXG-6"
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={() => onClose(null)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition shadow-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--isp-turquesa), #009690)' }}
          >
            {guardando ? 'Guardando…' : 'Registrar placas'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
