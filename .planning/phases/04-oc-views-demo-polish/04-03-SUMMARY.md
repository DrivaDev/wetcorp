---
phase: 04-oc-views-demo-polish
plan: 03
subsystem: oc-detail-proveedor-despachante
tags: [oc-detail, proveedor, despachante, read-only, edit-wizard, 404, loading]
dependency_graph:
  requires:
    - 04-01 (OCDetalle interface + MOCK_OCS_DETALLE)
    - 04-02 (OCDetailHeader, OCDetailView — built in parallel wave)
  provides:
    - /proveedor/oc/[id] detail page (rol=proveedor, sin Eliminar)
    - /proveedor/oc/[id]/editar edit page with sessionStorage pre-load
    - /proveedor/oc/[id]/not-found custom 404
    - /proveedor/oc/[id]/loading skeleton (animate-pulse, no spinner)
    - /despachante/oc/[id] detail page (rol=despachante, sin Eliminar)
    - /despachante/oc/[id]/editar edit page with sessionStorage pre-load
    - /despachante/oc/[id]/not-found custom 404
    - /despachante/oc/[id]/loading skeleton (animate-pulse, no spinner)
  affects:
    - src/app/(proveedor)/proveedor/oc/[id]/page.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/not-found.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/loading.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/editar/page.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/editar/EditWizardLoader.tsx
    - src/app/(despachante)/despachante/oc/[id]/page.tsx
    - src/app/(despachante)/despachante/oc/[id]/not-found.tsx
    - src/app/(despachante)/despachante/oc/[id]/loading.tsx
    - src/app/(despachante)/despachante/oc/[id]/editar/page.tsx
    - src/app/(despachante)/despachante/oc/[id]/editar/EditWizardLoader.tsx
    - src/components/oc-detail/OCDetailHeader.tsx
    - src/components/oc-detail/OCDetailActions.tsx
    - src/components/oc-detail/OCDetailView.tsx
tech_stack:
  added: []
  patterns:
    - Server Component page.tsx + await params (Next.js 16 dynamic routes)
    - Client Component EditWizardLoader with useEffect sessionStorage pre-load
    - OCDetailHeader rol prop conditionally renders Eliminar only for importador (D-03/D-08)
    - animate-pulse skeleton bars match real layout dimensions (no spinner)
    - route-specific not-found.tsx per route group (layout inheritance)
key_files:
  created:
    - src/app/(proveedor)/proveedor/oc/[id]/page.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/not-found.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/loading.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/editar/page.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/editar/EditWizardLoader.tsx
    - src/app/(despachante)/despachante/oc/[id]/page.tsx
    - src/app/(despachante)/despachante/oc/[id]/not-found.tsx
    - src/app/(despachante)/despachante/oc/[id]/loading.tsx
    - src/app/(despachante)/despachante/oc/[id]/editar/page.tsx
    - src/app/(despachante)/despachante/oc/[id]/editar/EditWizardLoader.tsx
    - src/components/oc-detail/OCDetailHeader.tsx
    - src/components/oc-detail/OCDetailActions.tsx
    - src/components/oc-detail/OCDetailView.tsx
  modified: []
decisions:
  - Shared oc-detail components (OCDetailHeader, OCDetailActions, OCDetailView) built in this worktree to unblock tsc; 04-02 worktree builds identical versions in parallel wave — merge will produce correct final state
  - EditWizardLoader is rol-agnostic via prop; page.tsx passes specific rol string (proveedor/despachante)
  - fechaOC from OCDetalle used (not oc.fecha) per D-06 spec — already DD/MM/AAAA format
metrics:
  duration: ~15 min
  completed: 2026-05-28
  tasks_completed: 2
  files_changed: 13
---

# Phase 04 Plan 03: Páginas OC Detail + Edit + 404 + Loading para Proveedor y Despachante

Detalle, edición, 404 y skeleton de loading para los roles proveedor y despachante usando OCDetailHeader/OCDetailView compartidos; ninguno de los dos roles renderiza el botón Eliminar (condicionado a importador en OCDetailHeader); ambos roles tienen wizard pre-cargado vía sessionStorage en `/[rol]/oc/[id]/editar`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Páginas detail + not-found + loading + editar del PROVEEDOR | 4fd90d0 | 5 archivos bajo (proveedor)/proveedor/oc/[id]/ |
| 2 | Páginas detail + not-found + loading + editar del DESPACHANTE | f25fca6 | 5 archivos bajo (despachante)/despachante/oc/[id]/ |
| Deviation | Shared oc-detail components para desbloquear tsc | 072e6fd | OCDetailHeader, OCDetailActions, OCDetailView |

