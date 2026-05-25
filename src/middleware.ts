import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute  = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])
const isOnboarding   = createRouteMatcher(['/onboarding(.*)'])
const isImportador   = createRouteMatcher(['/importador(.*)'])
const isProveedor    = createRouteMatcher(['/proveedor(.*)'])
const isDespachante  = createRouteMatcher(['/despachante(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth()
  const role = sessionClaims?.metadata?.role

  if (isAuthenticated && isOnboarding(req)) return NextResponse.next()
  if (!isAuthenticated && !isPublicRoute(req)) return redirectToSignIn({ returnBackUrl: req.url })

  if (isAuthenticated && !role && !isOnboarding(req)) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  if (isAuthenticated && role) {
    if (isImportador(req) && role !== 'importador') {
      return NextResponse.redirect(new URL('/importador/dashboard', req.url))
    }
    if (isProveedor(req) && role !== 'proveedor') {
      return NextResponse.redirect(new URL('/proveedor/dashboard', req.url))
    }
    if (isDespachante(req) && role !== 'despachante') {
      return NextResponse.redirect(new URL('/despachante/dashboard', req.url))
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
