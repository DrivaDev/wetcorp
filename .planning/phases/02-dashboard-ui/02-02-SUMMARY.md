---
phase: 02-dashboard-ui
plan: "02"
subsystem: dashboard-components
tags: [ui-components, tailwind, typescript, lucide-react, client-components, server-components]
dependency_graph:
  requires: [mock-ocs-data-layer]
  provides: [stat-card, oc-table, delete-modal, empty-state]
  affects: [dashboard-page-importador, dashboard-page-proveedor, dashboard-page-despachante]
tech_stack:
  added: []
  patterns: [named-exports, typescript-strict, use-client-directive, server-components, conditional-rendering-by-role, skeleton-loading, modal-overlay]
key_files:
  created:
    - src/components/dashboard/StatCard.tsx
    - src/components/dashboard/DeleteModal.tsx
    - src/components/dashboard/OCTable.tsx
    - src/components/dashboard/EmptyState.tsx
  modified: []
decisions:
  - "StatCard es Server Component (sin use client) — solo recibe props primitivas, sin estado ni eventos"
  - "EmptyState es Server Component — rol y hasFilters son props del padre, no requiere interactividad"
  - "OCTable y DeleteModal son Client Components — gestionan estado deleteTarget con useState"
  - "tableHead extraído como constante JSX para reutilización entre skeleton y tabla real sin duplicación"
  - "getBadgeClasses y ESTADO_LABELS como helpers module-level (no dentro del componente) — no hay recálculo en cada render"
  - "cn() de @/lib/utils usado en OCTable para composición de clases de badge via Record<EstadoOC>"
  - "onConfirm del DeleteModal cierra el modal sin eliminar — Phase 5 implementará el Server Action real"
metrics:
  duration: ~15 min
  completed: 2026-05-25
---

# Phase 2 Plan 02: Dashboard Components Summary

**One-liner:** Cuatro componentes de dashboard — StatCard (Server), OCTable (Client con skeleton + badges de 6 estados + acciones por rol), DeleteModal (Client con overlay) y EmptyState (Server con CTA condicional) — con clases Tailwind exactas del UI-SPEC aprobado.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | StatCard y DeleteModal | db93745 | src/components/dashboard/StatCard.tsx, src/components/dashboard/DeleteModal.tsx |
| 2 | OCTable y EmptyState | 8644d6f | src/components/dashboard/OCTable.tsx, src/components/dashboard/EmptyState.tsx |

## Decisions Made

- StatCard y EmptyState son Server Components — no tienen estado ni event handlers, solo reciben props tipadas.
- OCTable extrae `tableHead` como constante JSX para reutilizarlo en el branch de skeleton sin duplicar el markup del thead.
- `getBadgeClasses` usa `Record<EstadoOC, string>` como lookup table en lugar de condicionales encadenados — garantiza exhaustividad con TypeScript.
- El `deleteTarget` en OCTable es `OC | null` (no solo el id) para poder pasar `ocNumero` y `proveedor` directamente al DeleteModal sin necesidad de buscar en el array.
- El botón Trash2 usa clases específicas de rojo (`text-red-600 hover:text-red-700 hover:bg-red-50`) como única excepción destructiva del UI-SPEC Phase 2.

## Deviations from Plan

None - plan ejecutado exactamente como fue escrito.

## Known Stubs

- `onConfirm` en DeleteModal cierra el modal sin ejecutar eliminación real — intencional para Phase 2 UI-only. Phase 5 reemplazará con Server Action `deleteOC` que verificará `sessionClaims.metadata.role === 'importador'` antes de ejecutar.
- Las rutas de Eye (`/rol/oc/[id]`) y Pencil (`/rol/oc/[id]/editar`) navegan a páginas que aún no existen — stubs hasta Phase 4 (detalle y edición de OC).

## Threat Flags

Ninguno — componentes UI-only con datos ficticios del array mock, sin endpoints de red ni PII real. Amenazas T-02-02-01 a T-02-02-03 documentadas en el plan con disposición `accept` para Phase 5.

## Self-Check: PASSED

- src/components/dashboard/StatCard.tsx: FOUND
- src/components/dashboard/DeleteModal.tsx: FOUND
- src/components/dashboard/OCTable.tsx: FOUND
- src/components/dashboard/EmptyState.tsx: FOUND
- commit db93745: FOUND (StatCard + DeleteModal)
- commit 8644d6f: FOUND (OCTable + EmptyState)
- npx tsc --noEmit: sin errores
- StatCard sin 'use client': verificado
- EmptyState sin 'use client': verificado
- DeleteModal con 'use client' en línea 1: verificado
- OCTable con 'use client' en línea 1: verificado
- StatCard contiene bg-white border border-acento rounded-xl p-6 flex flex-col gap-3: verificado
- StatCard contiene text-4xl font-bold text-texto: verificado
- StatCard contiene text-sm font-light text-titulares: verificado
- DeleteModal contiene fixed inset-0 z-50 bg-texto/30: verificado
- DeleteModal contiene ¿Eliminar esta OC?: verificado
- DeleteModal contiene Esta acción no se puede deshacer: verificado
- DeleteModal contiene bg-red-600 text-white hover:bg-red-700: verificado
- OCTable contiene animate-pulse: verificado
- OCTable contiene todos los 6 badges con clases exactas del UI-SPEC: verificado
- OCTable contiene text-red-600 hover:text-red-700 hover:bg-red-50: verificado
- OCTable contiene aria-label="Visualizar OC": verificado
- OCTable contiene aria-label="Editar OC": verificado
- OCTable contiene aria-label="Eliminar OC": verificado
- OCTable contiene min-h-[44px] min-w-[44px]: verificado
- OCTable contiene overflow-x-auto: verificado
- OCTable contiene min-w-[640px]: verificado
- OCTable contiene hover:bg-acento/20: verificado
- EmptyState contiene No hay órdenes de compra: verificado
- EmptyState contiene No hay resultados para tu búsqueda: verificado
- EmptyState contiene href="/importador/oc/nueva": verificado
- Sin any/as any en ningún archivo: verificado
