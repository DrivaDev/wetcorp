'use server'

import { after } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/mongodb'
import { OC } from '@/lib/models/OC'
import type { EstadoOC, OCDetalle } from '@/lib/mock-ocs'
import { Resend } from 'resend'
import { OCNotificationEmail } from '@/components/emails/OCNotificationEmail'
import { google } from 'googleapis'
import Decimal from 'decimal.js'
import type {
  InfoGeneralState,
  ProductRow,
  GastosDespacho,
  GastosDespachante,
  GastosAdicionales,
  Impuestos,
  OtroGastoRow,
} from '@/lib/wizard-types'

export type SerializedOC = OCDetalle & {
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
  return new Decimal(val).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
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
    productos: Array<{ producto?: string; descripcion: string; cantidad: number; valorUSD: number }>
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
    tipoCambio: d.tipoCambio != null && d.tipoCambio !== 0 ? d.tipoCambio.toString() : '',
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
      packingList: d.documentos?.packingList ?? null,
      otro: d.documentos?.otro ?? null,
    },
  }
}

// Verifica acceso multi-rol a una OC (igual lógica que getOCById)
async function checkOCAccess(
  id: string,
  userId: string,
  rol: string | undefined
): Promise<{ ok: true; existing: Record<string, unknown> } | { ok: false; error: string }> {
  const existing = await OC.findById(id).lean() as Record<string, unknown> & {
    importadorId?: string
    estado?: string
    emailsProveedor?: string[]
    emailsDespachante?: string[]
  } | null
  if (!existing) return { ok: false, error: 'OC no encontrada' }
  if (rol === 'importador') {
    if (existing.importadorId !== userId) return { ok: false, error: 'Sin acceso' }
  } else if (rol === 'proveedor' || rol === 'despachante') {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const emails = clerkUser.emailAddresses
      .map(e => e.emailAddress?.toLowerCase() ?? '')
      .filter(Boolean)
    const lista = rol === 'proveedor' ? (existing.emailsProveedor ?? []) : (existing.emailsDespachante ?? [])
    if (!emails.some(e => (lista as string[]).includes(e))) return { ok: false, error: 'Sin acceso' }
  } else {
    return { ok: false, error: 'Sin acceso' }
  }
  return { ok: true, existing }
}

export async function checkReferenciaOC(
  referencia: string,
  excludeId?: string
): Promise<{ exists: boolean }> {
  const [{ userId }] = await Promise.all([auth(), connectDB()])
  if (!userId) return { exists: false }
  const query: Record<string, unknown> = { importadorId: userId, referenciaOC: referencia.trim() }
  if (excludeId) query._id = { $ne: excludeId }
  const existente = await OC.findOne(query).lean()
  return { exists: !!existente }
}

export async function createOC(data: {
  info: InfoGeneralState
  productos: ProductRow[]
}): Promise<{ data: { id: string } } | { error: string }> {
  const [{ userId, sessionClaims }] = await Promise.all([auth(), connectDB()])
  const rol = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId || rol !== 'importador') return { error: 'No autorizado' }

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
      tipoCambio: parseFloat(data.info.tipoCambio || '0'),
      divisa: data.info.divisa,
      notas: data.info.notas,
      productos: data.productos.map(p => ({
        producto: p.producto,
        descripcion: p.descripcion,
        cantidad: Math.round(parseFloat(p.cantidad || '0')),
        valorUSD: toCentavos(p.valorUSD),
      })),
    })
    after(() => syncToSheets(oc._id.toString()))
    void sendOCNotification(oc._id.toString(), userId)
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
  const [{ userId, sessionClaims }] = await Promise.all([auth(), connectDB()])
  if (!userId) return { error: 'No autorizado' }
  const rol = (sessionClaims?.metadata as { role?: string })?.role

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
    const emails = clerkUser.emailAddresses
      .map(e => e.emailAddress?.toLowerCase() ?? '')
      .filter(Boolean)
    if (oc.estado === 'borrador') return { error: 'Sin acceso' }
    if (!emails.some(e => oc.emailsProveedor.includes(e))) return { error: 'Sin acceso' }
  } else if (rol === 'despachante') {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const emails = clerkUser.emailAddresses
      .map(e => e.emailAddress?.toLowerCase() ?? '')
      .filter(Boolean)
    if (oc.estado === 'borrador') return { error: 'Sin acceso' }
    if (!emails.some(e => oc.emailsDespachante.includes(e))) return { error: 'Sin acceso' }
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
  const [{ userId, sessionClaims }] = await Promise.all([auth(), connectDB()])
  const rol = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId) return { error: 'No autorizado' }

  const access = await checkOCAccess(id, userId, rol)
  if (!access.ok) return { error: access.error }

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

  after(() => syncToSheets(id))
  void sendOCNotification(id, userId)
  return { data: { id } }
}

