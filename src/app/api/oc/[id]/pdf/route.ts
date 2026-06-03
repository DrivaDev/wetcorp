export const runtime = 'nodejs'

import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { getOCById } from '@/actions/oc'
import { OCPDFDocument } from '@/lib/pdf/OCPDFDocument'
import React, { type JSXElementConstructor, type ReactElement } from 'react'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getOCById(id)
  if ('error' in result) {
    return new Response('OC no encontrada', { status: 404 })
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
