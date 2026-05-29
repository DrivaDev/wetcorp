---
phase: 04-oc-views-demo-polish
plan: 02
subsystem: importador-oc-detail
tags: [oc-detail, read-only, skeleton, edit, wizard, not-found]
dependency_graph:
  requires:
    - 04-01 (OCDetalle + MOCK_OCS_DETALLE + readOnly components + EstadoBadge)
  provides:
    - OCDetailHeader Server Component (breadcrumb + EstadoBadge + Editar/Eliminar)
    - OCDetailActions Client Component (DeleteModal para rol importador)
    - OCDetailView Server Component (vista read-only completa con cálculos decimal.js)
    - /importador/oc/[id] detail page
    - /importador/oc/[id] not-found custom (404)
    - /importador/oc/[id] loading skeleton
    - /importador/oc/[id]/editar page + EditWizardLoader
  affects:
    - src/components/oc-detail/OCDetailHeader.tsx
    - src/components/oc-detail/OCDetailActions.tsx
    - src/components/oc-detail/OCDetailView.tsx
    - src/app/(importador)/importador/oc/[id]/page.tsx
    - src/app/(importador)/importador/oc/[id]/not-found.tsx
    - src/app/(importador)/importador/oc/[id]/loading.tsx
    - src/app/(importador)/importador/oc/[id]/editar/page.tsx
    - src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx
tech_stack:
  added: []
  patterns:
    - Server Component para header y vista (sin 'use client') — cálculos en el servidor
    - Client Component mínimo para interactividad (OCDetailActions, EditWizardLoader)
    - await params pattern (Next.js 16 async params) en todas las page.tsx de rutas dinámicas
    - notFound() como T-04-05 mitigation — evita render de undefined
    - sessionStorage pre-load antes de montar WizardPage para edición
    - animate-pulse skeleton sin spinner para loading.tsx
key_files:
  created:
    - src/components/oc-detail/OCDetailHeader.tsx
    - src/components/oc-detail/OCDetailActions.tsx
    - src/components/oc-detail/OCDetailView.tsx
    - src/app/(importador)/importador/oc/[id]/page.tsx
    - src/app/(importador)/importador/oc/[id]/not-found.tsx
    - src/app/(importador)/importador/oc/[id]/loading.tsx
    - src/app/(importador)/importador/oc/[id]/editar/page.tsx
    - src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx
  modified: []
decisions:
  - OCDetailView es Server Component aunque reutiliza componentes 'use client' (GastosCard etc.) — Next.js permite importar Client Components desde Server Components
  - Cálculos decimal.js ubicados en OCDetailView (Server Component) para evitar hidratación innecesaria en cliente
  - EditWizardLoader escribe sessionStorage en useEffect (cliente) y renderiza WizardPage inmediatamente — evita flash de pantalla vacía
  - loading.tsx usa Array.from({ length: N }) para generar filas de skeleton sin JSX repetido
metrics:
  duration: ~15 min
  completed: 2026-05-28
  tasks_completed: 3
  files_changed: 8
---

# Phase 04 Plan 02: OC Detail Views + Edición para Importador

Vista detalle read-only de OC con cálculos decimal.js en servidor, 404 custom, skeleton animate-pulse, y página de edición con pre-carga de sessionStorage para el wizard.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | OCDetailHeader + OCDetailActions + OCDetailView | 80456cb | src/components/oc-detail/OCDetailHeader.tsx, OCDetailActions.tsx, OCDetailView.tsx |
| 2 | Páginas detail + not-found + loading del importador | 024469a | src/app/(importador)/importador/oc/[id]/page.tsx, not-found.tsx, loading.tsx |
| 3 | Página de edición + EditWizardLoader del importador | f2087fb | src/app/(importador)/importador/oc/[id]/editar/page.tsx, EditWizardLoader.tsx |

## Decisions Made

1. **OCDetailView como Server Component**: aunque los componentes hijos (GastosCard, OtrosGastosSection, etc.) son Client Components con `'use client'`, Next.js App Router permite importarlos desde un Server Component. Los cálculos decimal.js se ejecutan en el servidor, sin costo de hidratación.

2. **EditWizardLoader escribe sessionStorage antes del render**: el `useEffect` se ejecuta en el cliente después del primer render. WizardPage se monta de inmediato con `initialStep="1"` — Step1Form lee sessionStorage al cargar y pre-rellena el formulario con los datos de la OC.

3. **Skeleton con `Array.from`**: los arrays de esqueleto se generan con `Array.from({ length: N })` para evitar JSX repetido, manteniendo el código legible sin comentarios explicativos.

4. **notFound() como mitigación T-04-05**: la línea `if (!oc) notFound()` es la mitigación explícita del threat register. Evita render con datos undefined y entrega la 404 custom del route group.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `/importador/oc/[id]/editar`: los gastos del Step 2 NO se pre-cargan en sessionStorage. Solo se pre-cargan datos del Step 1 (info + productos). Comportamiento mock aceptado según Assumption A1 del RESEARCH. La persistencia real con datos completos es Phase 5.
- `OCDetailActions.onConfirm`: el botón Eliminar solo cierra el modal. La eliminación real (Server Action + MongoDB) es Phase 5.

## Threat Surface Scan

Sin nuevas superficies de red. Las rutas `/importador/oc/[id]*` están gobernadas por el middleware Clerk existente de Phase 1 (T-04-03 accepted). El uso de sessionStorage es local al browser del usuario autenticado (T-04-04 accepted). notFound() implementado como mitigation T-04-05.

## Self-Check: PASSED

- src/components/oc-detail/OCDetailHeader.tsx: FOUND
- src/components/oc-detail/OCDetailActions.tsx: FOUND
- src/components/oc-detail/OCDetailView.tsx: FOUND
- src/app/(importador)/importador/oc/[id]/page.tsx: FOUND
- src/app/(importador)/importador/oc/[id]/not-found.tsx: FOUND
- src/app/(importador)/importador/oc/[id]/loading.tsx: FOUND
- src/app/(importador)/importador/oc/[id]/editar/page.tsx: FOUND
- src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx: FOUND
- Commit 80456cb: FOUND
- Commit 024469a: FOUND
- Commit f2087fb: FOUND
