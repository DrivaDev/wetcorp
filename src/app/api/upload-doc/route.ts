export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'
import { v2 as cloudinary } from 'cloudinary'
import { google } from 'googleapis'
import { connectDB } from '@/lib/mongodb'
import { OC } from '@/lib/models/OC'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

import { getSlotFilename } from '@/lib/cleanup-storage'

async function uploadToDrive(buffer: Buffer, fileName: string, referenciaOC: string): Promise<void> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
  if (!privateKey || !clientEmail || !parentFolderId) return

  const gauth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey.replace(/\\n/g, '\n') },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  const drive = google.drive({ version: 'v3', auth: gauth })

  // Crear o encontrar carpeta de la OC
  const folderSearch = await drive.files.list({
    q: `name = '${referenciaOC}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  let folderId: string
  if (folderSearch.data.files && folderSearch.data.files.length > 0) {
    folderId = folderSearch.data.files[0].id!
  } else {
    const created = await drive.files.create({
      requestBody: { name: referenciaOC, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] },
      fields: 'id',
      supportsAllDrives: true,
    })
    folderId = created.data.id!
  }

  // Subir archivo (reemplazar si existe)
  const { Readable } = await import('stream')
  const fileSearch = await drive.files.list({
    q: `name = '${fileName}' and '${folderId}' in parents and trashed = false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  const stream = Readable.from(buffer)
  if (fileSearch.data.files && fileSearch.data.files.length > 0) {
    await drive.files.update({
      fileId: fileSearch.data.files[0].id!,
      media: { mimeType: 'application/pdf', body: stream },
      supportsAllDrives: true,
    })
  } else {
    await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType: 'application/pdf', body: stream },
      fields: 'id',
      supportsAllDrives: true,
    })
  }
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return Response.json({ error: 'Cloudinary no configurado (faltan env vars)' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const ocId = formData.get('ocId') as string | null

    if (!file) return Response.json({ error: 'No se recibió archivo' }, { status: 400 })
    if (file.type !== 'application/pdf') return Response.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: 'El archivo no puede superar 10 MB' }, { status: 400 })

    const slot = formData.get('slot') as string | null
    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = (file.name || 'documento.pdf').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.pdf$/i, '')
    const publicId = `${Date.now()}_${safeName}.pdf`
    // Drive filename: determinístico por slot (ej. factura-proveedor.pdf)
    const driveFileName = slot ? `${getSlotFilename(slot)}.pdf` : `${safeName}.pdf`

    // Cloudinary upload + Drive upload en paralelo
    const cloudinaryPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'drivaoc-docs', public_id: publicId, type: 'upload', access_mode: 'public' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve(result as { secure_url: string })
        }
      ).end(buffer)
    })

    let drivePromise: Promise<void> = Promise.resolve()
    if (ocId) {
      drivePromise = connectDB()
        .then(() => OC.findById(ocId).lean() as Promise<{ referenciaOC?: string } | null>)
        .then(doc => {
          if (doc?.referenciaOC) return uploadToDrive(buffer, driveFileName, doc.referenciaOC)
        })
        .catch(err => console.error('[upload-doc] Drive upload failed:', err))
    }

    const [cloudinaryResult] = await Promise.all([cloudinaryPromise, drivePromise])
    return Response.json({ url: cloudinaryResult.secure_url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload-doc]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
