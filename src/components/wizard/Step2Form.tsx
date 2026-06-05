'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import {
  calcSubtotalDespacho,
  calcSubtotalDespachante,
  calcSubtotalAdicionales,
  calcSubtotalOtros,
  calcSubtotalImpuestos,
  calcTotalGastos,
  calcFOBTotal,
  usdToARS,
  formatUSD,
  formatFX,
  formatARS,
} from '@/lib/wizard-calculations'
import type {
  Step1Data,
  GastosDespacho,
  GastosDespachante,
  GastosAdicionales,
  OtroGastoRow,
  Impuestos,
} from '@/lib/wizard-types'
import type { OCDetalle } from '@/lib/mock-ocs'
import { Trash2, Plus } from 'lucide-react'
import { ResumenStep1 } from './ResumenStep1'
import { GastosCard } from './GastosCard'
import type { GastoField } from './GastosCard'
import { ValueCards } from './ValueCards'
import { DocumentSlots } from './DocumentSlots'
import { updateOC } from '@/actions/oc'

const camposDespacho: GastoField[] = [
  { key: 'sim', label: 'SIM (USD)', divisa: 'USD' },
  { key: 'derechos', label: 'Derechos (USD)', divisa: 'USD' },
  { key: 'tasaEstadistica', label: 'Tasa de estadística (USD)', divisa: 'USD' },
  { key: 'otros', label: 'Otros (USD)', divisa: 'USD' },
]

const camposDespachante: GastoField[] = [
  { key: 'terminal', label: 'Terminal (ARS)', divisa: 'ARS' },
  { key: 'fleteInternacional', label: 'Flete internacional (USD)', divisa: 'USD' },
  { key: 'fleteInterno', label: 'Flete interno (ARS)', divisa: 'ARS' },
  { key: 'senasa', label: 'SENASA (ARS)', divisa: 'ARS' },
  { key: 'despachante', label: 'Despachante (ARS)', divisa: 'ARS' },
  { key: 'gastosOperativos', label: 'Gastos operativos (ARS)', divisa: 'ARS' },
  { key: 'gastosBancarios', label: 'Gastos bancarios (ARS)', divisa: 'ARS' },
]

const camposAdicionales: GastoField[] = [
  { key: 'depositoFiscal', label: 'Depósito fiscal (ARS)', divisa: 'ARS' },
  { key: 'digitalizacion', label: 'Digitalización (ARS)', divisa: 'ARS' },
  { key: 'estanciaCamion', label: 'Estancia de camión (ARS)', divisa: 'ARS' },
]

const camposImpuestos: GastoField[] = [
  { key: 'iva', label: 'IVA (ARS)', divisa: 'ARS' },
  { key: 'ivaAd', label: 'IVA ad (ARS)', divisa: 'ARS' },
  { key: 'iibb', label: 'IIBB (ARS)', divisa: 'ARS' },
  { key: 'iigg', label: 'IIGG (ARS)', divisa: 'ARS' },
]

interface Step2FormProps {
  ocData: (OCDetalle & { id?: string; otrosImpuestos?: OtroGastoRow[] }) | null
  ocId: string
}

