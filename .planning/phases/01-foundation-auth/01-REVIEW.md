---
phase: 01-foundation-auth
reviewed: 2026-05-25T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/lib/utils.ts
  - src/types/globals.d.ts
  - src/middleware.ts
  - src/app/(auth)/layout.tsx
  - src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
  - src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
  - src/app/(auth)/onboarding/_actions.ts
  - src/app/(auth)/onboarding/page.tsx
  - src/components/layout/Sidebar.tsx
  - src/components/layout/Navbar.tsx
  - src/components/layout/Footer.tsx
  - src/app/(importador)/layout.tsx
  - src/app/(importador)/importador/dashboard/page.tsx
  - src/app/(proveedor)/layout.tsx
  - src/app/(proveedor)/proveedor/dashboard/page.tsx
  - src/app/(despachante)/layout.tsx
  - src/app/(despachante)/despachante/dashboard/page.tsx
findings:
  critical: 3
  warning: 3
  info: 2
  total: 8
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-25
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

The foundation scaffold is largely well-structured. Clerk integration follows documented patterns, brand tokens are correctly wired through Tailwind v4, and the Server Action for onboarding correctly avoids exposing Clerk secrets. Three blockers were found: the middleware redirects users to the wrong role dashboard on cross-role access (sends everyone to `/importador/dashboard` regardless of their actual role), the onboarding Server Action does not guard against re-invocation by already-onboarded users (allowing self-role-escalation), and authenticated-but-roleless users can freely access `/sign-in` and `/sign-up` bypassing the onboarding gate. Three warnings cover: loading state never cleared on success (leaves button permanently disabled if navigation fails), an unguarded `user?.reload()` with no error handling, and a duplicate `transition-*` class conflict on onboarding buttons.

---

## Critical Issues

### CR-01: Middleware redirects cross-role users to wrong dashboard

**File:** `src/middleware.ts:22-29`

**Issue:** When a user with role `proveedor` visits any `/importador/*` route, the condition `isImportador(req) && role !== 'importador'` is true, and the redirect target is `new URL('/importador/dashboard', req.url)` — the same protected route they were denied access to. This sends the user back into the same check, causing an infinite redirect loop, or at minimum deposits a `proveedor` on an `importador` page before the next middleware pass catches it again. The same wrong-target defect exists for the proveedor and despachante branches (lines 25 and 28).

**Fix:**
```typescript
if (isAuthenticated && role) {
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
```
Redirecting to `/${role}/dashboard` sends each user to their own dashboard instead of the one they were blocked from.

---

### CR-02: Onboarding Server Action allows any authenticated user to change their role

**File:** `src/app/(auth)/onboarding/_actions.ts:6-14`

**Issue:** `completeOnboarding` accepts a `role` parameter and writes it to `publicMetadata` for the calling user with no check for whether the user already has a role. Any authenticated user — including already-onboarded importadores — can invoke this action (via DevTools, a direct fetch, or a custom script) to overwrite their role at any time. In a multi-tenant system where roles gate data access, this is a privilege-escalation vector: a `proveedor` account can self-promote to `importador` and gain full CRUD access.

**Fix:**
```typescript
export async function completeOnboarding(role: Role): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autenticado' }

  const client = await clerkClient()

  // Guard: reject if a role is already set
  const user = await client.users.getUser(userId)
  if (user.publicMetadata?.role) {
    return { error: 'El rol ya fue configurado' }
  }

  await client.users.updateUser(userId, {
    publicMetadata: { role },
  })
  return { success: true }
}
```

---

### CR-03: Authenticated users without a role can access sign-in and sign-up pages

**File:** `src/middleware.ts:14-18`

**Issue:** The onboarding gate on line 17 only fires when the request is NOT for an onboarding route. It does not fire when the request is a public route (`/sign-in`, `/sign-up`). An authenticated user with no role visits `/sign-in` — `isAuthenticated` is true, `isOnboarding(req)` is false, `isPublicRoute(req)` is true — so no redirect to `/onboarding` occurs. The user lands on the sign-in page while already authenticated. More importantly, the check on line 14 (`isAuthenticated && isOnboarding(req)`) returns early with `NextResponse.next()` before the onboarding gate, meaning even the onboarding gate order is fragile.

**Fix:**
```typescript
export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth()
  const role = sessionClaims?.metadata?.role

  // 1. Unauthenticated users: allow public routes, redirect others to sign-in
  if (!isAuthenticated) {
    if (!isPublicRoute(req)) return redirectToSignIn({ returnBackUrl: req.url })
    return NextResponse.next()
  }

  // 2. Authenticated without role: must complete onboarding
  if (!role && !isOnboarding(req)) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // 3. Authenticated with role: block cross-role access, and redirect away from auth/onboarding pages
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
```

