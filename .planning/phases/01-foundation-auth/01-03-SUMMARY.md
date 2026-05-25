---
phase: 1
plan: "01-03"
subsystem: layout
tags: [sidebar, navbar, footer, mobile, responsive, clerk, localStorage, typescript]
dependency_graph:
  requires: [01-02]
  provides: [full-sidebar-importador, responsive-navbar, complete-layout-shell]
  affects: [all-importador-routes, all-proveedor-routes, all-despachante-routes]
tech_stack:
  added: []
  patterns:
    - Sidebar with dual rendering (desktop collapsible + mobile slide-in overlay) in single component
    - localStorage persistence for sidebar collapse state with window.innerWidth fallback
    - CSS translate-x animation for mobile panel slide-in
    - afterSignOutUrl configured on ClerkProvider (Clerk v7 pattern — not on UserButton)
    - sidebarContent() inner function for shared JSX between desktop and mobile panels
key_files:
  created: []
  modified:
    - src/components/layout/Sidebar.tsx
    - src/components/layout/Navbar.tsx
    - src/app/layout.tsx
decisions:
  - "Clerk v7 removed afterSignOutUrl from UserButton — must be set on ClerkProvider instead; afterSignOutUrl hardcoded as string literal on ClerkProvider in layout.tsx"
  - "importador layout.tsx unchanged from Plan 02 — Sidebar renders mobile top navbar internally as part of its JSX fragment"
  - "Footer.tsx confirmed complete from Plan 02 — no changes needed"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-05-25"
  tasks_completed: 2
  files_created: 0
  files_modified: 3
---

# Phase 1 Plan 03: Layout components — Sidebar importador (collapsible + mobile overlay), Navbar, wiring Summary

Full Sidebar with localStorage-persisted desktop collapse (w-64/w-16) and mobile slide-in overlay (translate-x animation, backdrop), plus responsive Navbar with logo swap at md breakpoint — completing the Phase 1 visual shell.

## What Was Built

### T-03-01: Sidebar.tsx — Full Implementation

Single component handles both desktop and mobile layout via JSX fragment:

**Desktop sidebar (hidden sm:flex):**
- Renders as `aside` with `hidden sm:flex flex-col h-screen bg-white border-r border-acento`
- Expanded: `w-64`, collapsed: `w-16`, transition via `transition-all duration-200`
- Collapse toggle: ChevronLeft (expanded) / ChevronRight (collapsed), size 18
- localStorage key: `sidebar-collapsed` (string `'true'` / `'false'`)
- Initial state in useEffect: `window.innerWidth < 1024` → collapsed = true; else false (D-07)

**Mobile top navbar (sticky top-0 z-10 flex sm:hidden):**
- isotipo.svg 32×32px left, hamburger Menu icon right
- Renders before the main content area — sticky at top of viewport on mobile

**Mobile slide-in panel (fixed inset-y-0 left-0 z-50 sm:hidden):**
- Open: `translate-x-0`, Closed: `-translate-x-full`, `transition-transform duration-200`
- Backdrop: `fixed inset-0 z-40 bg-texto/20` — click closes panel

**Shared sidebar content (sidebarContent function):**
- Expanded/mobile: logo.svg 120×40px; collapsed: isotipo.svg 32×32px centered
- Role subtitle "Importador" (text-xs font-light text-titulares) when expanded or mobile
- Dashboard link: LayoutDashboard icon, active state `border-l-2 border-principal text-principal bg-acento/50`
- Nueva OC link: PlusCircle icon, always `bg-principal text-white hover:bg-titulares`
- Active detection: `usePathname()` — `pathname === href || pathname.startsWith(href + '/')`
- UserButton with `showName` prop (true when expanded or mobile overlay)

### T-03-02: Navbar.tsx — Full Implementation

```
sticky top-0 z-10 h-14 flex items-center justify-between px-6 bg-white border-b border-acento
```

- `hidden md:block`: logo-horizontal.svg 140×36px
- `md:hidden`: isotipo.svg 32×32px
- UserButton without afterSignOutUrl (Clerk v7)

### layout.tsx (importador) — Unchanged

The layout from Plan 02 was already correct. Sidebar renders its mobile top navbar internally as part of the JSX fragment, so the `flex min-h-screen` wrapper handles both cases correctly.

### Footer.tsx — Confirmed Complete

Footer confirmed complete from Plan 02. Contains `drivadev.com.ar`, `target="_blank" rel="noopener noreferrer"`, `text-principal hover:underline font-medium`. No changes needed.

### Security Fix: afterSignOutUrl (ClerkProvider)

Clerk v7.4.1 removed `afterSignOutUrl` from `UserButton` props. The plan specified this as a hardcoded string literal for open-redirect prevention. Applied to `ClerkProvider` in `src/app/layout.tsx`:

```tsx
<ClerkProvider afterSignOutUrl="/sign-in">
```

This is the correct Clerk v7 pattern — still a hardcoded string literal, satisfying T-03-01 threat model requirement T-03-01.

## TypeScript Verification

```
npx tsc --noEmit → exit code 0 (zero errors)
```

Verified after each task commit.

## Phase 1 Complete Checklist

Against ROADMAP.md Phase 1 Success Criteria:

