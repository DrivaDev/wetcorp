export const runtime = 'nodejs'

import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    if (evt.type === 'user.created') {
      const { id, email_addresses, public_metadata } = evt.data
      const email = email_addresses[0]?.email_address ?? ''
      const rol = (public_metadata as { role?: string }).role ?? 'importador'

      await connectDB()
      await User.create({
        clerkId: id,
        email: email.toLowerCase(),
        rol,
      })
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
