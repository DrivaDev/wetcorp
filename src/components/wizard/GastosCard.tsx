'use client'
import { Decimal } from 'decimal.js'
import { usdToARS, formatARS, formatUSD } from '@/lib/wizard-calculations'
import React from 'react'

export interface GastoField {
  key: string
  label: string
  divisa: 'ARS' | 'USD'
}

interface GastosCardProps {
  titulo: string
  campos: GastoField[]
  values: Record<string, string>
  subtotalUSD: Decimal
  tipoCambio: string
  onChange?: (key: string, value: string) => void
  readOnly?: boolean
  children?: React.ReactNode
}

const inputClass =
  'w-full px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150'

const readOnlyClass =
  'text-base font-normal text-texto bg-fondo px-3 py-2 rounded-lg border border-acento/50'

export function GastosCard({
  titulo,
  campos,
  values,
  subtotalUSD,
  tipoCambio,
  onChange,
  readOnly,
  children,
}: GastosCardProps) {
  const subtotalARS = usdToARS(subtotalUSD.toString(), tipoCambio)

  return (
    <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-4">
      <h2 className="text-base font-bold text-titulares">{titulo}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {campos.map((campo) => (
          <div key={campo.key}>
            <label className="block text-sm font-normal text-texto mb-1">
              {campo.label}
            </label>
            {readOnly ? (
              <p className={readOnlyClass}>{values[campo.key] || '—'}</p>
            ) : (
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={values[campo.key] ?? ''}
                onChange={(e) => onChange?.(campo.key, e.target.value)}
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>

      {children}

      <div className="mt-4 pt-4 border-t border-acento/50 flex justify-between items-center">
        <span className="text-sm font-normal text-titulares">Subtotal</span>
        <div className="text-right">
          <p className="text-base font-bold text-titulares">{formatUSD(subtotalUSD)}</p>
          <p className="text-sm font-normal text-titulares/60">{formatARS(subtotalARS)}</p>
        </div>
      </div>
    </div>
  )
}
