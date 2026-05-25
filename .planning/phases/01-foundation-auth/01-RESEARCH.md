# Phase 1: Foundation & Auth — Research

**Researched:** 2026-05-24
**Domain:** Next.js App Router scaffolding + Clerk RBAC + Tailwind CSS v4 + brand identity
**Confidence:** HIGH

---

## Summary

Phase 1 is a pure frontend phase. No database work happens here — Clerk is the only external service touched. The goal is: scaffold Next.js 16 with TypeScript strict, wire Tailwind v4 with the Driva Dev color palette and Fira Sans, set up Clerk with a custom onboarding page that captures role selection, configure the middleware to enforce role-based route protection, create four route groups `(auth)` `(importador)` `(proveedor)` `(despachante)` each with their own layout, and implement the three UI shells (sidebar-importador, navbar-only for proveedor/despachante, shared footer).

Clerk's onboarding pattern is the critical technical path: after sign-up, redirect to `/onboarding`, let the user pick a role, call `clerkClient().users.updateUser()` from a Server Action to write `publicMetadata.role`, call `user.reload()` on the client to refresh the JWT, then redirect to the correct route group. Without `user.reload()`, the new role will not appear in the session token until the session expires — a silent failure that looks like middleware not working.

Tailwind v4 (the current stable — npm: `4.3.0`) uses a completely different setup from v3: no `tailwind.config.js`, custom properties declared in CSS via `@theme`, installed with `@tailwindcss/postcss` not `postcss-cli`. Next.js 16.2.6 (current latest) ships Tailwind v4 in its `create-next-app` scaffolding.

**Primary recommendation:** Scaffold with `create-next-app` (which sets up Tailwind v4 + TypeScript), then layer Clerk and the route groups. Do NOT try to manually configure Tailwind v4 from scratch — the `create-next-app` template handles the PostCSS wiring correctly.

---

## Project Constraints (from CLAUDE.md)

