'use client'

import { Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductRow } from '@/lib/wizard-types'
import { calcTotalFila, calcFOBTotal, usdToARS } from '@/lib/wizard-calculations'

interface ProductosTableProps {
  productos: ProductRow[]
  tipoCambio: string
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, field: keyof Omit<ProductRow, 'id'>, value: string) => void
}

export function ProductosTable({
  productos,
  tipoCambio,
  onAdd,
  onRemove,
  onChange,
}: ProductosTableProps) {
  const fobTotal = calcFOBTotal(productos)
  const fobARS = usdToARS(fobTotal.toString(), tipoCambio)

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full overflow-x-auto rounded-xl border border-acento">
        <table className="w-full text-base min-w-[700px]">
          <thead className="bg-fondo border-b border-acento">
            <tr>
              <th className="w-[40px] px-3 py-3 text-sm font-normal text-titulares text-left whitespace-nowrap">
                #
              </th>
              <th className="min-w-[180px] px-3 py-3 text-sm font-normal text-titulares text-left whitespace-nowrap">
                Producto *
              </th>
              <th className="min-w-[200px] px-3 py-3 text-sm font-normal text-titulares text-left whitespace-nowrap">
                Descripción
              </th>
              <th className="w-[100px] px-3 py-3 text-sm font-normal text-titulares text-left whitespace-nowrap">
                Cantidad *
              </th>
              <th className="w-[140px] px-3 py-3 text-sm font-normal text-titulares text-left whitespace-nowrap">
                Valor unitario (USD) *
              </th>
              <th className="w-[120px] px-3 py-3 text-sm font-normal text-titulares text-right whitespace-nowrap">
                Total (USD)
              </th>
              <th className="w-[56px] px-3 py-3 text-sm font-normal text-titulares text-center whitespace-nowrap">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {productos.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-acento/50 hover:bg-acento/20 transition-colors duration-150"
              >
                <td className="px-3 py-2 text-sm font-normal text-texto/60">
                  {index + 1}
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={row.producto}
                    placeholder="Ej: Tela de algodón"
                    onChange={(e) => onChange(row.id, 'producto', e.target.value)}
                    className="h-9 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-principal rounded px-2 w-full text-base text-texto placeholder:text-texto/40 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={row.descripcion}
                    placeholder="Descripción opcional"
                    onChange={(e) => onChange(row.id, 'descripcion', e.target.value)}
                    className="h-9 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-principal rounded px-2 w-full text-base text-texto placeholder:text-texto/40 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={row.cantidad}
                    placeholder="0"
                    min="0"
                    step="any"
                    onChange={(e) => onChange(row.id, 'cantidad', e.target.value)}
                    className="h-9 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-principal rounded px-2 w-full text-base text-texto placeholder:text-texto/40 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={row.valorUSD}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    onChange={(e) => onChange(row.id, 'valorUSD', e.target.value)}
                    className="h-9 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-principal rounded px-2 w-full text-base text-texto placeholder:text-texto/40 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2 bg-fondo font-bold text-titulares text-right text-base">
                  {calcTotalFila(row).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    disabled={productos.length === 1}
                    aria-label={
                      productos.length === 1
                        ? 'No es posible eliminar el único producto'
                        : 'Eliminar producto'
                    }
                    className={cn(
                      'min-h-[44px] min-w-[44px] flex items-center justify-center',
                      productos.length === 1
                        ? 'text-texto/20 cursor-not-allowed'
                        : 'rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors'
                    )}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-acento bg-fondo">
              <td
                colSpan={5}
                className="px-3 py-3 text-right text-sm font-normal text-titulares"
              >
                FOB Total
              </td>
              <td className="px-3 py-3 text-right">
                <span className="block text-base font-bold text-titulares whitespace-nowrap">
                  USD {fobTotal.toFixed(2)}
                </span>
                <span className="block text-sm font-normal text-titulares/60 whitespace-nowrap">
                  $ {fobARS.toFixed(2)}
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
        + Agregar producto
      </button>
    </div>
  )
}
