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
    return new Response('No autorizado', { status: 401 })
  }

  try {
    const body = await request.json()
    const { paramsToSign } = body as { paramsToSign: Record<string, string> }
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )
    return Response.json({ signature })
  } catch (err) {
    console.error('[sign-cloudinary-params]', err)
    return new Response('Error', { status: 500 })
  }
}
