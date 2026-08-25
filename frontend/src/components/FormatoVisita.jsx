import { Users, Car } from 'lucide-react'

import isplogo from '../imports/isplogo.png'
import FotoPersona from './FotoPersona'
import { estadoConfig, formatFecha, formatFechaHora } from '../utils/formatoVisita'

/**
 * Formato PDP-PPIP-F-03 lleno, en solo lectura.
 * Lo usan tanto el encargado (Pendientes / Historial) como el guardia
 * (Mis Solicitudes) — es el mismo documento.
 */
export default function FormatoVisita({ visita }) {
  const cfg = estadoConfig[visita.estado]
  const yaResuelta = visita.estado !== 'pendiente'

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm">
      {/* Encabezado tipo formato oficial */}
      <div className="grid grid-cols-12 border-b-2 border-slate-300">
        <div className="col-span-3 border-r border-slate-300 flex items-center justify-center p-3 bg-slate-50">
          <img src={isplogo} alt="ISP" className="h-12 w-auto" />
        </div>
        <div className="col-span-6 border-r border-slate-300 flex flex-col items-center justify-center p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-500">PETREOS DEL PACÍFICO, S.A. DE C.V.</div>
          <div className="text-sm font-bold text-slate-900 mt-1 leading-tight">
            PLAN DE PROTECCIÓN DE<br />LA INSTALACIÓN PORTUARIA
          </div>
        </div>
        <div className="col-span-3 text-[10px] text-slate-600 divide-y divide-slate-300">
          <div className="flex px-2 py-1">
            <span className="w-16 font-semibold">Fecha:</span>
            <span className="flex-1">{formatFecha(visita.fecha_creacion)}</span>
          </div>
          <div className="flex px-2 py-1">
            <span className="w-16 font-semibold">Revisión:</span>
            <span className="flex-1">00</span>
          </div>
          <div className="flex px-2 py-1">
            <span className="w-16 font-semibold">Código:</span>
            <span className="flex-1 font-mono">PDP-PPIP-F-03</span>
          </div>
          <div className="flex px-2 py-1 bg-slate-50">
            <span className="w-16 font-semibold">Folio:</span>
            <span className="flex-1 font-mono font-bold text-slate-900">{visita.folio}</span>
          </div>
        </div>
      </div>

      {/* Título */}
      <div className="text-center py-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-900 tracking-wide">
          SOLICITUD DE ACCESO TEMPORAL A LA INSTALACIÓN PORTUARIA
        </h2>
      </div>

      {/* Cuerpo del formato */}
      <div className="p-6 flex flex-col gap-4">
        <CampoFormato label="Empresa que solicita el acceso" valor={visita.empresa_solicitante} />
        <CampoFormato label="Justificación de la Visita" valor={visita.justificacion} />
        <CampoFormato label="Persona a Visitar" valor={visita.persona_a_visitar} />
        <CampoFormato label="Área a Visitar" valor={visita.area_a_visitar} />

        <div className="grid grid-cols-2 gap-4">
          <CampoFormato label="Tiempos de la Visita — Fecha del" valor={formatFecha(visita.fecha_inicio)} />
          <CampoFormato label="al" valor={formatFecha(visita.fecha_fin)} />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Duración en horas</div>
            <div className="font-semibold text-slate-900">{visita.duracion_horas ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Duración en días</div>
            <div className="font-semibold text-slate-900">{visita.duracion_dias ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Horario</div>
            <div className="font-semibold text-slate-900">{visita.horario}</div>
          </div>
        </div>

        {/* Tabla de visitantes */}
        <div className="mt-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
            <Users size={14} />
            Datos de las visitas
          </div>
          <div className="border border-slate-300 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase tracking-wider text-slate-600">
                  <th className="text-center px-2 py-2 w-16">Foto</th>
                  <th className="text-left px-3 py-2">Nombre(s)</th>
                  <th className="text-left px-3 py-2 w-32">Nacionalidad</th>
                  <th className="text-left px-3 py-2 w-56">No. Identificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visita.personas.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2">
                      <FotoPersona persona={p} className="h-14 w-11 mx-auto" iconSize={16} />
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{p.nombre}</td>
                    <td className="px-3 py-2 text-slate-600">{p.nacionalidad}</td>
                    <td className="px-3 py-2 text-slate-600 font-mono text-xs">
                      {p.tipo_identificacion}: {p.numero_identificacion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de vehículos */}
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
            <Car size={14} />
            Datos del vehículo
          </div>
          <div className="border border-slate-300 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase tracking-wider text-slate-600">
                  <th className="text-left px-3 py-2">Marca</th>
                  <th className="text-left px-3 py-2">Modelo</th>
                  <th className="text-left px-3 py-2">Placas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visita.vehiculos.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-3 py-4 text-center text-slate-400 text-xs">
                      Sin vehículos
                    </td>
                  </tr>
                ) : (
                  visita.vehiculos.map((v) => (
                    <tr key={v.id}>
                      <td className="px-3 py-2 font-semibold text-slate-900">{v.marca}</td>
                      <td className="px-3 py-2 text-slate-600">{v.modelo}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono">{v.placas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Observaciones</div>
          <div className="min-h-[3rem] text-sm text-slate-800 border-b border-slate-300 py-2">
            {visita.observaciones || <span className="text-slate-400 italic">Sin observaciones</span>}
          </div>
        </div>

        {/* Resolución del encargado */}
        {yaResuelta && (visita.comentario_resolucion || visita.fecha_resolucion) && (
          <div className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${cfg.text}`}>
              Comentario del encargado
            </div>
            <div className="text-sm text-slate-800">
              {visita.comentario_resolucion || (
                <span className="text-slate-400 italic">Sin comentario</span>
              )}
            </div>
            {visita.fecha_resolucion && (
              <div className="text-[11px] text-slate-500 mt-2">
                Resuelto el {formatFechaHora(visita.fecha_resolucion)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pie oficial */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] italic text-slate-500">
        El presente documento es implementado en cumplimiento a las prescripciones del Código PBIP.
      </div>
    </div>
  )
}

function CampoFormato({ label, valor }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-slate-200 pb-1.5">
      <span className="text-xs text-slate-500 font-semibold shrink-0">{label}:</span>
      <span className="text-sm font-bold text-slate-900 underline decoration-slate-400 decoration-1 underline-offset-2">
        {valor}
      </span>
    </div>
  )
}
