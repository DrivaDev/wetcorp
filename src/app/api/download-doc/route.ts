export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const CLOUDINARY_RE = /^https:\/\/res\.cloudinary\.com\//

// Extrae el public_id desde una URL de Cloudinary raw
// Ej: .../raw/upload/v123/drivaoc-docs/file.pdf → drivaoc-docs/file.pdf
function extractPublicId(url: string): string {
  const match = url.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/)
  return match ? match[1] : ''
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('No autorizado', { status: 401 })

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url || !CLOUDINARY_RE.test(url)) {
    return new Response('URL inválida', { status: 400 })
  }

  const filename = url.split('/').pop() ?? 'documento.pdf'

  // Si tenemos credenciales → private_download_url (URL temporal firmada, bypasea restricciones)
  if (process.env.CLOUDINARY_API_SECRET) {
    const publicId = extractPublicId(url)
    if (publicId) {
      const expires = Math.floor(Date.now() / 1000) + 300
      for (const type of ['upload', 'authenticated', 'private'] as const) {
        try {
          const downloadUrl = cloudinary.utils.private_download_url(
            publicId,
            'pdf',
            { resource_type: 'raw', type, expires_at: expires }
          )
          const upstream = await fetch(downloadUrl)
          if (upstream.ok) {
            const buffer = await upstream.arrayBuffer()
            return new Response(buffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
              },
            })
          }
        } catch {
          continue
        }
      }
    }
  }

  // Fallback: fetch directo (funciona si el recurso es público)
  const upstream = await fetch(url)
  if (!upstream.ok) {
    return new Response(`No se pudo obtener el archivo (${upstream.status})`, { status: 502 })
  }
  const buffer = await upstream.arrayBuffer()
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
