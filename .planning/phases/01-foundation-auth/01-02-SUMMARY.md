---
phase: 1
plan: "01-02"
subsystem: auth
tags: [clerk, middleware, rbac, onboarding, route-groups, typescript]
dependency_graph:
  requires: [01-01]
  provides: [clerk-middleware, auth-route-group, role-based-route-protection, onboarding-flow, dashboard-stubs]
  affects: [all-role-protected-routes, plan-01-03]
tech_stack:
  added: []
  patterns:
    - clerkMiddleware with createRouteMatcher (5 matchers)
    - completeOnboarding Server Action with await clerkClient() (Clerk v6+ pattern)
    - user.reload() before router.push() for JWT refresh
    - Route groups (auth), (importador), (proveedor), (despachante)
    - Clerk appearance prop with DrivaOC brand variables
key_files:
  created:
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
    - src/app/(importador)/dashboard/page.tsx
    - src/app/(proveedor)/layout.tsx
    - src/app/(proveedor)/dashboard/page.tsx
    - src/app/(despachante)/layout.tsx
    - src/app/(despachante)/dashboard/page.tsx
    - .planning/phases/01-foundation-auth/01-USER-SETUP.md
  modified: []
decisions:
  - "completeOnboarding returns typed union { success: true } | { error: string } — prevents unchecked error swallowing"
  - "Footer.tsx is complete implementation in Plan 02 (not stub) — Plan 03 only needs to update Sidebar and Navbar"
  - "Sidebar.tsx and Navbar.tsx are stubs — Plan 03 will replace with full collapsible/nav implementations"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-05-25"
  tasks_completed: 3
  files_created: 16
---

# Phase 1 Plan 02: Clerk setup — onboarding role selection, middleware RBAC, route groups Summary

Clerk RBAC wired end-to-end: clerkMiddleware with 5 role matchers, completeOnboarding Server Action writing publicMetadata.role server-side, onboarding page with user.reload() JWT refresh, and four route group layouts with placeholder dashboards. Human checkpoint required — user must configure Clerk account and test manually.

## What Was Built

### Middleware (src/middleware.ts)

Five route matchers covering all protected paths:

| Matcher | Pattern | Purpose |
|---------|---------|---------|
| isPublicRoute | /sign-in(.*), /sign-up(.*) | Allow unauthenticated access |
| isOnboarding | /onboarding(.*) | Pass-through for authenticated users without role |
| isImportador | /importador(.*) | Role-protected importador routes |
| isProveedor | /proveedor(.*) | Role-protected proveedor routes |
| isDespachante | /despachante(.*) | Role-protected despachante routes |

Logic order:
1. Authenticated + onboarding → pass through
2. Unauthenticated + non-public → redirectToSignIn
3. Authenticated + no role + not onboarding → redirect /onboarding
4. Authenticated + wrong role for route → redirect to own dashboard

Matcher config covers all paths, API routes, and `/__clerk/(.*)`.

### Auth Route Group

| File | Description |
|------|-------------|
| (auth)/layout.tsx | min-h-screen centered, no html/body |
| sign-in/[[...sign-in]]/page.tsx | Clerk SignIn with DrivaOC brand appearance |
| sign-up/[[...sign-up]]/page.tsx | Clerk SignUp with DrivaOC brand appearance |
| onboarding/_actions.ts | completeOnboarding Server Action (publicMetadata.role, await clerkClient) |
| onboarding/page.tsx | Role card selector with user.reload() before redirect |

### Clerk SDK Version

`@clerk/nextjs` version confirmed from 01-01-SUMMARY.md: **7.4.1**

Critical patterns used:
- `const client = await clerkClient()` — mandatory await (Clerk v6+ breaking change)
- `const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth()` — v7 destructuring pattern
- `await user?.reload()` before `router.push()` — forces JWT re-issuance with new publicMetadata

### Layout Components

| Component | Type | Notes |
|-----------|------|-------|
| Sidebar.tsx | Stub | Plan 03 replaces with full collapsible implementation |
| Navbar.tsx | Stub | Plan 03 replaces with full nav implementation |
| Footer.tsx | Complete | "Desarrollado por Driva Dev" link to drivadev.com.ar (target="_blank" rel="noopener noreferrer") |