| # | Success Criterion | Status |
|---|------------------|--------|
| 1 | Usuario puede registrarse eligiendo rol; rol en Clerk publicMetadata; middleware redirige correctamente | Done (01-02) |
| 2 | Al iniciar sesión, middleware redirige a `/importador`, `/proveedor` o `/despachante` según rol | Done (01-02) |
| 3 | Usuario puede cerrar sesión desde cualquier página | Done — afterSignOutUrl="/sign-in" on ClerkProvider |
| 4 | Importador ve sidebar colapsable con logo, botones Dashboard y Nueva OC, info de usuario | Done (01-03) |
| 5 | Todas las páginas: footer "Desarrollado por Driva Dev", Fira Sans, colores Driva Dev, responsive | Done (01-01, 01-02, 01-03) |

Phase 1 goal fully met: any user can register, select a role, and see a complete UI with Driva Dev identity.

**Note:** Phase 1 still has a human checkpoint from 01-02 pending (Clerk Dashboard configuration + manual sign-up/sign-in test). All code is complete.

## Manual Test Expectations (for human verification)

| Breakpoint | Expected behavior |
|-----------|-------------------|
| Desktop ≥ 1024px | Sidebar defaults to expanded (w-64), collapse button shrinks to w-16, reload restores state from localStorage |
| Tablet 640–1023px | Sidebar defaults to collapsed (w-16) on first load |
| Mobile < 640px | Only top navbar with isotipo + hamburger visible; clicking hamburger opens slide-in panel; clicking backdrop closes it |
| Active link | Dashboard link highlighted with `border-principal` left border when on `/importador/dashboard` |
| Sign-out | Redirects to `/sign-in` (configured on ClerkProvider) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clerk v7 removed `afterSignOutUrl` from `UserButton`**
- **Found during:** T-03-01 — `npx tsc --noEmit` reported TS2322 type error
- **Issue:** `UserButton` props in Clerk v7.4.1 do not include `afterSignOutUrl` — it was removed from the component API
- **Fix:** Moved `afterSignOutUrl="/sign-in"` to `ClerkProvider` in `src/app/layout.tsx`. Value remains a hardcoded string literal — open-redirect protection is fully maintained
- **Security impact:** None — `afterSignOutUrl="/sign-in"` is still a compile-time constant, satisfying T-03-01 threat model
- **Files modified:** `src/app/layout.tsx`, `src/components/layout/Sidebar.tsx` (removed invalid prop)
- **Commits:** 326322d

## Known Stubs

None — all layout components are fully implemented. No placeholder text or empty data flows.

## Commits

| Hash | Task | Message |
|------|------|---------|
| 326322d | T-03-01 | feat(01-03): implement full Sidebar with desktop collapse and mobile overlay |
| 2a5da68 | T-03-02 | feat(01-03): implement full Navbar with responsive logo and update importador layout |

## Self-Check: PASSED

- [x] `src/components/layout/Sidebar.tsx` contains `'use client'`
- [x] `src/components/layout/Sidebar.tsx` contains `localStorage.getItem('sidebar-collapsed')`
- [x] `src/components/layout/Sidebar.tsx` contains `localStorage.setItem('sidebar-collapsed'`
- [x] `src/components/layout/Sidebar.tsx` contains `window.innerWidth < 1024`
- [x] `src/components/layout/Sidebar.tsx` contains `translate-x-0` and `-translate-x-full`
- [x] `src/components/layout/Sidebar.tsx` contains `bg-texto/20` (backdrop)
- [x] `src/components/layout/Sidebar.tsx` contains `fixed inset-0 z-40` (backdrop positioning)
- [x] `src/components/layout/Sidebar.tsx` contains `fixed inset-y-0 left-0 z-50 w-64` (mobile panel)
- [x] `src/components/layout/Sidebar.tsx` contains `sm:hidden` (mobile navbar)
- [x] `src/components/layout/Sidebar.tsx` contains `hidden sm:flex` (desktop sidebar)
- [x] `src/components/layout/Sidebar.tsx` contains `usePathname`
- [x] `src/components/layout/Sidebar.tsx` contains `border-principal` (active link)
- [x] `src/app/layout.tsx` contains `afterSignOutUrl="/sign-in"` on ClerkProvider (hardcoded string)
- [x] `src/components/layout/Navbar.tsx` contains `'use client'`
- [x] `src/components/layout/Navbar.tsx` contains `logo-horizontal.svg` with `hidden md:block`
- [x] `src/components/layout/Navbar.tsx` contains `isotipo.svg` with `md:hidden`
- [x] `src/components/layout/Navbar.tsx` contains `sticky top-0 z-10`
- [x] `src/components/layout/Footer.tsx` contains `drivadev.com.ar`
- [x] `src/components/layout/Footer.tsx` contains `text-principal hover:underline font-medium`
- [x] `src/app/(importador)/layout.tsx` imports `Sidebar` from `@/components/layout/Sidebar`
- [x] `src/app/(importador)/layout.tsx` imports `Footer` from `@/components/layout/Footer`
- [x] `npx tsc --noEmit` exits 0
- [x] Commits 326322d and 2a5da68 exist in git log
