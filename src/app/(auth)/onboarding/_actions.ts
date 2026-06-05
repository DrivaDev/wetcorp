'use server'
import { auth, clerkClient } from '@clerk/nextjs/server'

type Role = 'importador' | 'proveedor' | 'despachante'

const IMPORTADOR_EMAILS = ['driva.devv@gmail.com', 'compras@wet-corp.com']

export async function completeOnboarding(role: Role): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autenticado' }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  if (user.publicMetadata?.role) {
    return { error: 'El rol ya fue configurado' }
  }

  const primaryEmail = user.emailAddresses
    .find(e => e.id === user.primaryEmailAddressId)
    ?.emailAddress?.toLowerCase() ?? ''

  const isAllowedImportador = IMPORTADOR_EMAILS.includes(primaryEmail)

  const assignedRole: Role = isAllowedImportador ? 'importador' : role

  if (assignedRole === 'importador' && !isAllowedImportador) {
    return { error: 'No tenés permiso para registrarte como importador' }
  }

  await client.users.updateUser(userId, {
    publicMetadata: { role: assignedRole },
  })
  return { success: true }
}
