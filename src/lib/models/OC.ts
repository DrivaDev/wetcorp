import mongoose, { Schema } from 'mongoose'

const ProductRowSchema = new Schema(
  {
    producto: { type: String, required: true },
    descripcion: { type: String, default: '' },
    cantidad: { type: Number, required: true },
    valorUSD: { type: Number, required: true },
  },
  { _id: false }
)

const OtroDocumentoSchema = new Schema(
  {
    url: { type: String, required: true },
    slot: { type: String, required: true },
  },
  { _id: false }
)

const OtroGastoRowSchema = new Schema(
  {
    descripcion: { type: String, default: '' },
    monto: { type: Number, default: 0 },
    divisa: { type: String, enum: ['ARS', 'USD'], default: 'ARS' },
  },
  { _id: false }
)

const OCSchema = new Schema(
  {
    importadorId: { type: String, required: true, index: true },
    referenciaOC: { type: String, required: true },
    estado: {
      type: String,
      enum: ['borrador', 'en_proceso', 'en_transito', 'en_aduana', 'entregada', 'cancelada'],
      required: true,
      default: 'borrador',
    },
    proveedor: { type: String, default: '' },
    emailsProveedor: { type: [String], default: [] },
    despachante: { type: String, default: '' },
    emailsDespachante: { type: [String], default: [] },
    despacho: { type: String, default: '' },
    fechaDespacho: { type: String, default: '' },
    paisOrigen: { type: String, default: '' },
    fechaOC: { type: String, default: '' },
    llegadaEstimada: { type: String, default: '' },
    fechaPago: { type: String, default: '' },
    tipoCambio: { type: Number, default: 0 },
    divisa: { type: String, enum: ['ARS/USD', 'ARS/EUR'], default: 'ARS/USD' },
    notas: { type: String, default: '' },
    productos: { type: [ProductRowSchema], default: [] },
    gastosDespacho: {
      sim: { type: Number, default: 0 },
      derechos: { type: Number, default: 0 },
      tasaEstadistica: { type: Number, default: 0 },
      otros: { type: Number, default: 0 },
    },
    gastosDespachante: {
      terminal: { type: Number, default: 0 },
      fleteInternacional: { type: Number, default: 0 },
      fleteInterno: { type: Number, default: 0 },
      senasa: { type: Number, default: 0 },
      despachante: { type: Number, default: 0 },
      gastosOperativos: { type: Number, default: 0 },
      gastosBancarios: { type: Number, default: 0 },
    },
    gastosAdicionales: {
      depositoFiscal: { type: Number, default: 0 },
      digitalizacion: { type: Number, default: 0 },
      estanciaCamion: { type: Number, default: 0 },
    },
    impuestos: {
      iva: { type: Number, default: 0 },
      ivaAd: { type: Number, default: 0 },
      iibb: { type: Number, default: 0 },
      iigg: { type: Number, default: 0 },
    },
    otrosGastos: { type: [OtroGastoRowSchema], default: [] },
    otrosImpuestos: { type: [OtroGastoRowSchema], default: [] },
    otrosDocumentos: { type: [OtroDocumentoSchema], default: [] },
    documentos: {
      facturaProveedor: { type: String, default: null },
      facturaDespachante: { type: String, default: null },
      conocimientoEmbarque: { type: String, default: null },
      certificadoOrigen: { type: String, default: null },
      certificadoAnalisis: { type: String, default: null },
      packingList: { type: String, default: null },
      hojaSeguridad: { type: String, default: null },
      otro: { type: String, default: null },
    },
  },
  { timestamps: true }
)

OCSchema.index({ importadorId: 1, referenciaOC: 1 }, { unique: true })

export const OC = mongoose.models.OC ?? mongoose.model('OC', OCSchema)
