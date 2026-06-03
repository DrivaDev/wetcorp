'use client'
import { Step1Form } from './Step1Form'
import { Step2Form } from './Step2Form'
import type { OCDetalle } from '@/lib/mock-ocs'
import type { OtroGastoRow, InfoGeneralState, ProductRow } from '@/lib/wizard-types'

interface WizardPageProps {
  initialStep: string
  ocData?: OCDetalle & { id?: string; otrosImpuestos?: OtroGastoRow[]; fechaDespacho?: string; fechaPago?: string }
  ocId?: string
  rol?: string
}

export function WizardPage({ initialStep, ocData, ocId, rol }: WizardPageProps) {
  if (initialStep === '2') {
    return <Step2Form ocData={ocData ?? null} ocId={ocId ?? ''} />
  }
  if (initialStep === '1' && ocData && ocId) {
    const info: InfoGeneralState = {
      referenciaOC: ocData.referenciaOC,
      estado: ocData.estado,
      proveedor: ocData.proveedor ?? '',
      emailsProveedor: ocData.emailsProveedor ?? [''],
      despacho: ocData.despacho ?? '',
      fechaDespacho: ocData.fechaDespacho ?? '',
      emailsDespachante: ocData.emailsDespachante ?? [''],
      paisOrigen: ocData.paisOrigen ?? '',
      fechaOC: ocData.fechaOC ?? '',
      llegadaEstimada: ocData.llegadaEstimada ?? '',
      fechaPago: ocData.fechaPago ?? '',
      tipoCambio: ocData.tipoCambio ?? '',
      divisa: ocData.divisa ?? 'ARS/USD',
      notas: ocData.notas ?? '',
    }
    const initialData: { info: InfoGeneralState; productos: ProductRow[] } = {
      info,
      productos: ocData.productos ?? [],
    }
    return <Step1Form initialData={initialData} ocId={ocId} rol={rol} />
  }
  return <Step1Form rol={rol} />
}
