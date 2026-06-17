'use client'
import {
  calcFOBTotal,
  calcSubtotalDespacho,
  calcSubtotalDespachante,
  calcSubtotalAdicionales,
  calcSubtotalOtros,
  calcTotalGastos,
  calcSubtotalImpuestos,
} from '@/lib/wizard-calculations'
import { ResumenStep1 } from '@/components/wizard/ResumenStep1'
import { GastosCard } from '@/components/wizard/GastosCard'
import { OtrosGastosSection } from '@/components/wizard/OtrosGastosSection'
import { ValueCards } from '@/components/wizard/ValueCards'
import { DocumentSlots } from '@/components/wizard/DocumentSlots'
import type { GastoField } from '@/components/wizard/GastosCard'
import type { Step1Data } from '@/lib/wizard-types'
import type { OCDetalle } from '@/lib/mock-ocs'

type OCDetailFull = OCDetalle & {
  fechaDespacho?: string
  fechaPago?: string
  otrosImpuestos?: import('@/lib/wizard-types').OtroGastoRow[]
}

interface OCDetailViewProps {
  oc: OCDetailFull
}

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

export function OCDetailView({ oc }: OCDetailViewProps) {
  const step1Data: Step1Data = {
    info: {
      referenciaOC: oc.referenciaOC,
      estado: oc.estado,
      proveedor: oc.proveedor,
      emailsProveedor: oc.emailsProveedor,
      despachante: oc.despachante ?? '',
      despacho: oc.despacho,
      fechaDespacho: oc.fechaDespacho ?? '',
      emailsDespachante: oc.emailsDespachante,
      paisOrigen: oc.paisOrigen,
      fechaOC: oc.fechaOC,
      llegadaEstimada: oc.llegadaEstimada,
      fechaPago: oc.fechaPago ?? '',
      tipoCambio: oc.tipoCambio,
      divisa: oc.divisa,
      notas: oc.notas,
    },
    productos: oc.productos,
  }

  const fx = oc.divisa === 'ARS/EUR' ? 'EUR' : 'USD'
  const fobUSD = calcFOBTotal(oc.productos)
  const subtotalDespacho = calcSubtotalDespacho(oc.gastosDespacho, oc.tipoCambio)
  const subtotalDespachante = calcSubtotalDespachante(oc.gastosDespachante, oc.tipoCambio)
  const subtotalAdicionales = calcSubtotalAdicionales(oc.gastosAdicionales, oc.tipoCambio)
  const subtotalOtros = calcSubtotalOtros(oc.otrosGastos, oc.tipoCambio)
  const totalGastosUSD = calcTotalGastos(
    oc.gastosDespacho,
    oc.gastosDespachante,
    oc.gastosAdicionales,
    oc.otrosGastos,
    oc.tipoCambio
  )
  const totalImpuestosUSD = calcSubtotalImpuestos(oc.impuestos, oc.tipoCambio)

  return (
    <main className="px-4 sm:px-8 py-6 max-w-5xl mx-auto flex flex-col gap-6">
      <ResumenStep1 step1Data={step1Data} />

      <h2 className="text-base font-bold text-titulares">Gastos de importación</h2>

      <GastosCard
        titulo="Despacho"
        campos={camposDespacho}
        values={oc.gastosDespacho as unknown as Record<string, string>}
        subtotalUSD={subtotalDespacho}
        tipoCambio={oc.tipoCambio}
        fx={fx}
        readOnly
      />

      <GastosCard
        titulo="Despachante"
        campos={camposDespachante}
        values={oc.gastosDespachante as unknown as Record<string, string>}
        subtotalUSD={subtotalDespachante}
        tipoCambio={oc.tipoCambio}
        fx={fx}
        readOnly
      />

      <GastosCard
        titulo="Gastos adicionales"
        campos={camposAdicionales}
        values={oc.gastosAdicionales as unknown as Record<string, string>}
        subtotalUSD={subtotalAdicionales}
        tipoCambio={oc.tipoCambio}
        fx={fx}
        readOnly
      />

      <OtrosGastosSection
        rows={oc.otrosGastos}
        subtotalUSD={subtotalOtros}
        tipoCambio={oc.tipoCambio}
        fx={fx}
        readOnly
      />

      <h2 className="text-base font-bold text-titulares">Impuestos</h2>

      <GastosCard
        titulo="Impuestos"
        campos={camposImpuestos}
        values={oc.impuestos as unknown as Record<string, string>}
        subtotalUSD={totalImpuestosUSD}
        tipoCambio={oc.tipoCambio}
        fx={fx}
        readOnly
      >
        {oc.otrosImpuestos && oc.otrosImpuestos.length > 0 && (
          <OtrosGastosSection
            rows={oc.otrosImpuestos}
            subtotalUSD={calcSubtotalOtros(oc.otrosImpuestos, oc.tipoCambio)}
            tipoCambio={oc.tipoCambio}
            fx={fx}
            readOnly
            titulo=""
          />
        )}
      </GastosCard>

      <DocumentSlots readOnly documentos={oc.documentos} otrosDocumentos={oc.otrosDocumentos} />

      <h2 className="text-base font-bold text-titulares">Valores Finales</h2>

      <ValueCards
        fobUSD={fobUSD}
        totalGastosUSD={totalGastosUSD}
        totalImpuestosUSD={totalImpuestosUSD}
        tipoCambio={oc.tipoCambio}
        fx={fx}
      />
    </main>
  )
}
