'use client'
import { Decimal } from 'decimal.js'
import { calcLandedCost, usdToARS, formatFX, formatARS } from '@/lib/wizard-calculations'

interface ValueCardsProps {
  fobUSD: Decimal
  totalGastosUSD: Decimal
  totalImpuestosUSD: Decimal
  tipoCambio: string
  fx?: string
}

function Card({
  label,
  usd,
  tipoCambio,
  fx = 'USD',
  highlight,
}: {
  label: string
  usd: Decimal
  tipoCambio: string
  fx?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-acento p-4 flex flex-col gap-1.5 ${
        highlight ? 'bg-fondo' : 'bg-white'
      }`}
    >
      <p className="text-xs font-bold text-titulares uppercase tracking-wide leading-tight">{label}</p>
      <p className="text-xl font-bold text-titulares leading-none whitespace-nowrap">
        {formatFX(usd, fx)}
      </p>
      <p className="text-xs font-normal text-titulares/60 whitespace-nowrap">
        {formatARS(usdToARS(usd.toString(), tipoCambio))}
      </p>
    </div>
  )
}

export function ValueCards({ fobUSD, totalGastosUSD, totalImpuestosUSD, tipoCambio, fx = 'USD' }: ValueCardsProps) {
  const landedCostUSD = calcLandedCost(fobUSD, totalGastosUSD)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card label="Valor FOB" usd={fobUSD} tipoCambio={tipoCambio} fx={fx} />
      <Card label="Gastos importación" usd={totalGastosUSD} tipoCambio={tipoCambio} fx={fx} />
      <Card label="Costo nacionalización" usd={landedCostUSD} tipoCambio={tipoCambio} fx={fx} highlight />
      <Card label="Total Impuestos" usd={totalImpuestosUSD} tipoCambio={tipoCambio} fx={fx} />
    </div>
  )
}