export function Step2Form({ ocData, ocId }: Step2FormProps) {
  const router = useRouter()

  const [gastosDespacho, setGastosDespacho] = useState<GastosDespacho>(
    ocData?.gastosDespacho ?? { sim: '', derechos: '', otros: '', tasaEstadistica: '' }
  )
  const [gastosDespachante, setGastosDespachante] = useState<GastosDespachante>(
    ocData?.gastosDespachante ?? {
      terminal: '', fleteInternacional: '', fleteInterno: '', senasa: '',
      despachante: '', gastosOperativos: '', gastosBancarios: '',
    }
  )
  const [gastosAdicionales, setGastosAdicionales] = useState<GastosAdicionales>(
    ocData?.gastosAdicionales ?? { depositoFiscal: '', digitalizacion: '', estanciaCamion: '' }
  )
  const [otrosGastos, setOtrosGastos] = useState<OtroGastoRow[]>(
    ocData?.otrosGastos ?? []
  )
  const [impuestos, setImpuestos] = useState<Impuestos>(
    ocData?.impuestos ?? { iva: '', ivaAd: '', iibb: '', iigg: '' }
  )
  const [otrosImpuestos, setOtrosImpuestos] = useState<OtroGastoRow[]>(
    ocData?.otrosImpuestos ?? []
  )
  const [toastVisible, setToastVisible] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!ocData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-texto/60">
        No se encontró la OC. <a href="/importador/dashboard" className="underline">Volver al dashboard</a>
      </div>
    )
  }

  const step1Data: Step1Data = {
    info: {
      referenciaOC: ocData.referenciaOC,
      estado: ocData.estado,
      proveedor: ocData.proveedor ?? '',
      emailsProveedor: ocData.emailsProveedor ?? [''],
      despacho: ocData.despacho ?? '',
      fechaDespacho: (ocData as OCDetalle & { fechaDespacho?: string }).fechaDespacho ?? '',
      emailsDespachante: ocData.emailsDespachante ?? [''],
      paisOrigen: ocData.paisOrigen ?? '',
      fechaOC: ocData.fechaOC ?? '',
      llegadaEstimada: ocData.llegadaEstimada ?? '',
      fechaPago: (ocData as OCDetalle & { fechaPago?: string }).fechaPago ?? '',
      tipoCambio: ocData.tipoCambio ?? '',
      divisa: ocData.divisa ?? 'ARS/USD',
      notas: ocData.notas ?? '',
    },
    productos: ocData.productos ?? [],
  }

  const tipoCambio = step1Data.info.tipoCambio ?? '1'
  const divisa = step1Data.info.divisa ?? 'ARS/USD'
  const fx = divisa === 'ARS/EUR' ? 'EUR' : 'USD'

  // Gastos de importación
  const subtotalDespachoUSD  = calcSubtotalDespacho(gastosDespacho, tipoCambio)
  const subtotalDespachante  = calcSubtotalDespachante(gastosDespachante, tipoCambio)
  const subtotalAdicionales  = calcSubtotalAdicionales(gastosAdicionales, tipoCambio)
  const subtotalOtros        = calcSubtotalOtros(otrosGastos, tipoCambio)
  const totalGastosUSD       = calcTotalGastos(gastosDespacho, gastosDespachante, gastosAdicionales, otrosGastos, tipoCambio)
  const fobUSD               = calcFOBTotal(step1Data.productos)

  // Impuestos (no cuentan para costo de despacho)
  const totalImpuestosUSD = calcSubtotalImpuestos(impuestos, tipoCambio)
    .plus(calcSubtotalOtros(otrosImpuestos, tipoCambio))

  const updateDespacho    = (key: string, val: string) => setGastosDespacho(prev => ({ ...prev, [key]: val }))
  const updateDespachante = (key: string, val: string) => setGastosDespachante(prev => ({ ...prev, [key]: val }))
  const updateAdicionales = (key: string, val: string) => setGastosAdicionales(prev => ({ ...prev, [key]: val }))
  const updateImpuestos   = (key: string, val: string) => setImpuestos(prev => ({ ...prev, [key]: val }))

  const addOtroGasto    = () => setOtrosGastos(prev => [...prev, { id: crypto.randomUUID(), descripcion: '', monto: '', divisa: 'ARS' }])
  const removeOtroGasto = (id: string) => setOtrosGastos(prev => prev.filter(r => r.id !== id))
  const updateOtroGasto = (id: string, field: keyof Omit<OtroGastoRow, 'id'>, value: string) =>
    setOtrosGastos(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  const addOtroImpuesto    = () => setOtrosImpuestos(prev => [...prev, { id: crypto.randomUUID(), descripcion: '', monto: '', divisa: 'ARS' }])
  const removeOtroImpuesto = (id: string) => setOtrosImpuestos(prev => prev.filter(r => r.id !== id))
  const updateOtroImpuesto = (id: string, field: keyof Omit<OtroGastoRow, 'id'>, value: string) =>
    setOtrosImpuestos(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  const handleVolver = () => router.push(`/importador/oc/${ocId}`)

  const handleGuardar = async () => {
    setIsLoading(true)
    setServerError(null)
    const result = await updateOC(ocId, {
      gastosDespacho,
      gastosDespachante,
      gastosAdicionales,
      impuestos,
      otrosGastos,
      otrosImpuestos,
      estado: step1Data.info.estado,
    })
    setIsLoading(false)
    if ('error' in result) {
      setServerError(result.error)
      return
    }
    setToastVisible(true)
    setTimeout(() => {
      setToastVisible(false)
      router.push('/importador/dashboard')
    }, 2000)
  }

  return (
    <>
      {toastVisible && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-acento rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 text-sm font-normal text-texto">
          <CheckCircle2 size={20} className="text-principal" />
          <div>
            <p className="font-bold">OC guardada exitosamente</p>
            <p className="text-texto/60">Redirigiendo al dashboard...</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-titulares">Paso 2: Gastos y Documentos</h1>

        {/* Datos de la OC + Productos */}
        <ResumenStep1 step1Data={step1Data} />

        {/* Gastos de importación */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-titulares">Gastos de importación</h2>

          <GastosCard
            titulo="Despacho"
            campos={camposDespacho}
            values={gastosDespacho as unknown as Record<string, string>}
            subtotalUSD={subtotalDespachoUSD}
            tipoCambio={tipoCambio}
            fx={fx}
            onChange={updateDespacho}
          />

          <GastosCard
            titulo="Despachante"
            campos={camposDespachante}
            values={gastosDespachante as unknown as Record<string, string>}
            subtotalUSD={subtotalDespachante}
            tipoCambio={tipoCambio}
            fx={fx}
            onChange={updateDespachante}
          />

          <GastosCard
            titulo="Gastos adicionales"
            campos={camposAdicionales}
            values={gastosAdicionales as unknown as Record<string, string>}
            subtotalUSD={subtotalAdicionales.plus(subtotalOtros)}
            tipoCambio={tipoCambio}
            fx={fx}
            onChange={updateAdicionales}
          >
            <div className="flex flex-col gap-3 border-t border-acento/30 pt-4">
              {otrosGastos.map((row) => (
                <div key={row.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Descripción del gasto"
                    value={row.descripcion}
                    onChange={(e) => updateOtroGasto(row.id, 'descripcion', e.target.value)}
                    className="flex-1 h-10 px-3 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={row.monto}
                    onChange={(e) => updateOtroGasto(row.id, 'monto', e.target.value)}
                    className="w-[120px] h-10 px-3 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150"
                  />
                  <select
                    value={row.divisa}
                    onChange={(e) => updateOtroGasto(row.id, 'divisa', e.target.value as 'ARS' | 'USD')}
                    className="w-[90px] h-10 px-3 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer appearance-none"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">{fx}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeOtroGasto(row.id)}
                    aria-label="Eliminar gasto"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOtroGasto}
                className="flex items-center gap-2 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px]"
              >
                <Plus size={16} />
                Agregar gasto
              </button>
            </div>
          </GastosCard>

          {/* Total gastos de importación */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-fondo border border-acento">
            <span className="text-sm font-bold text-titulares">Total gastos de importación</span>
            <div className="text-right">
              <p className="text-base font-bold text-titulares whitespace-nowrap">
                {formatFX(totalGastosUSD, fx)}
              </p>
              <p className="text-sm font-normal text-titulares/60 whitespace-nowrap">
                {formatARS(usdToARS(totalGastosUSD.toString(), tipoCambio))}
              </p>
            </div>
          </div>
        </div>

        {/* Impuestos (no cuentan para el costo del despacho) */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-titulares">Impuestos</h2>
            <p className="text-sm font-normal text-texto/60 mt-0.5">
              No cuentan para el costo del despacho
            </p>
          </div>
          <GastosCard
            titulo="Impuestos"
            campos={camposImpuestos}
            values={impuestos as unknown as Record<string, string>}
            subtotalUSD={totalImpuestosUSD}
            tipoCambio={tipoCambio}
            fx={fx}
            onChange={updateImpuestos}
          >
            {/* Impuestos adicionales dinámicos */}
            <div className="flex flex-col gap-3 border-t border-acento/30 pt-4">
              {otrosImpuestos.map((row) => (
                <div key={row.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Descripción del impuesto"
                    value={row.descripcion}
                    onChange={(e) => updateOtroImpuesto(row.id, 'descripcion', e.target.value)}
                    className="flex-1 h-10 px-3 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={row.monto}
                    onChange={(e) => updateOtroImpuesto(row.id, 'monto', e.target.value)}
                    className="w-[120px] h-10 px-3 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150"
                  />
                  <select
                    value={row.divisa}
                    onChange={(e) => updateOtroImpuesto(row.id, 'divisa', e.target.value as 'ARS' | 'USD')}
                    className="w-[90px] h-10 px-3 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer appearance-none"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">{fx}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeOtroImpuesto(row.id)}
                    aria-label="Eliminar impuesto"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOtroImpuesto}
                className="flex items-center gap-2 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px]"
              >
                <Plus size={16} />
                Agregar impuesto
              </button>
            </div>
          </GastosCard>
        </div>

        {/* Documentos */}
        <DocumentSlots ocId={ocId} documentos={ocData?.documentos} otrosDocumentos={ocData?.otrosDocumentos} />

        {/* Valores */}
        <ValueCards
          fobUSD={fobUSD}
          totalGastosUSD={totalGastosUSD}
          totalImpuestosUSD={totalImpuestosUSD}
          tipoCambio={tipoCambio}
          fx={fx}
        />

        {serverError && (
          <p className="text-sm text-red-600 text-center">{serverError}</p>
        )}

        {/* Footer navegación */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-acento">
          <button
            type="button"
            onClick={handleVolver}
            className="border border-principal text-principal font-normal px-6 py-3 rounded-lg hover:bg-acento/30 transition-colors min-h-[44px]"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={isLoading}
            className="bg-principal text-white font-bold px-6 py-3 rounded-lg hover:bg-titulares transition-colors min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Guardando...' : 'Guardar OC'}
          </button>
        </div>
      </div>
    </>
  )
}
