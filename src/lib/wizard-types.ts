import type { EstadoOC } from './mock-ocs'

export interface ProductRow {
  id: string
  producto: string
  descripcion: string
  cantidad: string
  valorUSD: string
}

export interface InfoGeneralState {
  referenciaOC: string
  estado: EstadoOC
  proveedor: string
  emailsProveedor: string[]
  despacho: string
  emailsDespachante: string[]
  paisOrigen: string
  fechaOC: string
  llegadaEstimada: string
  fechaPago: string
  tipoCambio: string
  divisa: 'ARS/USD' | 'ARS/EUR'
  notas: string
}

export interface GastosDespacho {
  sim: string
  derechos: string
  otros: string
}

export interface GastosDespachante {
  terminal: string
  fleteInternacional: string
  fleteInterno: string
  senasa: string
  despachante: string
}

export interface GastosAdicionales {
  depositoFiscal: string
  digitalizacion: string
  estanciaCamion: string
}

export interface Impuestos {
  iva: string
  ivaAd: string
  iibb: string
  iigg: string
}

export interface OtroGastoRow {
  id: string
  descripcion: string
  monto: string
  divisa: 'ARS' | 'USD'
}

export interface Step1Data {
  info: InfoGeneralState
  productos: ProductRow[]
}
