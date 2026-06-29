import { Decimal } from 'decimal.js'
import type {
  ProductRow,
  InfoGeneralState,
  GastosDespacho,
  GastosDespachante,
  GastosAdicionales,
  OtroGastoRow,
  Impuestos,
} from './wizard-types'

export function calcTotalFila(row: ProductRow): Decimal {
  const cant = new Decimal(row.cantidad || '0')
  const val = new Decimal(row.valorUSD || '0')
  const derechos = new Decimal(row.derechos || '0')
  return cant.times(val).plus(derechos)
}

export function calcFOBTotal(rows: ProductRow[]): Decimal {
  return rows.reduce(
    (acc, row) => acc.plus(calcTotalFila(row)),
    new Decimal(0)
  )
}

export function arsToUSD(montoPesos: string, tipoCambio: string): Decimal {
  const monto = new Decimal(montoPesos || '0')
  const tc = new Decimal(tipoCambio || '1')
  if (tc.isZero()) return new Decimal(0)
  return monto.dividedBy(tc)
}

export function usdToARS(montoUSD: string, tipoCambio: string): Decimal {
  return new Decimal(montoUSD || '0').times(new Decimal(tipoCambio || '0'))
}

export function calcSubtotalDespacho(g: GastosDespacho, _tc: string): Decimal {
  return new Decimal(g.sim || '0')
    .plus(new Decimal(g.otros || '0'))
    .plus(new Decimal(g.tasaEstadistica || '0'))
}

export function calcSubtotalDespachante(g: GastosDespachante, tc: string): Decimal {
  const fleteUSD = new Decimal(g.fleteInternacional || '0')
  const terminal = arsToUSD(g.terminal, tc)
  const fleteIntARS = arsToUSD(g.fleteInterno, tc)
  const senasa = arsToUSD(g.senasa, tc)
  const despachante = arsToUSD(g.despachante, tc)
  const gastosOperativos = arsToUSD(g.gastosOperativos ?? '', tc)
  const gastosBancarios = arsToUSD(g.gastosBancarios ?? '', tc)
  return fleteUSD.plus(terminal).plus(fleteIntARS).plus(senasa).plus(despachante)
    .plus(gastosOperativos).plus(gastosBancarios)
}

export function calcSubtotalAdicionales(g: GastosAdicionales, tc: string): Decimal {
  const deposito = arsToUSD(g.depositoFiscal, tc)
  const digital = arsToUSD(g.digitalizacion, tc)
  const estancia = arsToUSD(g.estanciaCamion, tc)
  return deposito.plus(digital).plus(estancia)
}

export function calcSubtotalImpuestos(imp: Impuestos, tc: string): Decimal {
  return arsToUSD(imp.iva, tc)
    .plus(arsToUSD(imp.ivaAd, tc))
    .plus(arsToUSD(imp.iibb, tc))
    .plus(arsToUSD(imp.iigg, tc))
}

export function calcSubtotalOtros(rows: OtroGastoRow[], tc: string): Decimal {
  return rows.reduce((acc, row) => {
    if (row.divisa === 'USD') {
      return acc.plus(new Decimal(row.monto || '0'))
    }
    return acc.plus(arsToUSD(row.monto, tc))
  }, new Decimal(0))
}

export function calcTotalGastos(
  despacho: GastosDespacho,
  despachante: GastosDespachante,
  adicionales: GastosAdicionales,
  otros: OtroGastoRow[],
  tc: string
): Decimal {
  return calcSubtotalDespacho(despacho, tc)
    .plus(calcSubtotalDespachante(despachante, tc))
    .plus(calcSubtotalAdicionales(adicionales, tc))
    .plus(calcSubtotalOtros(otros, tc))
}

export function calcLandedCost(fobUSD: Decimal, gastosUSD: Decimal): Decimal {
  return fobUSD.plus(gastosUSD)
}

export interface ProductoCostoRow {
  fobRow: Decimal
  costoImport: Decimal
  costoTotal: Decimal
}

export function calcCostoImportacionPorProducto(
  productos: ProductRow[],
  totalGastosUSD: Decimal
): ProductoCostoRow[] {
  const totalFOB = calcFOBTotal(productos)
  return productos.map(p => {
    const fobRow = calcTotalFila(p)
    const costoImport = totalFOB.isZero()
      ? new Decimal(0)
      : fobRow.dividedBy(totalFOB).times(totalGastosUSD)
    return { fobRow, costoImport, costoTotal: fobRow.plus(costoImport) }
  })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim())
}

export function isStep1Valid(
  info: InfoGeneralState,
  productos: ProductRow[]
): boolean {
  const hasRequiredInfo =
    info.referenciaOC.trim() !== '' &&
    info.proveedor.trim() !== '' &&
    info.emailsProveedor.length > 0 &&
    info.emailsProveedor.every(isValidEmail) &&
    info.emailsDespachante.length > 0 &&
    info.emailsDespachante.every(isValidEmail) &&
    info.paisOrigen.trim() !== '' &&
    info.fechaOC !== '' &&
    new Decimal(info.tipoCambio || '0').greaterThan(0)

  const hasValidProducts =
    productos.length >= 1 &&
    productos.every(
      (r) =>
        r.producto.trim() !== '' &&
        new Decimal(r.cantidad || '0').greaterThan(0) &&
        new Decimal(r.valorUSD || '0').greaterThanOrEqualTo(0)
    )

  return hasRequiredInfo && hasValidProducts
}

const fmtUSD = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtARS = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtNum = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatNum(d: Decimal): string {
  return fmtNum.format(d.toNumber())
}

export function formatUSD(d: Decimal): string {
  return `USD ${fmtUSD.format(d.toNumber())}`
}

export function formatFX(d: Decimal, fx = 'USD'): string {
  return `${fx} ${fmtUSD.format(d.toNumber())}`
}

export function formatARS(d: Decimal): string {
  return `$ ${fmtARS.format(d.toNumber())}`
}
