import { Car } from 'lucide-react'

/**
 * Datos del vehículo — solo consulta.
 *
 * No se registra nada aquí: las placas se capturan en "Datos de las visitas",
 * a nombre del visitante, y aparecen en esta tabla con el mismo formato que
 * lleva el PDF.
 *
 * @param {{ vehiculos: Array }} props
 */
export default function VehiculosVisita({ vehiculos }) {
  if (vehiculos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <Car size={28} className="mx-auto text-slate-300 mb-2" />
        <div className="text-sm text-slate-500">Sin vehículos en esta solicitud.</div>
        <p className="text-xs text-slate-400 mt-1">
          Se llenan solos con las placas del visitante. Si trae otro carro, usa
          «Placas nuevas» en Datos de las visitas.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-slate-300 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase tracking-wider text-slate-600">
            <th className="text-left px-3 py-2">Marca</th>
            <th className="text-left px-3 py-2">Modelo</th>
            <th className="text-left px-3 py-2">Año</th>
            <th className="text-left px-3 py-2">Placas</th>
            <th className="text-left px-3 py-2">Visitante</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {vehiculos.map((v) => (
            <tr key={v.id}>
              <td className="px-3 py-2 font-semibold text-slate-900">{v.marca}</td>
              <td className="px-3 py-2 text-slate-600">{v.modelo}</td>
              <td className="px-3 py-2 text-slate-600">{v.anio ?? '—'}</td>
              <td className="px-3 py-2 text-slate-600 font-mono">{v.placas}</td>
              <td className="px-3 py-2 text-slate-600">
                {(v.personas || []).length === 0 ? (
                  <span className="text-slate-400 italic">—</span>
                ) : (
                  v.personas.map((p) => p.nombre).join(', ')
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
