'use client'
import { calcTotalFila, calcFOBTotal, formatUSD, usdToARS, formatARS } from '@/lib/wizard-calculations'
import type { Step1Data } from '@/lib/wizard-types'
import type { EstadoOC } from '@/lib/mock-ocs'

interface ResumenStep1Props {
  step1Data: Step1Data
}

const ESTADO_LABELS: Record<EstadoOC, string> = {
  borrador: 'Borrador',
  en_proceso: 'En proceso',
  en_transito: 'En tránsito',
  en_aduana: 'En aduana',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
}

const readOnlyClass =
  'text-base font-normal text-texto bg-fondo px-3 py-2 rounded-lg border border-acento/50'

export function ResumenStep1({ step1Data }: ResumenStep1Props) {
  const { info, productos } = step1Data
  const fobUSD = calcFOBTotal(productos)
  const fobARS = usdToARS(fobUSD.toString(), info.tipoCambio)

  return (
    <div className="flex flex-col gap-6">
      {/* Datos de la OC */}
      <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-titulares">Datos de la OC</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <p className={readOnlyClass}>
              {info.tipoCambio ? `$ ${info.tipoCambio} (${info.divisa})` : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm font-normal text-titulares mb-1">Estado</p>
            <p className={readOnlyClass}>{ESTADO_LABELS[info.estado]}</p>
          </div>
          {info.notas && (
            <div className="sm:col-span-2">
              <p className="text-sm font-normal text-titulares mb-1">Notas</p>
              <p className={readOnlyClass}>{info.notas}</p>
            </div>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-titulares">Productos</h2>
        <div className="flex flex-col divide-y divide-acento/50">
          {productos.map((row) => {
            const total = calcTotalFila(row)
            return (
              <div key={row.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-base font-normal text-texto">{row.producto}</p>
                  {row.descripcion && (
                    <p className="text-sm font-normal text-texto/60">{row.descripcion}</p>
                  )}
                  <p className="text-sm font-normal text-titulares/60 mt-0.5">
                    {row.cantidad} × {row.valorUSD}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-base font-bold text-titulares whitespace-nowrap">
                    USD {total.toFixed(2)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        {/* FOB Total */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-acento">
          <span className="text-sm font-bold text-titulares">Valor FOB Total</span>
          <div className="text-right">
            <p className="text-base font-bold text-titulares whitespace-nowrap">
              {formatUSD(fobUSD)}
            </p>
            <p className="text-sm font-normal text-titulares/60 whitespace-nowrap">
              {formatARS(fobARS)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
