export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'
import { debugSync } from '@/actions/oc'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ocId = searchParams.get('ocId')
  if (!ocId) return Response.json({ error: 'Falta ?ocId=...' }, { status: 400 })

  const result = await debugSync(ocId)
  return Response.json(result)
}
