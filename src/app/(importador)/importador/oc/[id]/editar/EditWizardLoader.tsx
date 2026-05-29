'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WizardPage } from '@/components/wizard/WizardPage'
import { MOCK_OCS_DETALLE } from '@/lib/mock-ocs'
import type { Step1Data } from '@/lib/wizard-types'

interface EditWizardLoaderProps {
  ocId: string
  rol: string
}

export function EditWizardLoader({ ocId, rol }: EditWizardLoaderProps) {
  const router = useRouter()

  useEffect(() => {
    const oc = MOCK_OCS_DETALLE.find((o) => o.id === ocId)
    if (!oc) {
      router.replace(`/${rol}/dashboard`)
      return
    }
    const step1Data: Step1Data = {
      info: {
        referenciaOC: oc.referenciaOC,
        estado: oc.estado,
        proveedor: oc.proveedor,
        emailsProveedor: oc.emailsProveedor,
        despacho: oc.despacho,
        emailsDespachante: oc.emailsDespachante,
        paisOrigen: oc.paisOrigen,
        fechaOC: oc.fechaOC,
        llegadaEstimada: oc.llegadaEstimada,
        fechaPago: '',
        tipoCambio: oc.tipoCambio,
        divisa: oc.divisa,
        notas: oc.notas,
      },
      productos: oc.productos,
    }
    sessionStorage.setItem('oc-step1-draft', JSON.stringify(step1Data))
  }, [ocId, rol, router])

  return <WizardPage initialStep="1" />
}
