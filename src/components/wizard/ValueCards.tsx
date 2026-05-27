'use client'
import { Decimal } from 'decimal.js'
import { calcLandedCost, usdToARS, formatUSD, formatARS } from '@/lib/wizard-calculations'

interface ValueCardsProps {
  fobUSD: Decimal
  totalGastosUSD: Decimal
  tipoCambio: string
}

export function ValueCards({ fobUSD, totalGastosUSD, tipoCambio }: ValueCardsProps) {
  const landedCostUSD = calcLandedCost(fobUSD, totalGastosUSD)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-2">
        <p className="text-sm font-bold text-titulares uppercase tracking-wide">Valor FOB</p>
        <p className="text-3xl font-bold text-titulares leading-none">{formatUSD(fobUSD)}</p>
        <p className="text-sm font-normal text-titulares/60">
          {formatARS(usdToARS(fobUSD.toString(), tipoCambio))}
        </p>
      </div>

      <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-2">
        <p className="text-sm font-bold text-titulares uppercase tracking-wide">Gastos de Importación</p>
        <p className="text-3xl font-bold text-titulares leading-none">{formatUSD(totalGastosUSD)}</p>
        <p className="text-sm font-normal text-titulares/60">
          {formatARS(usdToARS(totalGastosUSD.toString(), tipoCambio))}
        </p>
      </div>

      <div className="rounded-xl border border-acento bg-fondo p-6 flex flex-col gap-2">
        <p className="text-sm font-bold text-titulares uppercase tracking-wide">Costo Landed Total</p>
        <p className="text-3xl font-bold text-titulares leading-none">{formatUSD(landedCostUSD)}</p>
        <p className="text-sm font-normal text-titulares/60">
          {formatARS(usdToARS(landedCostUSD.toString(), tipoCambio))}
        </p>
      </div>
    </div>
  )
}