| Directive | Enforcement |
|-----------|-------------|
| TypeScript strict — no `any`, no `as any` | tsconfig must have `"strict": true`; no exceptions |
| Server Actions for CRUD; API Routes only for Cloudinary signing, PDF download, Clerk webhook | Phase 1 has no CRUD — all mutations in onboarding via Server Action |
| `export const runtime = 'nodejs'` on Mongoose/react-pdf routes | Not applicable in Phase 1 (no DB, no PDF) |
| Mongoose singleton `maxPoolSize: 5`, `bufferCommands: false` | Not applicable Phase 1 — scaffold `lib/db.ts` as placeholder |
| `decimal.js` for all financial math | Not applicable Phase 1 |
| No explanatory comments — code is self-documenting | Enforced in all Phase 1 files |
| Clerk role check via `sessionClaims?.metadata?.role` | Used in middleware and layout guards |
| MongoDB singleton named `lib/mongodb.ts` with `global.mongooseCache` | Create file in Phase 1 as empty stub or placeholder |
| Brand: `#EA580C`, `#9A3412`, `#FED7AA`, `#FFF7ED`, `#1C1917`; Fira Sans 700/500/400/300 | Applied via Tailwind v4 `@theme` custom properties |
| Footer: "Desarrollado por Driva Dev" + link to `drivadev.com.ar` | Required in every layout |
| Logos: `public/logo.svg`, `public/logo-horizontal.svg`, `public/isotipo.svg` | Copy SVG files to `public/` in Plan 01-01 |
| Env vars in `.env.local`, never in code | `.env.example` created in Plan 01-01 |
| Never commit `.env.local` | `.gitignore` entry verified at scaffold |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up with email/password choosing role (importador / proveedor / despachante) | Clerk onboarding pattern: sign up → `/onboarding` → select role → `updateUser(publicMetadata: {role})` → `user.reload()` |
| AUTH-03 | Next.js middleware protects routes by role — importador in `/importador/*`, proveedor in `/proveedor/*`, despachante in `/despachante/*` | `clerkMiddleware` + `createRouteMatcher` per route group; session claims carry role from JWT |
| AUTH-04 | Session persists across page reloads (Clerk session token includes role in JWT) | Clerk Dashboard → Sessions → Customize session token: `{"metadata": "{{user.public_metadata}}"}` |
| AUTH-05 | User can sign out from any page | `<UserButton />` or `<SignOutButton />` in Navbar and Sidebar components |
| LAYOUT-01 | Importador has collapsible sidebar with logo, DrivaOC name, role subtitle, Dashboard/Nueva OC buttons, user info + sign-out at bottom | `components/layout/Sidebar.tsx` — client component with `useState` for collapse state |
| LAYOUT-02 | Collapsed sidebar shows navbar with logo, user info, sign-out | Sidebar collapse state drives two rendering modes within same component |
| LAYOUT-03 | Proveedor and despachante have only navbar (no sidebar) with user info and sign-out | `components/layout/Navbar.tsx` — shared component, used in `(proveedor)` and `(despachante)` layouts |
| LAYOUT-04 | Footer on all pages: "Desarrollado por Driva Dev" with link to `drivadev.com.ar` | `components/layout/Footer.tsx` — included in all three role layouts |
| LAYOUT-05 | Full UI uses Driva Dev visual identity (Fira Sans, #EA580C, defined colors, responsive) | Tailwind v4 `@theme` block in `globals.css`; `next/font/google` for Fira Sans |
| SEO-04 | TypeScript strict mode — no `any`, no `as any` | `tsconfig.json` `"strict": true`; verified at scaffold |
| SEO-05 | Environment variables in `.env.local` — no sensitive keys in code | `.env.example` created; `.gitignore` includes `.env.local` |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User sign-up / sign-in UI | Browser / Client (Clerk hosted or custom) | Frontend Server (redirect on auth) | Clerk renders auth UI; Next.js handles redirect after auth |
| Role assignment (onboarding) | API / Backend (Server Action) | Browser / Client (form + user.reload) | `publicMetadata` can only be written server-side; client must refresh JWT after write |
| Route protection by role | Frontend Server (middleware) | API / Backend (layout guards) | Middleware runs at the edge per request; layouts add secondary defense |
| Session persistence | Browser / Client (Clerk cookie) | — | Clerk manages session cookie and JWT lifetime automatically |
| Sidebar collapse state | Browser / Client (useState) | — | Purely presentational client state; no persistence required in Phase 1 |
| Brand identity / typography | Browser / Client (CSS) | Frontend Server (CSS module served) | Tailwind utility classes rendered at build time; fonts served via next/font |
| Sign-out action | Browser / Client (Clerk hook) | — | `useClerk().signOut()` or `<SignOutButton />` — client-side only |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.6 | Framework with App Router | Latest stable; ships Tailwind v4 scaffold [VERIFIED: npm registry] |
| react | 19.2.6 | UI runtime | Required peer of Next.js 16 [VERIFIED: npm registry] |
| react-dom | 19.2.6 | DOM renderer | Required peer [VERIFIED: npm registry] |
| typescript | 5.x (bundled with next) | Type safety | Strict mode required by CLAUDE.md [VERIFIED: npm registry] |
| @clerk/nextjs | 7.4.1 | Auth + RBAC | Official Clerk SDK for Next.js — current latest [VERIFIED: npm registry] |
| tailwindcss | 4.3.0 | Utility CSS | v4 is current stable; create-next-app scaffolds this [VERIFIED: npm registry] |
| @tailwindcss/postcss | 4.3.0 | PostCSS plugin for Tailwind v4 | v4 uses plugin, not standalone CLI [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.16.0 | Icon set | Dashboard, sidebar, navbar icons; MIT licensed [VERIFIED: npm registry] |
| clsx | 2.1.1 | Conditional class names | className composition in components [VERIFIED: npm registry] |
| tailwind-merge | 3.6.0 | Merge Tailwind classes without conflicts | Used with clsx for a `cn()` utility [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| lucide-react | heroicons, phosphor-icons | lucide is smaller bundle, wide ecosystem adoption |
| clsx + tailwind-merge | cva (class-variance-authority) | cva adds variant API useful in Phase 1 but adds setup cost; clsx+twmerge simpler for initial shell |
| Clerk custom onboarding page | Clerk `<SignUp>` with custom fields | Custom fields in `<SignUp>` require Clerk Elements (alpha); onboarding page is stable, documented |

**Installation:**
```bash
npx create-next-app@latest drivaoc --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install @clerk/nextjs
npm install lucide-react clsx tailwind-merge
```

**Version verification:** Versions above confirmed via `npm view <package> version` on 2026-05-24.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├── GET /sign-up → Clerk hosted UI → (auth)/sign-up/[[...sign-up]]/page.tsx
  │                                                   │
  │                                           Redirects to /onboarding
  │                                                   │
  ├── GET /onboarding → OnboardingPage (Client)
  │       └── [Submit role] → Server Action: completeOnboarding()
  │                               └── clerkClient().users.updateUser(userId, {publicMetadata:{role}})
  │                                       └── user.reload() (client — refreshes JWT)
  │                                               └── router.push('/importador/dashboard')
  │                                                        or /proveedor/dashboard
  │                                                        or /despachante/dashboard
  │
  ├── Every request → middleware.ts (Edge)
  │       ├── Not authenticated + not public → redirectToSignIn()
  │       ├── Authenticated + no role → redirect /onboarding
  │       ├── Authenticated + wrong role for route → redirect to own dashboard
  │       └── Pass → Next.js renders
  │
  ├── /importador/* → (importador)/layout.tsx → <Sidebar> + <main> + <Footer>
  ├── /proveedor/*  → (proveedor)/layout.tsx  → <Navbar> + <main> + <Footer>
  └── /despachante/* → (despachante)/layout.tsx → <Navbar> + <main> + <Footer>
```

### Recommended Project Structure

```
drivaoc/
├── public/
│   ├── logo.svg              ← vertical logo
│   ├── logo-horizontal.svg   ← horizontal logo
│   └── isotipo.svg           ← icon only
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                    ← Root: ClerkProvider, html, body, Fira Sans
│   │   ├── globals.css                   ← @import "tailwindcss", @theme colors, Fira Sans var
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                ← Centered card, no nav
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   │   └── onboarding/
│   │   │       ├── page.tsx              ← Role selection form (Client Component)
│   │   │       └── _actions.ts           ← completeOnboarding Server Action
│   │   ├── (importador)/
│   │   │   ├── layout.tsx                ← Sidebar shell
│   │   │   └── dashboard/
│   │   │       └── page.tsx              ← Placeholder: "Dashboard importador"
│   │   ├── (proveedor)/
│   │   │   ├── layout.tsx                ← Navbar shell
│   │   │   └── dashboard/
│   │   │       └── page.tsx              ← Placeholder: "Dashboard proveedor"
│   │   └── (despachante)/
│   │       ├── layout.tsx                ← Navbar shell (reuses Navbar component)
│   │       └── dashboard/
│   │           └── page.tsx              ← Placeholder: "Dashboard despachante"
│   │
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx               ← Importador sidebar — Client Component
│   │       ├── Navbar.tsx                ← Proveedor/despachante topnav — Client Component
│   │       └── Footer.tsx                ← "Desarrollado por Driva Dev"
│   │
│   ├── lib/
│   │   └── utils.ts                      ← cn() helper (clsx + tailwind-merge)
│   │
│   ├── types/
│   │   └── globals.d.ts                  ← CustomJwtSessionClaims declaration
│   │
│   └── middleware.ts                     ← clerkMiddleware with role guards
│
├── .env.example
├── .env.local                            ← gitignored
├── next.config.ts
├── tsconfig.json                         ← "strict": true
└── postcss.config.mjs                    ← @tailwindcss/postcss plugin
```

### Pattern 1: Tailwind v4 Setup with Custom Theme

**What:** Tailwind v4 eliminates `tailwind.config.js`. All customization — colors, fonts, spacing — is declared in CSS using `@theme`. The PostCSS setup requires `@tailwindcss/postcss` as the plugin.

**When to use:** Always — this is the only supported setup for Tailwind v4.

```css
/* src/app/globals.css */
/* Source: https://nextjs.org/docs/app/getting-started/css */
@import "tailwindcss";

@theme {
  --color-principal: #EA580C;
  --color-titulares: #9A3412;
  --color-acento:    #FED7AA;
  --color-fondo:     #FFF7ED;
  --color-texto:     #1C1917;

  --font-sans: var(--font-fira-sans), ui-sans-serif, system-ui, sans-serif;
}
```

```ts
/* postcss.config.mjs */
/* Source: https://nextjs.org/docs/app/getting-started/css */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

Usage: `className="bg-principal text-titulares"` — Tailwind v4 auto-generates utilities for `@theme` custom properties.

### Pattern 2: Fira Sans via next/font/google

**What:** Load Fira Sans from Google Fonts with zero layout shift using `next/font`. Expose as a CSS variable so Tailwind's `font-sans` applies it.

```tsx
// src/app/layout.tsx
// Source: https://nextjs.org/docs/app/api-reference/components/font
import { Fira_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-fira-sans',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className={firaSans.variable}>
        <body className="bg-fondo text-texto font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### Pattern 3: TypeScript Globals for Clerk JWT Claims

**What:** Declare `CustomJwtSessionClaims` to get typed `sessionClaims.metadata.role` without `any`.

```ts
// src/types/globals.d.ts
// Source: https://clerk.com/docs/guides/secure/basic-rbac
export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'importador' | 'proveedor' | 'despachante'
    }
  }
}
```

### Pattern 4: Clerk Middleware with Role Guards

**What:** `clerkMiddleware` runs at the Edge. Session token must already carry `metadata.role` (requires Clerk Dashboard session token customization). Three layers of routing logic: unauthenticated → sign-in, authenticated without role → onboarding, role mismatch → own dashboard.

```ts
// src/middleware.ts
// Source: https://clerk.com/docs/guides/development/add-onboarding-flow.mdx + basic-rbac.mdx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute    = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])
const isOnboarding     = createRouteMatcher(['/onboarding(.*)'])
const isImportador     = createRouteMatcher(['/importador(.*)'])
const isProveedor      = createRouteMatcher(['/proveedor(.*)'])
const isDespachante    = createRouteMatcher(['/despachante(.*)'])

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
```

### Pattern 5: Onboarding Server Action + Client Reload

**What:** `publicMetadata` can only be written server-side. After writing, the client must call `user.reload()` to force a JWT refresh — otherwise the new role is invisible to middleware until the session naturally expires.

```ts
// src/app/(auth)/onboarding/_actions.ts
// Source: https://clerk.com/docs/guides/development/add-onboarding-flow.mdx
'use server'
import { auth, clerkClient } from '@clerk/nextjs/server'