export async function deleteOC(
  id: string
): Promise<{ data: { ok: true } } | { error: string }> {
  const [{ userId }] = await Promise.all([auth(), connectDB()])
  if (!userId) return { error: 'No autorizado' }

  const existing = await OC.findById(id).lean() as { importadorId?: string } | null
  if (!existing || existing.importadorId !== userId) return { error: 'Sin acceso' }

  await OC.findByIdAndDelete(id)
  return { data: { ok: true } }
}

export async function getOCs(): Promise<
  { data: { ocs: SerializedOC[]; stats: StatsResult } } | { error: string }
> {
  const [{ userId, sessionClaims }] = await Promise.all([auth(), connectDB()])
  if (!userId) return { error: 'No autorizado' }
  const rol = (sessionClaims?.metadata as { role?: string })?.role

  let filter: Record<string, unknown> = {}

  if (rol === 'importador') {
    filter = { importadorId: userId }
  } else if (rol === 'proveedor' || rol === 'despachante') {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const emails = clerkUser.emailAddresses
      .map(e => e.emailAddress?.toLowerCase() ?? '')
      .filter(Boolean)
    if (emails.length === 0) return { data: { ocs: [], stats: defaultStats() } }
    filter =
      rol === 'proveedor'
        ? { emailsProveedor: { $in: emails }, estado: { $ne: 'borrador' } }
        : { emailsDespachante: { $in: emails }, estado: { $ne: 'borrador' } }
  } else {
    return { error: 'Rol no reconocido' }
  }

  const [docs, aggResult] = await Promise.all([
    OC.find(filter)
      .select('_id referenciaOC proveedor despacho emailsProveedor emailsDespachante estado createdAt importadorId')
      .sort({ createdAt: -1 })
      .lean(),
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

export async function updateOCInfo(
  id: string,
  data: {
    info: InfoGeneralState
    productos: ProductRow[]
  }
): Promise<{ data: { id: string } } | { error: string }> {
  const [{ userId, sessionClaims }] = await Promise.all([auth(), connectDB()])
  const rol = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId) return { error: 'No autorizado' }

  const access = await checkOCAccess(id, userId, rol)
  if (!access.ok) return { error: access.error }

  const emailsProveedor = data.info.emailsProveedor
    .map(e => e.toLowerCase().trim())
    .filter(e => e !== '')
  const emailsDespachante = data.info.emailsDespachante
    .map(e => e.toLowerCase().trim())
    .filter(e => e !== '')

  await OC.findByIdAndUpdate(id, {
    referenciaOC: data.info.referenciaOC.trim(),
    estado: data.info.estado,
    proveedor: data.info.proveedor,
    emailsProveedor,
    emailsDespachante,
    despacho: data.info.despacho,
    fechaDespacho: data.info.fechaDespacho,
    paisOrigen: data.info.paisOrigen,
    fechaOC: data.info.fechaOC,
    llegadaEstimada: data.info.llegadaEstimada,
    fechaPago: data.info.fechaPago,
    tipoCambio: parseFloat(data.info.tipoCambio || '0'),
    divisa: data.info.divisa,
    notas: data.info.notas,
    productos: data.productos.map(p => ({
      producto: p.producto,
      descripcion: p.descripcion,
      cantidad: Math.round(parseFloat(p.cantidad || '0')),
      valorUSD: toCentavos(p.valorUSD),
    })),
  })

  after(() => syncToSheets(id))
  if (data.info.estado !== 'borrador') {
    void sendOCNotification(id, userId)
  }
  return { data: { id } }
}

const VALID_SLOTS = [
  'facturaProveedor', 'facturaDespachante', 'conocimientoEmbarque',
  'certificadoOrigen', 'certificadoAnalisis', 'packingList', 'otro',
] as const

async function checkDocAccess(
  id: string,
  userId: string,
  rol: string | undefined
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await OC.findById(id).select('importadorId emailsProveedor emailsDespachante estado').lean() as {
    importadorId?: string
    emailsProveedor?: string[]
    emailsDespachante?: string[]
    estado?: string
  } | null
  if (!existing) return { ok: false, error: 'OC no encontrada' }

  if (rol === 'importador') {
    if (existing.importadorId !== userId) return { ok: false, error: 'Sin acceso' }
  } else if (rol === 'proveedor' || rol === 'despachante') {
    if (existing.estado === 'borrador') return { ok: false, error: 'Sin acceso' }
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const emails = clerkUser.emailAddresses
      .map(e => e.emailAddress?.toLowerCase() ?? '')
      .filter(Boolean)
    const allowed = rol === 'proveedor'
      ? (existing.emailsProveedor ?? []).some(e => emails.includes(e))
      : (existing.emailsDespachante ?? []).some(e => emails.includes(e))
    if (!allowed) return { ok: false, error: 'Sin acceso' }
  } else {
    return { ok: false, error: 'Sin acceso' }
  }
  return { ok: true }
}

export async function updateOCDocumento(
  id: string,
  slot: string,
  url: string
): Promise<{ data: { id: string } } | { error: string }> {
  if (!VALID_SLOTS.includes(slot as typeof VALID_SLOTS[number])) {
    return { error: 'Slot inválido' }
  }

  const CLOUDINARY_URL_RE = /^https:\/\/res\.cloudinary\.com\//
  if (!CLOUDINARY_URL_RE.test(url)) {
    return { error: 'URL de documento inválida' }
  }

  const [{ userId, sessionClaims }] = await Promise.all([auth(), connectDB()])
  if (!userId) return { error: 'No autorizado' }
  const rol = (sessionClaims?.metadata as { role?: string })?.role

  const access = await checkDocAccess(id, userId, rol)
  if (!access.ok) return { error: access.error }

  try {
    await OC.findByIdAndUpdate(id, { $set: { [`documentos.${slot}`]: url } })
    void sendOCNotification(id, userId)
    return { data: { id } }
  } catch {
    return { error: 'Error al guardar el documento' }
  }
}

export async function deleteOCDocumento(
  id: string,
  slot: string
): Promise<{ data: { id: string } } | { error: string }> {
  if (!VALID_SLOTS.includes(slot as typeof VALID_SLOTS[number])) {
    return { error: 'Slot inválido' }
  }

  const [{ userId, sessionClaims }] = await Promise.all([auth(), connectDB()])
  if (!userId) return { error: 'No autorizado' }
  const rol = (sessionClaims?.metadata as { role?: string })?.role

  const access = await checkDocAccess(id, userId, rol)
  if (!access.ok) return { error: access.error }

  try {
    await OC.findByIdAndUpdate(id, { $set: { [`documentos.${slot}`]: null } })
    return { data: { id } }
  } catch {
    return { error: 'Error al eliminar el documento' }
  }
}

async function sendOCNotification(ocId: string, editorUserId: string): Promise<void> {
  try {
    await connectDB()
    const doc = await OC.findById(ocId).lean() as Record<string, unknown> & {
      importadorId: string
      estado: string
      emailsProveedor: string[]
      emailsDespachante: string[]
      referenciaOC: string
      proveedor: string
      fechaOC: string
      notas: string
    } | null
    if (!doc) return
    if (doc.estado === 'borrador') return

    const editorClerkUser = await (await clerkClient()).users.getUser(editorUserId)
    const editorEmails = editorClerkUser.emailAddresses
      .map(e => e.emailAddress?.toLowerCase() ?? '')
      .filter(Boolean)
    const editorRole = (editorClerkUser.publicMetadata as { role?: string })?.role

    const importadorClerkUser = await (await clerkClient()).users.getUser(doc.importadorId)
    const importadorEmail = importadorClerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() ?? ''

    let recipients: string[] = []
    if (editorRole === 'importador') {
      recipients = [...doc.emailsProveedor, ...doc.emailsDespachante]
    } else if (editorRole === 'proveedor') {
      const otrosProveedor = doc.emailsProveedor.filter(e => !editorEmails.includes(e))
      recipients = [importadorEmail, ...doc.emailsDespachante, ...otrosProveedor]
    } else if (editorRole === 'despachante') {
      const otrosDespachante = doc.emailsDespachante.filter(e => !editorEmails.includes(e))
      recipients = [importadorEmail, ...doc.emailsProveedor, ...otrosDespachante]
    }

    recipients = recipients.filter(r => r !== '' && !editorEmails.includes(r))
    if (recipients.length === 0) return

    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sistema-comex.vercel.app'
    const link = `${baseUrl}/importador/oc/${ocId}`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipients,
      subject: `Actualización OC ${doc.referenciaOC}`,
      react: OCNotificationEmail({
        oc: {
          referenciaOC: doc.referenciaOC,
          proveedor: doc.proveedor,
          estado: doc.estado,
          fechaOC: doc.fechaOC,
          notas: doc.notas,
        },
        link,
      }),
    })
  } catch (err) {
    console.error('[sendOCNotification] failed:', err)
  }
}

