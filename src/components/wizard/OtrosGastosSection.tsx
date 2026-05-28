'use client'
import { Decimal } from 'decimal.js'
import { Plus, Trash2 } from 'lucide-react'
import { usdToARS, formatARS } from '@/lib/wizard-calculations'
import type { OtroGastoRow } from '@/lib/wizard-types'

interface OtrosGastosSectionProps {
  rows: OtroGastoRow[]
  subtotalUSD: Decimal
  tipoCambio: string
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, field: keyof Omit<OtroGastoRow, 'id'>, value: string) => void
}

export function OtrosGastosSection({
  rows,
  subtotalUSD,
  tipoCambio,
  onAdd,
  onRemove,
  onChange,
}: OtrosGastosSectionProps) {
  const subtotalARS = usdToARS(subtotalUSD.toString(), tipoCambio)

  return (
    <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-4">
      <h2 className="text-base font-bold text-titulares">Otros gastos</h2>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Descripción del gasto"
              value={row.descripcion}
              onChange={(e) => onChange(row.id, 'descripcion', e.target.value)}
              className="flex-1 h-10 px-3 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={row.monto}
              onChange={(e) => onChange(row.id, 'monto', e.target.value)}
              className="w-[120px] h-10 px-3 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150"
            />
            <select
              value={row.divisa}
              onChange={(e) => onChange(row.id, 'divisa', e.target.value as 'ARS' | 'USD')}
              className="w-[90px] h-10 px-3 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer appearance-none"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              aria-label="Eliminar gasto"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px]"
      >
        <Plus size={16} />
        Agregar gasto
      </button>

      <div className="mt-4 pt-4 border-t border-acento/50 flex justify-between items-center">
        <span className="text-sm font-normal text-titulares">Subtotal</span>
        <div className="text-right">
          <p className="text-base font-bold text-titulares">USD {subtotalUSD.toFixed(2)}</p>
          <p className="text-sm font-normal text-titulares/60">{formatARS(subtotalARS)}</p>
        </div>
      </div>
    </div>
  )
}