---

## Warnings

### WR-01: Loading state never reset on successful onboarding — button permanently disabled on navigation failure

**File:** `src/app/(auth)/onboarding/page.tsx:31-45`

**Issue:** `setLoading(true)` is called at the start of `handleConfirm`. On the error path (line 39), `setLoading(false)` is correctly called. On the success path, `router.push(...)` is called immediately after `user?.reload()` — `setLoading(false)` is never called. If `router.push` throws or the navigation fails for any reason, the button is permanently stuck in disabled/loading state for the rest of the session.

**Fix:**
```typescript
const handleConfirm = async () => {
  if (!selected) return
  setLoading(true)
  setError(null)
  try {
    const result = await completeOnboarding(selected)
    if ('error' in result) {
      setError(result.error)
      return
    }
    await user?.reload()
    router.push(ROLE_REDIRECTS[selected])
  } finally {
    setLoading(false)
  }
}
```

---

### WR-02: `user?.reload()` swallows errors silently — stale session token causes wrong redirect

**File:** `src/app/(auth)/onboarding/page.tsx:43`

**Issue:** `user?.reload()` is called with optional chaining. If `user` is `null` (Clerk hasn't fully hydrated yet), the reload is silently skipped. The session token then still contains no `role` claim when the middleware reads it on the next request, so the redirect in `router.push(ROLE_REDIRECTS[selected])` will be caught by the middleware's "no role" guard and bounce the user back to `/onboarding`, creating a confusing loop. This is particularly likely on slower connections.

**Fix:**
```typescript
if (!user) {
  setError('Error de sesión. Por favor recargá la página.')
  setLoading(false)
  return
}
await user.reload()
router.push(ROLE_REDIRECTS[selected])
```
Explicitly guard `user` before calling `reload()` and surface the failure to the user.

---

### WR-03: Conflicting `transition-*` classes on role selection buttons

**File:** `src/app/(auth)/onboarding/page.tsx:60-66`

**Issue:** Each role button in the `cn(...)` call receives both `'transition-colors duration-150'` (line 61) and `'active:scale-[0.98] transition-transform duration-75'` (line 62). Two `transition-*` utilities applied to the same element conflict — Tailwind v4 applies both but only the last `transition` property in the CSS cascade wins. The `scale` transform on active press will not animate, and the `duration-75` intended for the press animation is ignored.

**Fix:** Merge both transitions into a single utility:
```tsx
className={cn(
  'border-2 rounded-xl p-6 cursor-pointer text-left',
  'transition-all duration-150 active:scale-[0.98]',
  selected === id
    ? 'border-principal bg-acento/30'
    : 'border-acento hover:border-principal hover:bg-acento/30'
)}
```
`transition-all` covers both color and transform in a single declaration.

---

## Info

### IN-01: Sidebar "Importador" label is hardcoded — will mislead if component is ever reused

**File:** `src/components/layout/Sidebar.tsx:79`

**Issue:** The role subtitle `"Importador"` is a hardcoded string literal. The `Sidebar` component is currently only used in the importador layout, so this is not broken today. However, if the sidebar is ever extended for other roles (or if the file is copied), the label will silently display the wrong role. Accepting the role as a prop or reading from Clerk session would be more robust.

**Fix:** Accept an optional `roleLabel` prop, or read from Clerk's `useUser()` hook:
```tsx
// Option A — prop
export function Sidebar({ roleLabel = 'Importador' }: { roleLabel?: string }) {
  // ...
  {(isMobileOverlay || !collapsed) && (
    <p className="px-4 pb-2 text-xs font-light text-titulares">{roleLabel}</p>
  )}
```

---

### IN-02: "Nueva OC" link in Sidebar is outside NAV_LINKS — cannot receive active styling

**File:** `src/components/layout/Sidebar.tsx:104-115`

**Issue:** The "Nueva OC" `<Link>` is rendered separately from the `NAV_LINKS.map(...)` loop and has no `isActive` logic. When the user navigates to `/importador/oc/nueva`, that link will not display as active even though the dashboard link also won't be active — the user will see no highlighted nav item. This is a UX inconsistency, not a functional bug.

**Fix:** Add "Nueva OC" to `NAV_LINKS` with the same active-detection logic, or apply `isActive` to the standalone link:
```tsx
const isNewOCActive = pathname.startsWith('/importador/oc/nueva')
<Link
  href="/importador/oc/nueva"
  className={cn(
    'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
    isNewOCActive
      ? 'border-l-2 border-principal text-principal bg-acento/50'
      : 'bg-principal text-white hover:bg-titulares',
    isMobileOverlay || !collapsed ? '' : 'justify-center'
  )}
>
```

---

_Reviewed: 2026-05-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