async function syncToSheets(ocId: string): Promise<void> {
  try {
    await connectDB()
    const doc = await OC.findById(ocId).lean() as Record<string, unknown> & {
      referenciaOC: string
      proveedor: string
      estado: string
      fechaOC: string
      paisOrigen: string
      despacho: string
      fechaDespacho: string
      productos: Array<{ producto?: string; descripcion: string; cantidad: number; valorUSD: number }>
      gastosDespacho: Record<string, number>
      gastosDespachante: Record<string, number>
      gastosAdicionales: Record<string, number>
      impuestos: Record<string, number>
      otrosGastos: Array<{ descripcion: string; monto: number; divisa: string }>
      documentos: Record<string, string | null>
      tipoCambio: number
      divisa: string
    } | null
    if (!doc) return

    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!privateKey || !clientEmail || !spreadsheetId) {
      console.warn('[syncToSheets] Missing Google Sheets env vars — skipping sync')
      return
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const drive = google.drive({ version: 'v3', auth })

    // fc: fromCentavos con fallback '0' para Decimal (fromCentavos retorna '' en cero)
    const fc = (val: number | undefined): string => fromCentavos(val) || '0'

    const tc = doc.tipoCambio?.toString() ?? '0'
    const productos = (doc.productos ?? []).map(p => ({
      id: '',
      producto: p.producto ?? '',
      descripcion: p.descripcion ?? '',
      cantidad: String(p.cantidad ?? 0),
      valorUSD: fc(p.valorUSD),
    }))
    const gastosDespachoTyped = {
      sim: fc((doc.gastosDespacho as Record<string, number>)?.sim),
      derechos: fc((doc.gastosDespacho as Record<string, number>)?.derechos),
      tasaEstadistica: fc((doc.gastosDespacho as Record<string, number>)?.tasaEstadistica),
      otros: fc((doc.gastosDespacho as Record<string, number>)?.otros),
    }
    const gastosDespachante = {
      terminal: fc((doc.gastosDespachante as Record<string, number>)?.terminal),
      fleteInternacional: fc((doc.gastosDespachante as Record<string, number>)?.fleteInternacional),
      fleteInterno: fc((doc.gastosDespachante as Record<string, number>)?.fleteInterno),
      senasa: fc((doc.gastosDespachante as Record<string, number>)?.senasa),
      despachante: fc((doc.gastosDespachante as Record<string, number>)?.despachante),
      gastosOperativos: fc((doc.gastosDespachante as Record<string, number>)?.gastosOperativos),
      gastosBancarios: fc((doc.gastosDespachante as Record<string, number>)?.gastosBancarios),
    }
    const gastosAdicionales = {
      depositoFiscal: fc((doc.gastosAdicionales as Record<string, number>)?.depositoFiscal),
      digitalizacion: fc((doc.gastosAdicionales as Record<string, number>)?.digitalizacion),
      estanciaCamion: fc((doc.gastosAdicionales as Record<string, number>)?.estanciaCamion),
    }
    const otrosGastos = (doc.otrosGastos ?? []).map(g => ({
      id: '',
      descripcion: g.descripcion,
      monto: fc(g.monto),
      divisa: g.divisa as 'ARS' | 'USD',
    }))

    const { calcFOBTotal, calcTotalGastos, calcLandedCost } = await import('@/lib/wizard-calculations')
    const fob = calcFOBTotal(productos)
    const gastos = calcTotalGastos(gastosDespachoTyped, gastosDespachante, gastosAdicionales, otrosGastos, tc)
    const landed = calcLandedCost(fob, gastos)

    const imp = doc.impuestos as Record<string, number> ?? {}
    const totalImpuestos = new Decimal(fc(imp.iva))
      .plus(new Decimal(fc(imp.ivaAd)))
      .plus(new Decimal(fc(imp.iibb)))
      .plus(new Decimal(fc(imp.iigg)))

    // Suma de otros gastos en USD (ARS convertido con tipoCambio)
    const tcDecimal = new Decimal(tc || '1')
    const otrosGastosTotal = otrosGastos.reduce((sum, g) => {
      const monto = new Decimal(g.monto || '0')
      const enUSD = g.divisa === 'USD' ? monto : monto.dividedBy(tcDecimal)
      return sum.plus(enUSD)
    }, new Decimal(0))

    const docSlotLabels: Record<string, string> = {
      facturaProveedor: 'Factura Proveedor',
      facturaDespachante: 'Factura Despachante',
      conocimientoEmbarque: 'Conocimiento de Embarque',
      certificadoOrigen: 'Certificado de Origen',
      certificadoAnalisis: 'Certificado de Análisis',
      packingList: 'Packing List',
      otro: 'Otro',
    }
    const docsConUrl = Object.entries(doc.documentos ?? {})
      .filter(([, url]) => !!url) as [string, string][]

    // Crear o encontrar carpeta Drive para esta OC (archivos ya subidos al adjuntar docs)
    let documentosText = ''
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    if (parentFolderId) {
      try {
        const folderSearch = await drive.files.list({
          q: `name = '${doc.referenciaOC}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: 'files(id)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        })
        let folderId: string
        if (folderSearch.data.files && folderSearch.data.files.length > 0) {
          folderId = folderSearch.data.files[0].id!
        } else {
          const created = await drive.files.create({
            requestBody: { name: doc.referenciaOC, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] },
            fields: 'id',
            supportsAllDrives: true,
          })
          folderId = created.data.id!
        }
        // URL plain text — Sheets auto-linkifica HTTPS; evita errores de fórmula por locale
        documentosText = `https://drive.google.com/drive/folders/${folderId}`
      } catch (driveErr) {
        console.error('[syncToSheets] Drive folder failed:', driveErr)
      }
    }

    // FX = moneda extranjera según tipo de cambio (USD o EUR)
    const fx = doc.divisa === 'ARS/EUR' ? 'EUR' : 'USD'
    const ars = (v: string | number) => `${parseFloat(String(v)) || 0} ARS`
    const fxFmt = (v: string | number) => `${parseFloat(String(v)) || 0} ${fx}`

    const ESTADO_LABELS: Record<string, string> = {
      borrador:    'Borrador',
      en_proceso:  'En proceso',
      en_transito: 'En tránsito',
      en_aduana:   'En aduana',
      entregada:   'Entregada',
      cancelada:   'Cancelada',
    }

    const rowData = [
      ESTADO_LABELS[doc.estado] ?? doc.estado,            // A - texto
      doc.fechaOC,                                        // B - texto
      doc.referenciaOC,                                   // C - texto
      doc.paisOrigen,                                     // D - texto
      doc.despacho ?? '',                                 // E - texto
      doc.fechaDespacho ?? '',                            // F - texto
      fxFmt(fob.toFixed(2)),                              // G - FOB (FX)
      fxFmt(gastosDespachoTyped.sim),                     // H - SIM (FX)
      fxFmt(gastosDespachoTyped.derechos),                // I - Derechos (FX)
      fxFmt(gastosDespachoTyped.tasaEstadistica),         // J - Tasa estadística (FX)
      fxFmt(gastosDespachoTyped.otros),                   // K - Otros despacho (FX)
      ars(gastosDespachante.terminal),                    // L - Terminal (ARS)
      fxFmt(gastosDespachante.fleteInternacional),        // M - Flete int'l (FX)
      ars(gastosDespachante.fleteInterno),                // N - Flete interno (ARS)
      ars(gastosDespachante.senasa),                      // O - SENASA (ARS)
      ars(gastosDespachante.despachante),                 // P - Despachante (ARS)
      ars(gastosDespachante.gastosOperativos),            // Q - Gastos operativos (ARS)
      ars(gastosDespachante.gastosBancarios),             // R - Gastos bancarios (ARS)
      ars(gastosAdicionales.depositoFiscal),              // S - Depósito fiscal (ARS)
      ars(gastosAdicionales.digitalizacion),              // T - Digitalización (ARS)
      ars(gastosAdicionales.estanciaCamion),              // U - Estancia camión (ARS)
      fxFmt(otrosGastosTotal.toFixed(2)),                 // V - Otros gastos suma (FX)
      fxFmt(totalImpuestos.toFixed(2)),                   // W - Total impuestos (FX)
      documentosText,                                     // X - URL texto
      fxFmt(gastos.toFixed(2)),                           // Y - Gastos importación (FX)
      fxFmt(landed.toFixed(2)),                           // Z - Costo nacionalización (FX)
    ]

    // Obtener sheetId (necesario para deleteDimension)
    const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' })
    const sheetId = spreadsheetMeta.data.sheets?.[0]?.properties?.sheetId ?? 0

    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'C:C',
    })
    const rows = getRes.data.values ?? []

    // Encontrar TODAS las filas con esta referenciaOC (puede haber duplicados)
    const matchingIndices: number[] = []
    rows.forEach((r, i) => {
      if (r[0]?.toString().trim() === doc.referenciaOC?.trim()) matchingIndices.push(i)
    })

    // Borrar todas las filas existentes en orden inverso (para no desplazar índices)
    if (matchingIndices.length > 0) {
      const deleteRequests = [...matchingIndices].reverse().map(idx => ({
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: idx, endIndex: idx + 1 },
        },
      }))
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: deleteRequests },
      })
    }

    // Siempre append fila fresca
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:Z',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowData] },
    })
  } catch (err) {
    console.error('[syncToSheets] failed:', err)
  }
}