type Role = 'importador' | 'proveedor' | 'despachante'

export async function completeOnboarding(role: Role) {
  const { userId } = await auth()
  if (!userId) return { error: 'No autenticado' }

  const client = await clerkClient()
  await client.users.updateUser(userId, {
    publicMetadata: { role },
  })
  return { success: true }
}
```

```tsx
// src/app/(auth)/onboarding/page.tsx (Client Component)
// Source: https://clerk.com/docs/guides/development/add-onboarding-flow.mdx
'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'

const ROLE_REDIRECTS = {
  importador: '/importador/dashboard',
  proveedor:  '/proveedor/dashboard',
  despachante: '/despachante/dashboard',
} as const

type Role = keyof typeof ROLE_REDIRECTS

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()

  const handleRoleSelect = async (role: Role) => {
    const result = await completeOnboarding(role)
    if (result.success) {
      await user?.reload()              // Forces JWT refresh — do not remove
      router.push(ROLE_REDIRECTS[role])
    }
  }

  return (
    // Role selection UI — three buttons for importador / proveedor / despachante
  )
}
```

### Pattern 6: Collapsible Sidebar (Importador)

**What:** Client Component using `useState` for collapse. Two rendering modes: expanded (full sidebar) and collapsed (icon-only with tooltip). Clerk `<UserButton />` at the bottom for user info and sign-out.

```tsx
// src/components/layout/Sidebar.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { UserButton } from '@clerk/nextjs'
import { LayoutDashboard, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`flex flex-col h-screen bg-white border-r border-acento transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div>
            <Image src="/logo.svg" alt="DrivaOC" width={120} height={40} />
            <p className="text-xs text-titulares font-medium mt-1">Importador</p>
          </div>
        )}
        {collapsed && <Image src="/isotipo.svg" alt="DrivaOC" width={32} height={32} />}
        <button onClick={() => setCollapsed(c => !c)} className="text-texto hover:text-principal">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        <Link href="/importador/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-acento text-texto">
          <LayoutDashboard size={20} />
          {!collapsed && <span>Dashboard</span>}
        </Link>
        <Link href="/importador/oc/nueva" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-principal text-white">
          <PlusCircle size={20} />
          {!collapsed && <span>Nueva OC</span>}
        </Link>
      </nav>

      <div className="p-4 border-t border-acento">
        <UserButton afterSignOutUrl="/sign-in" showName={!collapsed} />
      </div>
    </aside>
  )
}
```

### Anti-Patterns to Avoid

- **Putting `<html><body>` in group layouts:** Root `app/layout.tsx` is the only file that declares `<html>` and `<body>`. Group layouts add shell chrome only (sidebar / navbar). Duplicating html/body in group layouts causes React hydration errors.
- **Reading `sessionClaims.metadata.role` without the session token customized in Clerk Dashboard:** The role will be `undefined` in middleware on every request. This is a silent failure — middleware falls through without protecting routes.
- **Using Tailwind v3 config (`tailwind.config.js`) with a v4 install:** Tailwind v4 ignores `tailwind.config.js` by default. Custom colors and themes must go in `@theme` inside CSS.
- **Calling `updateUser` with `unsafeMetadata` instead of `publicMetadata` for the role:** `unsafeMetadata` can be overwritten by the client. Roles must be in `publicMetadata` (server-write only).
- **Not calling `user.reload()` after setting publicMetadata in onboarding:** The session JWT caches `publicMetadata` at token issuance time. Without `reload()`, the role is invisible to middleware until natural token rotation (up to 1 hour).
- **Route group layouts being root layouts (with `<html><body>`):** Causes full page reloads on cross-group navigation. These should be thin shells that add only nav chrome.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth state, session management | Custom JWT or cookie auth | `@clerk/nextjs` ClerkProvider + `auth()` | Session rotation, CSRF, refresh token complexity; hundreds of edge cases |
| User sign-in / sign-up forms | Custom form with validation | Clerk `<SignIn>` / `<SignUp>` components or Clerk-hosted pages | Email verification, password strength, brute-force protection built in |
| Font loading with zero layout shift | `@font-face` with manual FOUT handling | `next/font/google` with `variable` mode | next/font handles preload, subsetting, CLS elimination automatically |
| Sign-out button | Custom fetch to invalidate session | `<SignOutButton>` or `useClerk().signOut()` | Handles all Clerk session cleanup; manual logout leaves stale cookies |
| Utility class merging | String concatenation for conditionals | `clsx` + `tailwind-merge` via `cn()` | Raw string concatenation fails for conflicting Tailwind classes (e.g., `p-2 p-4` both stay) |

**Key insight:** The auth stack and font loading are solved problems. Any custom implementation introduces security gaps or CLS regressions that take far longer to fix than the initial setup.

---

## Common Pitfalls

### Pitfall 1: Session Token Not Customized in Clerk Dashboard
**What goes wrong:** `sessionClaims?.metadata?.role` returns `undefined` in middleware even after onboarding completes. Routes are not protected. Users can navigate to any route group regardless of role.
**Why it happens:** By default, Clerk session tokens do not include `publicMetadata`. The JWT only contains standard Clerk claims. Middleware reads the JWT at the edge — no extra network call to Clerk's API — so the role is never available.
**How to avoid:** In Clerk Dashboard → Configure → Sessions → Customize session token, add: `{"metadata": "{{user.public_metadata}}"}`. This is a one-time manual step. Without it, `sessionClaims?.metadata` is always `undefined`.
**Warning signs:** `console.log(sessionClaims)` in middleware shows no `metadata` field; role check always returns false; all users get redirected to onboarding loop.

### Pitfall 2: `user.reload()` Not Called After Onboarding
**What goes wrong:** After `completeOnboarding()` writes the role to `publicMetadata`, the user is redirected to their dashboard but middleware immediately redirects them back to `/onboarding` because the session JWT still has no role.
**Why it happens:** The JWT was issued before the role was written. Clerk does not invalidate the session on `updateUser`. The old JWT remains valid.
**How to avoid:** After the Server Action returns success, call `await user?.reload()` on the client before calling `router.push()`. This forces Clerk to re-issue a fresh JWT containing the new `publicMetadata`.
**Warning signs:** Infinite redirect loop between `/onboarding` and the target dashboard; role appears in Clerk Dashboard user list but session claims still show no role.

### Pitfall 3: Tailwind v4 `@theme` Colors Not Generating Utilities
**What goes wrong:** `className="bg-principal"` generates no CSS output. Background color is not applied.
**Why it happens:** Tailwind v4 auto-generates utilities for CSS custom properties defined in `@theme`. If the CSS file is not imported in the root layout, or if the `postcss.config.mjs` uses the v3 plugin (`tailwindcss` key instead of `@tailwindcss/postcss`), the theme is not processed.
**How to avoid:** Ensure `postcss.config.mjs` uses `'@tailwindcss/postcss': {}`. Verify `globals.css` begins with `@import "tailwindcss"` (not `@tailwind base/components/utilities`). Confirm `globals.css` is imported in `app/layout.tsx`.
**Warning signs:** No colors appear; browser devtools show no CSS variable definitions in `:root`; `npx tailwindcss --content ./src` produces empty output.

### Pitfall 4: Route Group Layout Redeclares `<html>/<body>`
**What goes wrong:** React hydration mismatch error in production. Cross-group navigation (e.g., importador visits `/sign-out`) triggers a full page reload instead of client-side navigation.
**Why it happens:** Next.js treats any layout with `<html>` and `<body>` as a root layout. Multiple root layouts cause hard navigations between groups.
**How to avoid:** `app/layout.tsx` is the only file with `<html>/<body>`. Group layouts (`(importador)/layout.tsx`, etc.) return only the shell wrapper: `<div className="flex h-screen">...</div>`.
**Warning signs:** `Warning: Expected server HTML to contain a matching <html> in <body>` in browser console; sign-out causes full page reload.

### Pitfall 5: Clerk Middleware Matcher Too Narrow
**What goes wrong:** New routes added after initial setup fall outside the matcher and run without auth protection. `auth()` inside those routes throws or returns null.
**Why it happens:** Developers copy a minimal matcher pattern that excludes API routes or specific paths.
**How to avoid:** Use the canonical broad matcher from Clerk's docs (see Pattern 4 above) that covers all paths, API routes, and `/__clerk/*`. Test every new route group immediately.
**Warning signs:** 500 error from `auth() was called but Clerk can't detect usage of clerkMiddleware()`; API routes return data without a session present.

---

## Code Examples

### `cn()` Utility

```ts
// src/lib/utils.ts
// Standard pattern: clsx + tailwind-merge
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Footer Component

```tsx
// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="py-4 px-6 text-center text-sm text-texto/60 border-t border-acento">
      Desarrollado por{' '}
      <a
        href="https://drivadev.com.ar"
        target="_blank"
        rel="noopener noreferrer"
        className="text-principal hover:underline font-medium"
      >
        Driva Dev
      </a>
    </footer>
  )
}
```

### Importador Layout (Route Group)

```tsx
// src/app/(importador)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'

