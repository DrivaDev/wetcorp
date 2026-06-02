'use server'
export const runtime = 'nodejs'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/mongodb'
import { OC } from '@/lib/models/OC'
import type { EstadoOC, OCDetalle } from '@/lib/mock-ocs'
import type {
  InfoGeneralState,
  ProductRow,
  GastosDespacho,
  GastosDespachante,
  GastosAdicionales,
  Impuestos,
  OtroGastoRow,
} from '@/lib/wizard-types'

type SerializedOC = OCDetalle & {
  id: string
  numeroOC: string
  emailProveedor: string
  despachante: string
  emailDespachante: string
  numeroDespacho: string
  fecha: string
  importadorId: string
  fechaDespacho: string
  fechaPago: string
  otrosImpuestos: OtroGastoRow[]
}

type StatsResult = {
  totales: number
  enTransito: number
  enAduana: number
  entregadas: number
}

function defaultStats(): StatsResult {
  return { totales: 0, enTransito: 0, enAduana: 0, entregadas: 0 }
}

function toCentavos(val: string | undefined): number {
  if (!val || val.trim() === '') return 0
  return Math.round(parseFloat(val) * 100)
}

function fromCentavos(val: number | undefined): string {
  if (val === undefined || val === null || val === 0) return ''
  return (val / 100).toString()
}

function serializeOC(doc: Record<string, unknown>): SerializedOC {
  const d = doc as {
    _id: { toString(): string }
    referenciaOC: string
    proveedor: string
    emailsProveedor: string[]
    emailsDespachante: string[]
    despacho: string
    estado: string
    fechaOC: string
    createdAt: unknown
    tipoCambio: number
    divisa: string
    notas: string
    paisOrigen: string
    llegadaEstimada: string
    fechaPago: string
    fechaDespacho: string
    productos: Array<{ produto?: string; producto?: string; descripcion: string; cantidad: number; valorUSD: number }>
    gastosDespacho: Record<string, number>
    gastosDespachante: Record<string, number>
    gastosAdicionales: Record<string, number>
    impuestos: Record<string, number>
    otrosGastos: Array<{ descripcion: string; monto: number; divisa: string }>
    otrosImpuestos: Array<{ descripcion: string; monto: number; divisa: string }>
    documentos: Record<string, string | null>
    importadorId: string
  }

  const fecha = d.createdAt
    ? new Date(d.createdAt as string).toISOString().split('T')[0]
    : ''

  return {
    id: d._id.toString(),
    numeroOC: d.referenciaOC,
    proveedor: d.proveedor ?? '',
    emailProveedor: d.emailsProveedor?.[0] ?? '',
    despachante: d.despacho ?? '',
    emailDespachante: d.emailsDespachante?.[0] ?? '',
    numeroDespacho: '',
    estado: d.estado as EstadoOC,
    fecha,
    referenciaOC: d.referenciaOC,
    emailsProveedor: d.emailsProveedor ?? [],
    emailsDespachante: d.emailsDespachante ?? [],
    despacho: d.despacho ?? '',
    paisOrigen: d.paisOrigen ?? '',
    fechaOC: d.fechaOC ?? '',
    llegadaEstimada: d.llegadaEstimada ?? '',
    tipoCambio: fromCentavos(d.tipoCambio),
    divisa: (d.divisa ?? 'ARS/USD') as 'ARS/USD' | 'ARS/EUR',
    notas: d.notas ?? '',
    fechaDespacho: d.fechaDespacho ?? '',
    fechaPago: d.fechaPago ?? '',
    importadorId: d.importadorId,
    productos: (d.productos ?? []).map(p => ({
      id: crypto.randomUUID(),
      producto: p.producto ?? '',
      descripcion: p.descripcion ?? '',
      cantidad: String(p.cantidad ?? 0),
      valorUSD: fromCentavos(p.valorUSD),
    })),
    gastosDespacho: {
      sim: fromCentavos(d.gastosDespacho?.sim),
      derechos: fromCentavos(d.gastosDespacho?.derechos),
      tasaEstadistica: fromCentavos(d.gastosDespacho?.tasaEstadistica),
      otros: fromCentavos(d.gastosDespacho?.otros),
    },
    gastosDespachante: {
      terminal: fromCentavos(d.gastosDespachante?.terminal),
      fleteInternacional: fromCentavos(d.gastosDespachante?.fleteInternacional),
      fleteInterno: fromCentavos(d.gastosDespachante?.fleteInterno),
      senasa: fromCentavos(d.gastosDespachante?.senasa),
      despachante: fromCentavos(d.gastosDespachante?.despachante),
      gastosOperativos: fromCentavos(d.gastosDespachante?.gastosOperativos),
      gastosBancarios: fromCentavos(d.gastosDespachante?.gastosBancarios),
    },
    gastosAdicionales: {
      depositoFiscal: fromCentavos(d.gastosAdicionales?.depositoFiscal),
      digitalizacion: fromCentavos(d.gastosAdicionales?.digitalizacion),
      estanciaCamion: fromCentavos(d.gastosAdicionales?.estanciaCamion),
    },
    impuestos: {
      iva: fromCentavos(d.impuestos?.iva),
      ivaAd: fromCentavos(d.impuestos?.ivaAd),
      iibb: fromCentavos(d.impuestos?.iibb),
      iigg: fromCentavos(d.impuestos?.iigg),
    },
    otrosGastos: (d.otrosGastos ?? []).map(g => ({
      id: crypto.randomUUID(),
      descripcion: g.descripcion,
      monto: fromCentavos(g.monto),
      divisa: g.divisa as 'ARS' | 'USD',
    })),
    otrosImpuestos: (d.otrosImpuestos ?? []).map(g => ({
      id: crypto.randomUUID(),
      descripcion: g.descripcion,
      monto: fromCentavos(g.monto),
      divisa: g.divisa as 'ARS' | 'USD',
    })),
    documentos: {
      facturaProveedor: d.documentos?.facturaProveedor ?? null,
      facturaDespachante: d.documentos?.facturaDespachante ?? null,
      conocimientoEmbarque: d.documentos?.conocimientoEmbarque ?? null,
      certificadoOrigen: d.documentos?.certificadoOrigen ?? null,
      certificadoAnalisis: d.documentos?.certificadoAnalisis ?? null,
      otro: d.documentos?.otro ?? null,
    },
  }
}

