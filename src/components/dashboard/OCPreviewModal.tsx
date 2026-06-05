'use client'
import { useRouter } from 'next/navigation'
import { X, ArrowRight } from 'lucide-react'
import Decimal from 'decimal.js'
import {
  calcFOBTotal,
  calcTotalGastos,
  calcSubtotalImpuestos,
  calcCostoImportacionPorProducto,
  formatUSD,
} from '@/lib/wizard-calculations'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import type { SerializedOC } from '@/actions/oc'

interface OCPreviewModalProps {
  oc: SerializedOC
  rol: string
  onClose: () => void
}

export function OCPreviewModal({ oc, rol, onClose }: OCPreviewModalProps) {
  const router = useRouter()

  const tc = oc.tipoCambio ?? '0'
  const totalGastos = calcTotalGastos(
    oc.gastosDespacho,
    oc.gastosDespachante,
    oc.gastosAdicionales,
    oc.otrosGastos ?? [],
    tc
  )
  const totalImpuestos = calcSubtotalImpuestos(oc.impuestos, tc)
  const totalGastosConImp = totalGastos.plus(totalImpuestos)

  const costosRows = calcCostoImportacionPorProducto(oc.productos ?? [], totalGastosConImp)

  const totalFOB = calcFOBTotal(oc.productos ?? [])
  const totalCostoImport = costosRows.reduce((acc, r) => acc.plus(r.costoImport), new Decimal(0))
  const totalCostoTotal = costosRows.reduce((acc, r) => acc.plus(r.costoTotal), new Decimal(0))

  const fx = oc.divisa === 'ARS/EUR' ? 'EUR' : 'USD'
  const fmt = (d: Decimal) => `${fx} ${d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-acento bg-fondo">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-titulares">{oc.referenciaOC}</h2>
            <EstadoBadge estado={oc.estado} />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-texto/50 hover:text-texto hover:bg-acento/40 transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 px-6 py-3 border-b border-acento/50 bg-white text-sm text-texto/70">
          {oc.proveedor && <span><span className="font-medium text-texto">Proveedor:</span> {oc.proveedor}</span>}
          {oc.paisOrigen && <span><span className="font-medium text-texto">Origen:</span> {oc.paisOrigen}</span>}
          {oc.fechaOC && <span><span className="font-medium text-texto">Fecha OC:</span> {oc.fechaOC}</span>}
          {oc.tipoCambio && <span><span className="font-medium text-texto">TC:</span> ${oc.tipoCambio}</span>}
        </div>

        {/* Products table */}
        <div className="overflow-auto flex-1 px-6 py-4">
          {(!oc.productos || oc.productos.length === 0) ? (
            <p className="text-sm text-texto/50 text-center py-6">Sin productos cargados</p>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-acento">
                  <th className="text-left py-2 pr-4 font-medium text-titulares">Producto</th>
                  <th className="text-right py-2 px-2 font-medium text-titulares whitespace-nowrap">Cant.</th>
                  <th className="text-right py-2 px-2 font-medium text-titulares whitespace-nowrap">FOB</th>
                  <th className="text-right py-2 px-2 font-medium text-titulares whitespace-nowrap">Costo Import.</th>
                  <th className="text-right py-2 pl-2 font-medium text-titulares whitespace-nowrap">Costo Total</th>
                </tr>
              </thead>
              <tbody>
                {oc.productos.map((p, i) => {
                  const row = costosRows[i]
                  return (
                    <tr key={p.id ?? i} className="border-b border-acento/30 hover:bg-fondo/60">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-texto">{p.producto || '—'}</p>
                        {p.descripcion && <p className="text-xs text-texto/50">{p.descripcion}</p>}
                      </td>
                      <td className="py-2.5 px-2 text-right text-texto">{p.cantidad}</td>
                      <td className="py-2.5 px-2 text-right text-texto tabular-nums">{fmt(row.fobRow)}</td>
                      <td className="py-2.5 px-2 text-right text-acento-text tabular-nums">
                        <span className="text-texto/70">{fmt(row.costoImport)}</span>
                      </td>
                      <td className="py-2.5 pl-2 text-right font-semibold text-titulares tabular-nums">{fmt(row.costoTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-acento bg-fondo/50">
                  <td className="py-2.5 pr-4 font-bold text-titulares" colSpan={2}>Total</td>
                  <td className="py-2.5 px-2 text-right font-bold text-titulares tabular-nums">{fmt(totalFOB)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-titulares tabular-nums">{fmt(totalCostoImport)}</td>
                  <td className="py-2.5 pl-2 text-right font-bold text-principal tabular-nums">{fmt(totalCostoTotal)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-acento bg-fondo">
          <p className="text-xs text-texto/50">
            Costo importación distribuido proporcionalmente al FOB
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-acento text-texto text-sm font-medium hover:bg-acento/30 transition-colors min-h-[40px]"
            >
              Cerrar
            </button>
            <button
              onClick={() => { onClose(); router.push(`/${rol}/oc/${oc.id}`) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-principal text-white text-sm font-medium hover:bg-titulares transition-colors min-h-[40px]"
            >
              Visualizar a detalle <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