export default function ImportadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-auto p-6 bg-fondo">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
```

### Proveedor / Despachante Layout (Shared Pattern)

```tsx
// src/app/(proveedor)/layout.tsx  — identical structure for (despachante)
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function ProveedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-fondo p-6">
        {children}
      </main>
      <Footer />
    </div>
  )
}
```

### `.env.example`

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/onboarding
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding

# MongoDB (setup in Phase 5)
MONGODB_URI=

# Cloudinary (setup in Phase 6)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend (setup in Phase 6)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Google Sheets (setup in Phase 6)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `content` array | `@theme {}` in CSS + `@import "tailwindcss"` | Tailwind v4 (2025) | No config file; custom properties auto-generate utilities |
| `postcss-cli` with `tailwindcss` plugin | `@tailwindcss/postcss` plugin | Tailwind v4 (2025) | Different PostCSS plugin key in config |
| `@tailwind base; @tailwind components; @tailwind utilities;` directives | `@import "tailwindcss"` single import | Tailwind v4 (2025) | Single import replaces three directives |
| `authMiddleware` (Clerk v4) | `clerkMiddleware` (Clerk v5+) | Clerk v5 (2024) | `authMiddleware` is removed in @clerk/nextjs v6+ |
| `clerkClient.users.updateUser()` (direct import) | `const client = await clerkClient(); client.users.updateUser()` | Clerk v6+ | `clerkClient` is now async — must be awaited |

**Deprecated / outdated:**
- `authMiddleware`: removed in `@clerk/nextjs` v6+; use `clerkMiddleware`
- `@tailwind base/components/utilities` directives: still works via `tailwind-v3-css` guide but is the v3 pattern; new projects use `@import "tailwindcss"`
- `getAuth()` from `@clerk/nextjs/server` for Server Components: replaced by `auth()` from the same import

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `create-next-app@latest` scaffolds Tailwind v4 correctly with `@tailwindcss/postcss` | Standard Stack | If scaffold defaults to v3, need manual v4 migration — 30 min fix |
| A2 | `next/font` `Fira_Sans` variant name is exactly `Fira_Sans` (with underscore) | Code Examples | Import will fail with `Module not found`; need to check correct export name |
| A3 | Lucide React v1.16.0 is compatible with React 19 | Standard Stack | Icon rendering breaks; workaround: `npm install lucide-react@latest` |

---

## Open Questions

1. **Logo SVG files location**
   - What we know: PROJECT.md lists paths in `C:\Users\Equipo\Downloads\logo-svg (1).svg` etc.
   - What's unclear: Whether these files are already accessible or need to be copied into the project
   - Recommendation: Plan 01-01 must explicitly include a task to copy the three SVG files to `public/logo.svg`, `public/logo-horizontal.svg`, `public/isotipo.svg`

2. **Tailwind v4 color utility naming convention**
   - What we know: Tailwind v4 generates utilities from `@theme` CSS custom properties using the variable name
   - What's unclear: Whether `--color-principal` generates `bg-principal` or `bg-color-principal`
   - Recommendation: In v4, `--color-*` custom properties strip the `color-` prefix — so `--color-principal` → `bg-principal`. Verify immediately after scaffold with a quick test className.

3. **Sign-in/sign-up route catch-all vs named route**
   - What we know: Clerk docs show `[[...sign-in]]` catch-all pattern; `create-next-app` may scaffold differently
   - What's unclear: Whether `create-next-app --clerk` option exists or Clerk setup is entirely manual
   - Recommendation: Treat as manual — install `@clerk/nextjs`, create `(auth)/sign-in/[[...sign-in]]/page.tsx` and `(auth)/sign-up/[[...sign-up]]/page.tsx` manually.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js, npm installs | ✓ | 24.15.0 | — |
| npm | Package installation | ✓ | 11.12.1 | — |
| Clerk account + app keys | AUTH-01, AUTH-03, AUTH-04 | [ASSUMED] | — | Cannot proceed without Clerk credentials |
| Git | Version control | ✓ (inferred from repo state) | — | — |

**Missing dependencies with no fallback:**
- Clerk publishable key + secret key must be created at clerk.com before Plan 01-02 can be executed. The keys populate `.env.local`.
- Session token customization in Clerk Dashboard (add `{"metadata": "{{user.public_metadata}}"}`) is a manual prerequisite for AUTH-03 and AUTH-04 to function.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected (greenfield — no test infra yet) |
| Config file | none — see Wave 0 |
| Quick run command | `npm test` (after Wave 0 setup) |
| Full suite command | `npm test -- --watchAll=false` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can sign up and role is written to publicMetadata | e2e (Playwright) | manual-only in Phase 1 — Clerk test mode required | ❌ Wave 0 |
| AUTH-03 | Middleware redirects wrong-role user away from protected route | unit (middleware test) | `npm test -- middleware` | ❌ Wave 0 |
| AUTH-04 | user.reload() causes JWT to include role claim | manual-only | Cannot be unit tested without Clerk test environment | manual-only |
| AUTH-05 | Sign-out clears session and redirects to sign-in | manual-only | Requires browser session | manual-only |
| LAYOUT-01 | Sidebar renders logo, nav links, user info | unit | `npm test -- Sidebar` | ❌ Wave 0 |
| LAYOUT-02 | Sidebar collapse hides text, shows icons | unit | `npm test -- Sidebar.collapsed` | ❌ Wave 0 |
| LAYOUT-03 | Navbar renders for proveedor/despachante layouts | unit | `npm test -- Navbar` | ❌ Wave 0 |
| LAYOUT-04 | Footer renders on all pages with correct link | unit | `npm test -- Footer` | ❌ Wave 0 |
| LAYOUT-05 | Tailwind colors and Fira Sans applied | visual / manual | manual browser check | manual-only |
| SEO-04 | TypeScript compiler reports zero errors with strict mode | static | `npx tsc --noEmit` | ❌ Wave 0 |
| SEO-05 | `.env.local` is gitignored; no keys in committed files | static | `git status --short .env*` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (zero TypeScript errors gate every commit)
- **Per wave merge:** `npm test -- --watchAll=false` (unit tests for layout components)
- **Phase gate:** Manual browser flow + `npx tsc --noEmit` green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/components/Sidebar.test.tsx` — covers LAYOUT-01, LAYOUT-02
- [ ] `src/__tests__/components/Navbar.test.tsx` — covers LAYOUT-03
- [ ] `src/__tests__/components/Footer.test.tsx` — covers LAYOUT-04
- [ ] Test framework install: `npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest` — if unit tests are desired
- [ ] Alternative: skip unit test setup in Phase 1 (UI is thin); use `npx tsc --noEmit` as the primary automated gate

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Clerk — email/password with built-in brute-force protection |
| V3 Session Management | yes | Clerk session tokens — auto-rotate, httpOnly cookies |
| V4 Access Control | yes | `clerkMiddleware` + layout-level `checkRole()` guard |
| V5 Input Validation | partial (onboarding) | Role is selected from enum buttons, not free text — no injection risk |
| V6 Cryptography | no | Clerk manages all crypto for session tokens |

