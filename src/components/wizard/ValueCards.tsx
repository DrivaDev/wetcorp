'use client'
import { Decimal } from 'decimal.js'
import { calcLandedCost, usdToARS, formatUSD, formatARS } from '@/lib/wizard-calculations'

interface ValueCardsProps {
  fobUSD: Decimal
  totalGastosUSD: Decimal
  totalImpuestosUSD: Decimal
  tipoCambio: string
}

function Card({
  label,
  usd,
  tipoCambio,
  highlight,
}: {
  label: string
  usd: Decimal
  tipoCambio: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-acento p-6 flex flex-col gap-2 ${
        highlight ? 'bg-fondo' : 'bg-white'
      }`}
    >
      <p className="text-sm font-bold text-titulares uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-titulares leading-none whitespace-nowrap">
        {formatUSD(usd)}
      </p>
      <p className="text-sm font-normal text-titulares/60 whitespace-nowrap">
        {formatARS(usdToARS(usd.toString(), tipoCambio))}
      </p>
    </div>
  )
}

export function ValueCards({ fobUSD, totalGastosUSD, totalImpuestosUSD, tipoCambio }: ValueCardsProps) {
  const landedCostUSD = calcLandedCost(fobUSD, totalGastosUSD)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card label="Valor FOB" usd={fobUSD} tipoCambio={tipoCambio} />
      <Card label="Gastos de Importación" usd={totalGastosUSD} tipoCambio={tipoCambio} />
      <Card label="Costo Landed Total" usd={landedCostUSD} tipoCambio={tipoCambio} highlight />
      <Card label="Total Impuestos" usd={totalImpuestosUSD} tipoCambio={tipoCambio} />
    </div>
  )
}