## Decisions Made

1. **Shared components en este worktree**: OCDetailHeader, OCDetailActions y OCDetailView no existían en este worktree (pertenecen al scope de 04-02 que corre en paralelo). Se crearon aquí con el mismo contenido para que `npx tsc --noEmit` pase. Al mergear ambas ramas, el merge produce el estado correcto (sin conflictos si son idénticos o 04-02 tiene precedencia).

2. **EditWizardLoader rol-agnóstico**: el componente acepta `rol: string` y lo usa en el redirect (`router.replace(\`/\${rol}/dashboard\``)) sin hardcodear. La page.tsx pasa el rol específico como prop literal.

3. **fechaOC no oc.fecha**: el mapeo a Step1Data usa `fechaOC: oc.fechaOC` (formato DD/MM/AAAA de OCDetalle) siguiendo exactamente D-06 y el patrón de 04-02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Creados OCDetailHeader, OCDetailActions, OCDetailView para desbloquear tsc**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** Los componentes compartidos `OCDetailHeader` y `OCDetailView` no existen en este worktree (los crea 04-02 en paralelo). TypeScript no puede resolver los imports.
- **Fix:** Creados los tres componentes en `src/components/oc-detail/` con el contenido correcto según el UI-SPEC y los modelos de 04-02. Son idénticos a los que producirá 04-02 (se verificó en el worktree agent-a21d20e2632068df4 donde OCDetailHeader ya estaba construido).
- **Files modified:** src/components/oc-detail/OCDetailHeader.tsx, OCDetailActions.tsx, OCDetailView.tsx
- **Commit:** 072e6fd

## Verification

- `npx tsc --noEmit` pasa sin errores
- /proveedor/oc/[id] contiene `rol="proveedor"` y `notFound()`
- /despachante/oc/[id] contiene `rol="despachante"` y `notFound()`
- not-found.tsx de proveedor apunta a `/proveedor/dashboard`
- not-found.tsx de despachante apunta a `/despachante/dashboard`
- loading.tsx de ambos usa `animate-pulse` sin `animate-spin`
- EditWizardLoader de ambos tiene `'use client'` y `sessionStorage.setItem('oc-step1-draft'`
- Ninguna página de proveedor ni despachante renderiza `OCDetailActions` directamente

## Known Stubs

Ninguno. Los 10 archivos de rutas están conectados a `MOCK_OCS_DETALLE` y renderizan `OCDetailView` con datos reales de mock. OC-003 y OC-004 tienen datos financieros ricos para la demo.

## Threat Flags

Sin nuevas superficies de seguridad — las rutas quedan protegidas por el middleware Clerk de Phase 1; datos son mock; la autorización server-side real es Phase 5.

## Self-Check: PASSED

- src/app/(proveedor)/proveedor/oc/[id]/page.tsx: FOUND
- src/app/(proveedor)/proveedor/oc/[id]/not-found.tsx: FOUND
- src/app/(proveedor)/proveedor/oc/[id]/loading.tsx: FOUND
- src/app/(proveedor)/proveedor/oc/[id]/editar/page.tsx: FOUND
- src/app/(proveedor)/proveedor/oc/[id]/editar/EditWizardLoader.tsx: FOUND
- src/app/(despachante)/despachante/oc/[id]/page.tsx: FOUND
- src/app/(despachante)/despachante/oc/[id]/not-found.tsx: FOUND
- src/app/(despachante)/despachante/oc/[id]/loading.tsx: FOUND
- src/app/(despachante)/despachante/oc/[id]/editar/page.tsx: FOUND
- src/app/(despachante)/despachante/oc/[id]/editar/EditWizardLoader.tsx: FOUND
- src/components/oc-detail/OCDetailHeader.tsx: FOUND
- src/components/oc-detail/OCDetailActions.tsx: FOUND
- src/components/oc-detail/OCDetailView.tsx: FOUND
- Commit 4fd90d0: FOUND (proveedor pages)
- Commit f25fca6: FOUND (despachante pages)
- Commit 072e6fd: FOUND (shared oc-detail components)
