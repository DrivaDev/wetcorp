export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'

const CLOUDINARY_RE = /^https:\/\/res\.cloudinary\.com\//

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('No autorizado', { status: 401 })

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url || !CLOUDINARY_RE.test(url)) {
    return new Response('URL inválida', { status: 400 })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) {
    return new Response('No se pudo obtener el archivo', { status: 502 })
  }

  const buffer = await upstream.arrayBuffer()

  // Extraer nombre del archivo desde la URL (último segmento)
  const rawName = url.split('/').pop() ?? 'documento'
  const filename = rawName.endsWith('.pdf') ? rawName : `${rawName}.pdf`

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
