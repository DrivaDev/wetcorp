export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { getOCById } from '@/actions/oc'
import { OCPDFDocument } from '@/lib/pdf/OCPDFDocument'
import React, { type JSXElementConstructor, type ReactElement } from 'react'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('No autorizado', { status: 401 })
  }

  const { id } = await params
  const result = await getOCById(id)
  if ('error' in result) {
    const status = result.error === 'Sin acceso' ? 403 : 404
    return new Response(result.error, { status })
  }

  const oc = result.data.oc
  const element = React.createElement(OCPDFDocument, { oc }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  const buffer = await renderToBuffer(element)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="OC-${oc.referenciaOC}.pdf"`,
    },
  })
}