### Known Threat Patterns for Clerk + Next.js App Router

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Middleware bypass (Next.js CVE-2025-29927) | Elevation of privilege | Pin Next.js ≥ 15.2.3 (current: 16.2.6 — safe) |
| JWT session claim forgery (role spoofing) | Tampering | `publicMetadata` is server-write only; never trust client-sent role claims |
| `NEXT_PUBLIC_CLERK_*` secret exposure | Information disclosure | Only publishable key uses `NEXT_PUBLIC_` prefix; `CLERK_SECRET_KEY` is never `NEXT_PUBLIC_` |
| Stale session after role change | Elevation of privilege | `user.reload()` after onboarding; for admin-side role changes, force session revocation |
| Open redirect on sign-out | Spoofing | `afterSignOutUrl` hardcoded to `/sign-in`, never from query param |

---

## Sources

### Primary (HIGH confidence)

- `/clerk/clerk-docs` via Context7 — publicMetadata RBAC, onboarding flow, middleware patterns
- `/vercel/next.js` via Context7 — Tailwind v4 CSS setup, App Router layouts, route groups
- npm registry — verified package versions for next (16.2.6), @clerk/nextjs (7.4.1), tailwindcss (4.3.0), react (19.2.6)

### Secondary (MEDIUM confidence)

- `.planning/research/STACK.md` — pre-existing Clerk RBAC research from 2026-05-24 (HIGH confidence, Context7 verified)
- `.planning/research/ARCHITECTURE.md` — route groups, middleware, folder structure (HIGH confidence, Next.js docs verified)
- `.planning/research/PITFALLS.md` — Phase 1 specific pitfalls documented with sources

### Tertiary (LOW confidence)

- A2 (Assumption): `Fira_Sans` exact export name in `next/font/google` — not verified via tool; standard naming convention from training knowledge

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry on 2026-05-24
- Architecture: HIGH — patterns verified against Clerk official docs (Context7) and Next.js official docs (Context7)
- Pitfalls: HIGH — sourced from pre-existing research verified against Clerk and Next.js docs; CVE-2025-29927 mitigated by Next.js 16 version in use

**Research date:** 2026-05-24
**Valid until:** 2026-06-24 (Clerk updates frequently; verify `@clerk/nextjs` version before execution)