### Route Groups Created

| Group | Layout | Dashboard | Layout type |
|-------|--------|-----------|-------------|
| (auth) | Centered card, no nav | — | Clerk auth pages |
| (importador) | Sidebar + main + Footer | /importador/dashboard | Sidebar shell |
| (proveedor) | Navbar + main + Footer | /proveedor/dashboard | Topnav shell |
| (despachante) | Navbar + main + Footer | /despachante/dashboard | Topnav shell |

No group layout contains `<html>` or `<body>` tags.

### TypeScript Verification

```
npx tsc --noEmit → exit code 0 (zero errors)
```

Verified after each task commit and once more after all tasks complete.

## Deviations from Plan

None — plan executed exactly as written. The completeOnboarding return type was made explicit as `Promise<{ success: true } | { error: string }>` for cleaner type narrowing in the client component, which is consistent with the plan's code and TypeScript strict requirements.

## Human Checkpoint Required

This plan has `autonomous: false`. User must:

1. Create a Clerk account at clerk.com and create a new application
2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`
3. In Clerk Dashboard → Configure → Sessions → Customize session token, add: `{"metadata": "{{user.public_metadata}}"}`
4. Run `npm run dev` and test the full sign-up → onboarding → dashboard flow manually
5. Verify that selecting a role redirects to the correct dashboard and does NOT loop back to `/onboarding`

See: `.planning/phases/01-foundation-auth/01-USER-SETUP.md` for full setup instructions and troubleshooting.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Empty aside element | src/components/layout/Sidebar.tsx | Plan 03 replaces with full collapsible sidebar (LAYOUT-01, LAYOUT-02) |
| Empty nav element | src/components/layout/Navbar.tsx | Plan 03 replaces with full topnav with UserButton (LAYOUT-03) |

These stubs do not prevent authentication from working — they only affect the visual layout of the dashboard pages, which is completed in Plan 03.

## Threat Flags

No new threat surface beyond the plan's threat model:
- T-02-01: Role typed as `'importador' | 'proveedor' | 'despachante'` — TypeScript rejects invalid values
- T-02-02: clerkMiddleware guards every request at the edge
- T-02-03: afterSignOutUrl will be hardcoded `/sign-in` when Sidebar/Navbar are implemented in Plan 03
- T-02-04: `await user?.reload()` implemented before `router.push()` in onboarding/page.tsx
- T-02-05: CLERK_SECRET_KEY has no NEXT_PUBLIC_ prefix — server-only

## Commits

| Hash | Message |
|------|---------|
| 49cc8b4 | feat(01-02): add Clerk middleware with role-based route protection |
| 132fdbb | feat(01-02): add auth route group — sign-in, sign-up, onboarding with role selection |
| 417510b | feat(01-02): add route group layouts and placeholder dashboard pages |

## Self-Check: PASSED

- [x] src/middleware.ts exists with clerkMiddleware, all 5 route matchers, and role mismatch redirects
- [x] src/app/(auth)/layout.tsx exists, does NOT contain html or body tags
- [x] src/app/(auth)/sign-in/[[...sign-in]]/page.tsx exists with SignIn appearance prop
- [x] src/app/(auth)/sign-up/[[...sign-up]]/page.tsx exists with SignUp appearance prop
- [x] src/app/(auth)/onboarding/_actions.ts contains 'use server' and await clerkClient()
- [x] src/app/(auth)/onboarding/page.tsx contains await user?.reload() before router.push
- [x] src/components/layout/Footer.tsx contains drivadev.com.ar and target="_blank" rel="noopener noreferrer"
- [x] src/app/(importador)/layout.tsx contains Sidebar and Footer imports, no html/body
- [x] src/app/(proveedor)/layout.tsx contains Navbar and Footer imports, no html/body
- [x] src/app/(despachante)/layout.tsx contains Navbar and Footer imports, no html/body
- [x] All three dashboard pages contain "Esta sección está en construcción."
- [x] npx tsc --noEmit exits 0
- [x] Commits 49cc8b4, 132fdbb, 417510b exist in git log
- [x] .planning/phases/01-foundation-auth/01-USER-SETUP.md created