export async function createOC(data: {
  info: InfoGeneralState
  productos: ProductRow[]
}): Promise<{ data: { id: string } } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  await connectDB()

  const existente = await OC.findOne({
    importadorId: userId,
    referenciaOC: data.info.referenciaOC.trim(),
  })
  if (existente) return { error: 'Ya existe una OC con esta referencia' }

  const emailsProveedor = data.info.emailsProveedor
    .map(e => e.toLowerCase().trim())
    .filter(e => e !== '')
  const emailsDespachante = data.info.emailsDespachante
    .map(e => e.toLowerCase().trim())
    .filter(e => e !== '')

  try {
    const oc = await OC.create({
      importadorId: userId,
      referenciaOC: data.info.referenciaOC.trim(),
      estado: 'borrador',
      proveedor: data.info.proveedor,
      emailsProveedor,
      emailsDespachante,
      despacho: data.info.despacho,
      fechaDespacho: data.info.fechaDespacho,
      paisOrigen: data.info.paisOrigen,
      fechaOC: data.info.fechaOC,
      llegadaEstimada: data.info.llegadaEstimada,
      fechaPago: data.info.fechaPago,
      tipoCambio: toCentavos(data.info.tipoCambio),
      divisa: data.info.divisa,
      notas: data.info.notas,
      productos: data.productos.map(p => ({
        producto: p.producto,
        descripcion: p.descripcion,
        cantidad: Math.round(parseFloat(p.cantidad || '0')),
        valorUSD: toCentavos(p.valorUSD),
      })),
    })
    return { data: { id: oc._id.toString() } }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message.includes('duplicate key') || err.message.includes('E11000'))
    ) {
      return { error: 'Ya existe una OC con esta referencia' }
    }
    return { error: 'Error al guardar la OC' }
  }
}

export async function getOCById(
  id: string
): Promise<{ data: { oc: SerializedOC } } | { error: string }> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { error: 'No autorizado' }
  const rol = (sessionClaims?.metadata as { role?: string })?.role

  await connectDB()

  const doc = await OC.findById(id).lean()
  if (!doc) return { error: 'OC no encontrada' }

  const oc = doc as Record<string, unknown> & {
    importadorId: string
    estado: string
    emailsProveedor: string[]
    emailsDespachante: string[]
  }

  if (rol === 'importador') {
    if (oc.importadorId !== userId) return { error: 'Sin acceso' }
  } else if (rol === 'proveedor') {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
    if (oc.estado === 'borrador') return { error: 'Sin acceso' }
    if (!oc.emailsProveedor.includes(email)) return { error: 'Sin acceso' }
  } else if (rol === 'despachante') {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
    if (oc.estado === 'borrador') return { error: 'Sin acceso' }
    if (!oc.emailsDespachante.includes(email)) return { error: 'Sin acceso' }
  }

  return { data: { oc: serializeOC(doc as Record<string, unknown>) } }
}

