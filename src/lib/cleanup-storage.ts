import { v2 as cloudinary } from 'cloudinary'
import { google } from 'googleapis'

export const SLOT_FILENAMES: Record<string, string> = {
  facturaProveedor:      'factura-proveedor',
  facturaDespachante:    'factura-despachante',
  conocimientoEmbarque:  'conocimiento-embarque',
  certificadoOrigen:     'certificado-origen',
  certificadoAnalisis:   'certificado-analisis',
  packingList:           'packing-list',
  otro:                  'otro',
}

function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

function getGoogleDrive() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
  if (!privateKey || !clientEmail || !parentFolderId) return null

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey.replace(/\\n/g, '\n') },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return { drive: google.drive({ version: 'v3', auth }), parentFolderId }
}

function extractPublicId(url: string): string | null {
  // https://res.cloudinary.com/{cloud}/raw/upload/v{ver}/drivaoc-docs/{public_id}
  const match = url.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/)
  return match?.[1] ?? null
}

async function findOCFolder(referenciaOC: string): Promise<string | null> {
  const g = getGoogleDrive()
  if (!g) return null

  try {
    const res = await g.drive.files.list({
      q: `name = '${referenciaOC}' and '${g.parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    return res.data.files?.[0]?.id ?? null
  } catch {
    return null
  }
}

/**
 * Elimina un archivo de Cloudinary por su URL.
 */
export async function deleteCloudinaryFile(url: string): Promise<void> {
  const publicId = extractPublicId(url)
  if (!publicId) return
  initCloudinary()
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
  } catch (err) {
    console.error('[cleanup] Cloudinary delete failed:', err)
  }
}

/**
 * Elimina varios archivos de Cloudinary en paralelo (ignora nulls).
 */
export async function deleteCloudinaryFiles(urls: (string | null | undefined)[]): Promise<void> {
  const valid = urls.filter((u): u is string => !!u)
  if (valid.length === 0) return
  initCloudinary()
  await Promise.allSettled(
    valid.map(url => {
      const publicId = extractPublicId(url)
      if (!publicId) return Promise.resolve()
      return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(err => {
        console.error('[cleanup] Cloudinary delete failed:', err)
      })
    })
  )
}

/**
 * Elimina el archivo de un slot específico de la carpeta Drive de la OC.
 * El nombre del archivo en Drive es determinístico: SLOT_FILENAMES[slot].pdf
 */
export async function deleteDriveFile(referenciaOC: string, slot: string): Promise<void> {
  const g = getGoogleDrive()
  if (!g) return

  const filename = `${SLOT_FILENAMES[slot] ?? slot}.pdf`

  const folderId = await findOCFolder(referenciaOC)
  if (!folderId) return

  try {
    const res = await g.drive.files.list({
      q: `name = '${filename}' and '${folderId}' in parents and trashed = false`,
      fields: 'files(id)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    const fileId = res.data.files?.[0]?.id
    if (!fileId) return
    await g.drive.files.delete({ fileId, supportsAllDrives: true })
  } catch (err) {
    console.error('[cleanup] Drive file delete failed:', err)
  }
}

/**
 * Elimina la carpeta completa de la OC en Drive (incluye todos sus archivos).
 */
export async function deleteOCDriveFolder(referenciaOC: string): Promise<void> {
  const g = getGoogleDrive()
  if (!g) return

  const folderId = await findOCFolder(referenciaOC)
  if (!folderId) return

  try {
    await g.drive.files.delete({ fileId: folderId, supportsAllDrives: true })
  } catch (err) {
    console.error('[cleanup] Drive folder delete failed:', err)
  }
}
