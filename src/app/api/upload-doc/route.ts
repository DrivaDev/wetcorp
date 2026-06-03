export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return Response.json({ error: 'Cloudinary no configurado (faltan env vars)' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return Response.json({ error: 'No se recibió archivo' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return Response.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'El archivo no puede superar 10 MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Preservar extensión .pdf en el public_id → URL incluye .pdf → browser descarga como PDF
    const safeName = (file.name || 'documento.pdf')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.pdf$/i, '')
    const publicId = `${Date.now()}_${safeName}.pdf`

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'drivaoc-docs', public_id: publicId },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve(result as { secure_url: string })
        }
      ).end(buffer)
    })

    return Response.json({ url: result.secure_url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload-doc]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