export async function updateOC(
  id: string,
  data: {
    gastosDespacho: GastosDespacho
    gastosDespachante: GastosDespachante
    gastosAdicionales: GastosAdicionales
    impuestos: Impuestos
    otrosGastos: OtroGastoRow[]
    otrosImpuestos: OtroGastoRow[]
    estado: EstadoOC
  }
): Promise<{ data: { id: string } } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  await connectDB()

  const existing = await OC.findById(id).lean() as { importadorId?: string } | null
  if (!existing || existing.importadorId !== userId) return { error: 'Sin acceso' }

  await OC.findByIdAndUpdate(id, {
    gastosDespacho: {
      sim: toCentavos(data.gastosDespacho.sim),
      derechos: toCentavos(data.gastosDespacho.derechos),
      tasaEstadistica: toCentavos(data.gastosDespacho.tasaEstadistica),
      otros: toCentavos(data.gastosDespacho.otros),
    },
    gastosDespachante: {
      terminal: toCentavos(data.gastosDespachante.terminal),
      fleteInternacional: toCentavos(data.gastosDespachante.fleteInternacional),
      fleteInterno: toCentavos(data.gastosDespachante.fleteInterno),
      senasa: toCentavos(data.gastosDespachante.senasa),
      despachante: toCentavos(data.gastosDespachante.despachante),
      gastosOperativos: toCentavos(data.gastosDespachante.gastosOperativos),
      gastosBancarios: toCentavos(data.gastosDespachante.gastosBancarios),
    },
    gastosAdicionales: {
      depositoFiscal: toCentavos(data.gastosAdicionales.depositoFiscal),
      digitalizacion: toCentavos(data.gastosAdicionales.digitalizacion),
      estanciaCamion: toCentavos(data.gastosAdicionales.estanciaCamion),
    },
    impuestos: {
      iva: toCentavos(data.impuestos.iva),
      ivaAd: toCentavos(data.impuestos.ivaAd),
      iibb: toCentavos(data.impuestos.iibb),
      iigg: toCentavos(data.impuestos.iigg),
    },
    otrosGastos: data.otrosGastos.map(g => ({
      descripcion: g.descripcion,
      monto: toCentavos(g.monto),
      divisa: g.divisa,
    })),
    otrosImpuestos: data.otrosImpuestos.map(g => ({
      descripcion: g.descripcion,
      monto: toCentavos(g.monto),
      divisa: g.divisa,
    })),
    estado: data.estado,
  })

  return { data: { id } }
}

export async function deleteOC(
  id: string
): Promise<{ data: { ok: true } } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  await connectDB()

  const existing = await OC.findById(id).lean() as { importadorId?: string } | null
  if (!existing || existing.importadorId !== userId) return { error: 'Sin acceso' }

  await OC.findByIdAndDelete(id)
  return { data: { ok: true } }
}

export async function getOCs(): Promise<
  { data: { ocs: SerializedOC[]; stats: StatsResult } } | { error: string }
> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { error: 'No autorizado' }
  const rol = (sessionClaims?.metadata as { role?: string })?.role

  await connectDB()

  let filter: Record<string, unknown> = {}

  if (rol === 'importador') {
    filter = { importadorId: userId }
  } else if (rol === 'proveedor' || rol === 'despachante') {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''
    if (!email) return { data: { ocs: [], stats: defaultStats() } }
    filter =
      rol === 'proveedor'
        ? { emailsProveedor: email, estado: { $ne: 'borrador' } }
        : { emailsDespachante: email, estado: { $ne: 'borrador' } }
  } else {
    return { error: 'Rol no reconocido' }
  }

  const [docs, aggResult] = await Promise.all([
    OC.find(filter).sort({ createdAt: -1 }).lean(),
    OC.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totales: { $sum: 1 },
          enTransito: { $sum: { $cond: [{ $eq: ['$estado', 'en_transito'] }, 1, 0] } },
          enAduana: { $sum: { $cond: [{ $eq: ['$estado', 'en_aduana'] }, 1, 0] } },
          entregadas: { $sum: { $cond: [{ $eq: ['$estado', 'entregada'] }, 1, 0] } },
        },
      },
    ]),
  ])

  const ocs = (docs as Record<string, unknown>[]).map(serializeOC)
  const stats: StatsResult = aggResult[0]
    ? {
        totales: aggResult[0].totales as number,
        enTransito: aggResult[0].enTransito as number,
        enAduana: aggResult[0].enAduana as number,
        entregadas: aggResult[0].entregadas as number,
      }
    : defaultStats()

  return { data: { ocs, stats } }
}
