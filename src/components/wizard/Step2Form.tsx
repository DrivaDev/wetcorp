'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Decimal } from 'decimal.js'
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
import { ResumenStep1 } from './ResumenStep1'
import { GastosCard } from './GastosCard'
import type { GastoField } from './GastosCard'
import { OtrosGastosSection } from './OtrosGastosSection'
import { ValueCards } from './ValueCards'
import { DocumentSlots } from './DocumentSlots'

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

export function Step2Form() {
  const router = useRouter()

  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [gastosDespacho, setGastosDespacho] = useState<GastosDespacho>({
    sim: '', derechos: '', otros: '', tasaEstadistica: '',
  })
  const [gastosDespachante, setGastosDespachante] = useState<GastosDespachante>({
    terminal: '', fleteInternacional: '', fleteInterno: '', senasa: '', despachante: '',
    gastosOperativos: '', gastosBancarios: '',
  })
  const [gastosAdicionales, setGastosAdicionales] = useState<GastosAdicionales>({
    depositoFiscal: '', digitalizacion: '', estanciaCamion: '',
  })
  const [otrosGastos, setOtrosGastos] = useState<OtroGastoRow[]>([])
  const [impuestos, setImpuestos] = useState<Impuestos>({
    iva: '', ivaAd: '', iibb: '', iigg: '',
  })
  const [otrosImpuestos, setOtrosImpuestos] = useState<OtroGastoRow[]>([])
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('oc-step1-draft')
    if (!raw) {
      router.replace('/importador/oc/nueva?step=1')
      return
    }
    const data: Step1Data = JSON.parse(raw)
    setStep1Data(data)
  }, [router])

  if (!step1Data) return null

  const tipoCambio = step1Data.info.tipoCambio ?? '1'

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

  const handleVolver  = () => router.push('/importador/oc/nueva?step=1')
  const handleGuardar = () => {
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
            onChange={updateDespacho}
          />

          <GastosCard
            titulo="Despachante"
            campos={camposDespachante}
            values={gastosDespachante as unknown as Record<string, string>}
            subtotalUSD={subtotalDespachante}
            tipoCambio={tipoCambio}
            onChange={updateDespachante}
          />

          <GastosCard
            titulo="Gastos adicionales"
            campos={camposAdicionales}
            values={gastosAdicionales as unknown as Record<string, string>}
            subtotalUSD={subtotalAdicionales}
            tipoCambio={tipoCambio}
            onChange={updateAdicionales}
          />

          <OtrosGastosSection
            rows={otrosGastos}
            subtotalUSD={subtotalOtros}
            tipoCambio={tipoCambio}
            onAdd={addOtroGasto}
            onRemove={removeOtroGasto}
            onChange={updateOtroGasto}
          />

          {/* Total gastos de importación */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-fondo border border-acento">
            <span className="text-sm font-bold text-titulares">Total gastos de importación</span>
            <div className="text-right">
              <p className="text-base font-bold text-titulares whitespace-nowrap">
                {formatUSD(totalGastosUSD)}
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
            subtotalUSD={calcSubtotalImpuestos(impuestos, tipoCambio)}
            tipoCambio={tipoCambio}
            onChange={updateImpuestos}
          />

          <OtrosGastosSection
            titulo="Otros impuestos"
            addLabel="Agregar impuesto"
            rows={otrosImpuestos}
            subtotalUSD={calcSubtotalOtros(otrosImpuestos, tipoCambio)}
            tipoCambio={tipoCambio}
            onAdd={addOtroImpuesto}
            onRemove={removeOtroImpuesto}
            onChange={updateOtroImpuesto}
          />
        </div>

        {/* Documentos */}
        <DocumentSlots />

        {/* Valores */}
        <ValueCards
          fobUSD={fobUSD}
          totalGastosUSD={totalGastosUSD}
          totalImpuestosUSD={totalImpuestosUSD}
          tipoCambio={tipoCambio}
        />

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
            className="bg-principal text-white font-bold px-6 py-3 rounded-lg hover:bg-titulares transition-colors min-h-[44px]"
          >
            Guardar OC
          </button>
        </div>
      </div>
    </>
  )
}
