'use client'
import { Decimal } from 'decimal.js'
import { calcTotalFila, calcFOBTotal, formatUSD, formatARS, usdToARS } from '@/lib/wizard-calculations'
import type { Step1Data } from '@/lib/wizard-types'
import type { EstadoOC } from '@/lib/mock-ocs'

interface ResumenStep1Props {
  step1Data: Step1Data
}

function getBadgeClasses(estado: EstadoOC): string {
  const base = 'text-sm px-2 py-0.5 rounded-full'
  const map: Record<EstadoOC, string> = {
    borrador:    `${base} bg-fondo text-titulares border border-acento font-normal`,
    en_proceso:  `${base} bg-acento/50 text-titulares font-normal`,
    en_transito: `${base} bg-acento text-titulares font-normal`,
    en_aduana:   `${base} bg-principal/20 text-titulares font-normal`,
    entregada:   `${base} bg-principal/10 text-principal font-normal`,
    cancelada:   `${base} bg-texto/10 text-texto font-normal line-through`,
  }
  return map[estado]
}

const ESTADO_LABELS: Record<EstadoOC, string> = {
  borrador:    'Borrador',
  en_proceso:  'En proceso',
  en_transito: 'En tránsito',
  en_aduana:   'En aduana',
  entregada:   'Entregada',
  cancelada:   'Cancelada',
}

const readOnlyClass = 'text-base font-normal text-texto bg-fondo px-3 py-2 rounded-lg border border-acento/50'

export function ResumenStep1({ step1Data }: ResumenStep1Props) {
  const { info, productos } = step1Data
  const fobUSD = calcFOBTotal(productos)
  const fobARS = usdToARS(fobUSD.toString(), info.tipoCambio)

  return (
    <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-6">
      <h2 className="text-base font-bold text-titulares">Resumen del Paso 1</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-normal text-titulares mb-1">Referencia OC</p>
          <p className={readOnlyClass}>{info.referenciaOC || '—'}</p>
        </div>
        <div>
          <p className="text-sm font-normal text-titulares mb-1">Estado</p>
          <p className="py-2">
            <span className={getBadgeClasses(info.estado)}>{ESTADO_LABELS[info.estado]}</span>
          </p>
        </div>
        <div>
          <p className="text-sm font-normal text-titulares mb-1">Proveedor</p>
          <p className={readOnlyClass}>{info.proveedor || '—'}</p>
        </div>
        <div>
          <p className="text-sm font-normal text-titulares mb-1">País de origen</p>
          <p className={readOnlyClass}>{info.paisOrigen || '—'}</p>
        </div>
        <div>
          <p className="text-sm font-normal text-titulares mb-1">Fecha OC</p>
          <p className={readOnlyClass}>{info.fechaOC || '—'}</p>
        </div>
        <div>
          <p className="text-sm font-normal text-titulares mb-1">Llegada estimada</p>
          <p className={readOnlyClass}>{info.llegadaEstimada || '—'}</p>
        </div>
        <div>
          <p className="text-sm font-normal text-titulares mb-1">Tipo de cambio</p>
          <p className={readOnlyClass}>{info.tipoCambio ? `$ ${info.tipoCambio} (${info.divisa})` : '—'}</p>
        </div>
        {info.notas && (
          <div className="sm:col-span-2">
            <p className="text-sm font-normal text-titulares mb-1">Notas</p>
            <p className={readOnlyClass}>{info.notas}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-titulares mb-3">Productos</h3>
        <div className="overflow-x-auto rounded-xl border border-acento">
          <table className="w-full text-base min-w-[600px]">
            <thead className="bg-fondo border-b border-acento">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-normal text-titulares whitespace-nowrap w-[40px]">#</th>
                <th className="px-3 py-3 text-left text-sm font-normal text-titulares whitespace-nowrap min-w-[180px]">Producto</th>
                <th className="px-3 py-3 text-left text-sm font-normal text-titulares whitespace-nowrap min-w-[200px]">Descripción</th>
                <th className="px-3 py-3 text-left text-sm font-normal text-titulares whitespace-nowrap w-[100px]">Cantidad</th>
                <th className="px-3 py-3 text-left text-sm font-normal text-titulares whitespace-nowrap w-[140px]">Valor unit. (USD)</th>
                <th className="px-3 py-3 text-left text-sm font-normal text-titulares whitespace-nowrap w-[120px]">Total (USD)</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((row, index) => {
                const total = calcTotalFila(row)
                return (
                  <tr key={row.id} className="border-b border-acento/50">
                    <td className="px-3 py-3 text-sm font-normal text-texto/60">{index + 1}</td>
                    <td className="px-3 py-3 text-base font-normal text-texto">{row.producto}</td>
                    <td className="px-3 py-3 text-base font-normal text-texto">{row.descripcion || '—'}</td>
                    <td className="px-3 py-3 text-base font-normal text-texto">{row.cantidad}</td>
                    <td className="px-3 py-3 text-base font-normal text-texto">{row.valorUSD}</td>
                    <td className="px-3 py-3 text-base font-bold text-titulares">{total.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-acento bg-fondo">
                <td colSpan={5} className="px-3 py-3 text-right text-sm font-normal text-titulares">
                  FOB Total
                </td>
                <td className="px-3 py-3">
                  <p className="text-base font-bold text-titulares">{formatUSD(fobUSD)}</p>
                  <p className="text-sm font-normal text-titulares/60">{formatARS(fobARS)}</p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
