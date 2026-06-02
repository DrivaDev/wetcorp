import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute  = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/clerk'])
const isOnboarding   = createRouteMatcher(['/onboarding(.*)'])
const isImportador   = createRouteMatcher(['/importador(.*)'])
const isProveedor    = createRouteMatcher(['/proveedor(.*)'])
const isDespachante  = createRouteMatcher(['/despachante(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH_DEV === 'true') return NextResponse.next()
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth()
  const role = sessionClaims?.metadata?.role

  // 1. Unauthenticated: allow public routes, redirect others to sign-in
  if (!isAuthenticated) {
    if (!isPublicRoute(req)) return redirectToSignIn({ returnBackUrl: req.url })
    return NextResponse.next()
  }

  // 2. Authenticated without role: must complete onboarding
  if (!role && !isOnboarding(req)) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // 3. Authenticated with role: redirect away from auth/onboarding, block cross-role access
  if (role) {
    if (isPublicRoute(req) || isOnboarding(req)) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
    }
    if (isImportador(req) && role !== 'importador') {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
    }
    if (isProveedor(req) && role !== 'proveedor') {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
    }
    if (isDespachante(req) && role !== 'despachante') {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
