'use client'

import { Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductRow } from '@/lib/wizard-types'
import { calcTotalFila, calcFOBTotal, calcDerechosTotal, usdToARS, formatNum, formatFX, formatARS } from '@/lib/wizard-calculations'

interface ProductosTableProps {
  productos: ProductRow[]
  tipoCambio: string
  fx?: string
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, field: keyof Omit<ProductRow, 'id'>, value: string) => void
}

const cellInput = 'h-8 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-principal rounded px-2 w-full text-sm text-texto placeholder:text-texto/40 focus:outline-none'

export function ProductosTable({
  productos,
  tipoCambio,
  fx = 'USD',
  onAdd,
  onRemove,
  onChange,
}: ProductosTableProps) {
  const fobTotal = calcFOBTotal(productos)
  const fobARS = usdToARS(fobTotal.toString(), tipoCambio)
  const derechosTotal = calcDerechosTotal(productos)

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full rounded-xl border border-acento overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-8" />
            <col />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-24" />
            <col className="w-11" />
          </colgroup>
          <thead className="bg-fondo border-b border-acento">
            <tr>
              <th className="px-2 py-3 text-xs font-medium text-titulares text-left">#</th>
              <th className="px-2 py-3 text-xs font-medium text-titulares text-left">Producto / Descripción *</th>
              <th className="px-2 py-3 text-xs font-medium text-titulares text-left whitespace-nowrap">Cant. *</th>
              <th className="px-2 py-3 text-xs font-medium text-titulares text-left whitespace-nowrap">Valor ({fx}) *</th>
              <th className="px-2 py-3 text-xs font-medium text-titulares text-right whitespace-nowrap">FOB ({fx})</th>
              <th className="px-2 py-3 text-xs font-medium text-titulares text-left whitespace-nowrap">Derechos ({fx})</th>
              <th className="px-2 py-3 text-xs font-medium text-titulares text-center"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-acento/50 hover:bg-acento/10 transition-colors duration-150"
              >
                <td className="px-2 py-2 text-xs text-texto/50 align-top pt-3">
                  {index + 1}
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-col gap-0">
                    <input
                      type="text"
                      value={row.producto}
                      placeholder="Nombre del producto"
                      onChange={(e) => onChange(row.id, 'producto', e.target.value)}
                      className={cellInput}
                    />
                    <input
                      type="text"
                      value={row.descripcion}
                      placeholder="Descripción opcional"
                      onChange={(e) => onChange(row.id, 'descripcion', e.target.value)}
                      className={cn(cellInput, 'text-xs text-texto/60')}
                    />
                  </div>
                </td>
                <td className="px-2 py-2 align-top pt-3">
                  <input
                    type="number"
                    value={row.cantidad}
                    placeholder="0"
                    min="0"
                    step="any"
                    onChange={(e) => onChange(row.id, 'cantidad', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={cellInput}
                  />
                </td>
                <td className="px-2 py-2 align-top pt-3">
                  <input
                    type="number"
                    value={row.valorUSD}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    onChange={(e) => onChange(row.id, 'valorUSD', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={cellInput}
                  />
                </td>
                <td className="px-2 py-2 align-top pt-3">
                  <div className="h-8 flex items-center justify-end font-bold text-titulares whitespace-nowrap tabular-nums">
                    {formatNum(calcTotalFila(row))}
                  </div>
                </td>
                <td className="px-2 py-2 align-top pt-3">
                  <input
                    type="number"
                    value={row.derechos}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    onChange={(e) => onChange(row.id, 'derechos', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={cellInput}
                  />
                </td>
                <td className="px-2 py-2 text-center align-top">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    disabled={productos.length === 1}
                    aria-label={productos.length === 1 ? 'No se puede eliminar el único producto' : 'Eliminar producto'}
                    className={cn(
                      'min-h-[36px] min-w-[36px] flex items-center justify-center',
                      productos.length === 1
                        ? 'text-texto/20 cursor-not-allowed'
                        : 'rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors'
                    )}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-acento bg-fondo">
              <td colSpan={4} />
              <td className="px-2 py-3 text-right">
                <span className="block text-sm font-bold text-titulares whitespace-nowrap">
                  {formatFX(fobTotal, fx)}
                </span>
                <span className="block text-xs font-normal text-titulares/60 whitespace-nowrap">
                  {formatARS(fobARS)}
                </span>
              </td>
              <td className="px-2 py-3 text-right">
                <span className="block text-sm font-bold text-titulares whitespace-nowrap">
                  {formatFX(derechosTotal, fx)}
                </span>
                <span className="block text-xs font-normal text-titulares/60 whitespace-nowrap">
                  {formatARS(usdToARS(derechosTotal.toString(), tipoCambio))}
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px]"
      >
        <Plus size={16} />
        Agregar producto
      </button>
    </div>
  )
}
