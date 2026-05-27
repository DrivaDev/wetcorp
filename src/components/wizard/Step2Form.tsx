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
} from '@/lib/wizard-types'
import { ResumenStep1 } from './ResumenStep1'
import { GastosCard } from './GastosCard'
import type { GastoField } from './GastosCard'
import { OtrosGastosSection } from './OtrosGastosSection'
import { ValueCards } from './ValueCards'
import { DocumentSlots } from './DocumentSlots'

const camposDespacho: GastoField[] = [
  { key: 'sim', label: 'SIM (ARS)', divisa: 'ARS' },
  { key: 'derechos', label: 'Derechos (ARS)', divisa: 'ARS' },
  { key: 'otros', label: 'Otros (ARS)', divisa: 'ARS' },
]

const camposDespachante: GastoField[] = [
  { key: 'terminal', label: 'Terminal (ARS)', divisa: 'ARS' },
  { key: 'fleteInternacional', label: 'Flete internacional (USD)', divisa: 'USD' },
  { key: 'fleteInterno', label: 'Flete interno (ARS)', divisa: 'ARS' },
  { key: 'senasa', label: 'SENASA (ARS)', divisa: 'ARS' },
  { key: 'despachante', label: 'Despachante (ARS)', divisa: 'ARS' },
]

const camposAdicionales: GastoField[] = [
  { key: 'depositoFiscal', label: 'Depósito fiscal (ARS)', divisa: 'ARS' },
  { key: 'digitalizacion', label: 'Digitalización (ARS)', divisa: 'ARS' },
  { key: 'estanciaCamion', label: 'Estancia de camión (ARS)', divisa: 'ARS' },
  { key: 'iibb', label: 'IIBB (ARS)', divisa: 'ARS' },
]

export function Step2Form() {
  const router = useRouter()

  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [gastosDespacho, setGastosDespacho] = useState<GastosDespacho>({
    sim: '', derechos: '', otros: '',
  })
  const [gastosDespachante, setGastosDespachante] = useState<GastosDespachante>({
    terminal: '', fleteInternacional: '', fleteInterno: '', senasa: '', despachante: '',
  })
  const [gastosAdicionales, setGastosAdicionales] = useState<GastosAdicionales>({
    depositoFiscal: '', digitalizacion: '', estanciaCamion: '', iibb: '',
  })
  const [otrosGastos, setOtrosGastos] = useState<OtroGastoRow[]>([])
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

  const subtotalDespachoUSD   = calcSubtotalDespacho(gastosDespacho, tipoCambio)
  const subtotalDespachante   = calcSubtotalDespachante(gastosDespachante, tipoCambio)
  const subtotalAdicionales   = calcSubtotalAdicionales(gastosAdicionales, tipoCambio)
  const subtotalOtros         = calcSubtotalOtros(otrosGastos, tipoCambio)
  const totalGastosUSD        = calcTotalGastos(gastosDespacho, gastosDespachante, gastosAdicionales, otrosGastos, tipoCambio)
  const fobUSD                = calcFOBTotal(step1Data.productos)

  const updateDespacho    = (key: string, val: string) => setGastosDespacho(prev => ({ ...prev, [key]: val }))
  const updateDespachante = (key: string, val: string) => setGastosDespachante(prev => ({ ...prev, [key]: val }))
  const updateAdicionales = (key: string, val: string) => setGastosAdicionales(prev => ({ ...prev, [key]: val }))

  const addOtroGasto = () =>
    setOtrosGastos(prev => [...prev, { id: crypto.randomUUID(), descripcion: '', monto: '', divisa: 'ARS' }])

  const removeOtroGasto = (id: string) =>
    setOtrosGastos(prev => prev.filter(r => r.id !== id))

  const updateOtroGasto = (id: string, field: keyof Omit<OtroGastoRow, 'id'>, value: string) =>
    setOtrosGastos(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  const handleVolver = () => router.push('/importador/oc/nueva?step=1')

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

        <ResumenStep1 step1Data={step1Data} />

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

        <div className="flex items-center justify-between p-4 rounded-xl bg-fondo border border-acento">
          <span className="text-sm font-bold text-titulares">Total gastos</span>
          <div className="text-right">
            <p className="text-base font-bold text-titulares">{formatUSD(totalGastosUSD)}</p>
            <p className="text-sm font-normal text-titulares/60">{formatARS(usdToARS(totalGastosUSD.toString(), tipoCambio))}</p>
          </div>
        </div>

        <DocumentSlots />

        <ValueCards
          fobUSD={fobUSD}
          totalGastosUSD={totalGastosUSD}
          tipoCambio={tipoCambio}
        />

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
