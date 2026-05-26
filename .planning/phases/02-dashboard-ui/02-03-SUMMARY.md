---
phase: 02-dashboard-ui
plan: "03"
subsystem: dashboard-pages
tags: [dashboard, filter, client-components, role-filtering, typescript]
dependency_graph:
  requires: [mock-ocs-data-layer, stat-card, oc-table, delete-modal, empty-state]
  provides: [importador-dashboard, proveedor-dashboard, despachante-dashboard, filter-bar]
  affects: [phase-2-demo-complete]
tech_stack:
  added: []
  patterns: [use-client-directive, useState-filter, role-based-data-subset, named-exports]
key_files:
  created:
    - src/components/dashboard/FilterBar.tsx
  modified:
    - src/app/(importador)/importador/dashboard/page.tsx
    - src/app/(proveedor)/proveedor/dashboard/page.tsx
    - src/app/(despachante)/despachante/dashboard/page.tsx
    - src/components/dashboard/OCTable.tsx
decisions:
  - "Las tres páginas de dashboard son Client Components (use client) porque usan useState para filtros — no Server Components como originalmente indicaba PATTERNS.md"
  - "OCTable actualizado para aceptar prop hasFilters opcional (default false) para propagar el estado de filtros al EmptyState — mejora el mensaje cuando no hay resultados por filtro activo"
  - "Stats calculadas desde el subset de OCs del rol (no filtradas) para que los conteos sean estables mientras el usuario filtra"
metrics:
  duration: ~10 min
  completed: 2026-05-26
---

# Phase 2 Plan 03: FilterBar y Wireo de Dashboards Summary

**One-liner:** FilterBar con input texto + select estado, y tres páginas de dashboard funcionales (importador/proveedor/despachante) con stat cards calculadas por rol, filtrado client-side en tiempo real y cada rol ve solo su subset de OCs mock.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | FilterBar component | 233002c | src/components/dashboard/FilterBar.tsx |
| 2 | Wirear los tres dashboards | 7001ba2 | src/app/(importador)/importador/dashboard/page.tsx, src/app/(proveedor)/proveedor/dashboard/page.tsx, src/app/(despachante)/despachante/dashboard/page.tsx, src/components/dashboard/OCTable.tsx |

## Decisions Made

- Las tres páginas usan `'use client'` porque necesitan `useState` para los filtros — PATTERNS.md los clasificaba como Server Components pero el plan 02-03 los especificó como Client Components con filtros inline.
- `hasFilters` prop agregada a OCTable (Rule 2: funcionalidad crítica faltante) para que EmptyState muestre el mensaje correcto: "No hay resultados para tu búsqueda" cuando hay filtros activos vs "No hay órdenes de compra" cuando no hay datos.
- Stats calculadas siempre desde el subset base del rol (sin aplicar filtros de búsqueda) para que los conteos sean estables e informativos independientemente del filtro activo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] hasFilters propagado a OCTable**
- **Found during:** Task 2
- **Issue:** OCTable tenía `hasFilters` hardcodeado a `false` — EmptyState siempre mostraba "No hay órdenes de compra" aunque hubiera filtros activos. El plan especificaba que `hasFilters` debería controlarse desde la página.
- **Fix:** Agregada prop `hasFilters?: boolean` (default `false`) a `OCTableProps` y propagada a `EmptyState`. Las páginas de dashboard calculan `hasFilters = searchQuery !== '' || estadoFiltro !== ''` y lo pasan a OCTable.
- **Files modified:** src/components/dashboard/OCTable.tsx
- **Commit:** 7001ba2

## Known Stubs

- Los emails de filtrado (`proveedor@empresa.com`, `despachante@logistica.com`) son strings hardcodeados en el source code — intencional para Phase 2. Phase 5 reemplazará con `currentUser()` de Clerk para obtener el email del usuario autenticado.
- Rutas de Eye y Pencil navegan a páginas que no existen aún — stubs hasta Phase 4.
- `onConfirm` del DeleteModal cierra el modal sin eliminar — intencional para Phase 2. Phase 5 implementará el Server Action `deleteOC`.

## Threat Flags

Ninguno — los cuatro threats del plan (T-02-03-01 a T-02-03-04) tienen disposición `accept` para Phase 2 UI-only. Ninguna superficie nueva no anticipada.

## Self-Check: PASSED

- src/components/dashboard/FilterBar.tsx: FOUND
- src/app/(importador)/importador/dashboard/page.tsx: FOUND
- src/app/(proveedor)/proveedor/dashboard/page.tsx: FOUND
- src/app/(despachante)/despachante/dashboard/page.tsx: FOUND
- commit 233002c: FOUND (FilterBar)
- commit 7001ba2: FOUND (tres dashboards + OCTable update)
- npx tsc --noEmit: sin errores
- FilterBar contiene 'use client' en línea 1: verificado
- FilterBar contiene 'Buscar por proveedor...': verificado
- FilterBar contiene 'Todos los estados': verificado
- FilterBar contiene w-full sm:w-64 px-4 py-2 rounded-lg border border-acento: verificado
- FilterBar contiene w-full sm:w-48 px-4 py-2 rounded-lg border border-acento: verificado
- FilterBar contiene flex flex-col sm:flex-row gap-3 mb-4: verificado
- FilterBar contiene export function FilterBar: verificado
- FilterBar contiene las 6 options de estado: verificado
- Importador dashboard contiene 'use client': verificado
- Importador dashboard contiene 'Dashboard' (h1): verificado
- Importador dashboard contiene grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8: verificado
- Importador dashboard contiene MOCK_OCS: verificado
- Importador dashboard contiene StatCard: verificado
- Importador dashboard contiene OCTable: verificado
- Importador dashboard contiene FilterBar: verificado
- Importador dashboard contiene rol="importador": verificado
- Importador dashboard contiene 'OC Totales': verificado
- Importador dashboard contiene 'En tránsito': verificado
- Importador dashboard contiene 'En aduana': verificado
- Importador dashboard contiene 'Entregadas': verificado
- Proveedor dashboard contiene 'use client': verificado
- Proveedor dashboard contiene 'Mis Órdenes': verificado
- Proveedor dashboard contiene rol="proveedor": verificado
- Proveedor dashboard contiene emailProveedor: verificado
- Despachante dashboard contiene 'use client': verificado
- Despachante dashboard contiene 'Mis Órdenes': verificado
- Despachante dashboard contiene rol="despachante": verificado
- Despachante dashboard contiene emailDespachante: verificado
- Sin any ni as any en ningún archivo: verificado
