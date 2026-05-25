'use server'
import { auth, clerkClient } from '@clerk/nextjs/server'

type Role = 'importador' | 'proveedor' | 'despachante'

export async function completeOnboarding(role: Role): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autenticado' }

  const client = await clerkClient()

  const user = await client.users.getUser(userId)
  if (user.publicMetadata?.role) {
    return { error: 'El rol ya fue configurado' }
  }

  await client.users.updateUser(userId, {
    publicMetadata: { role },
  })
  return { success: true }
}
