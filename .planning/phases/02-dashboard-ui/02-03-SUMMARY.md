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
| 3 | Human checkpoint | PASSED | Usuario verificó los tres dashboards en el navegador — "aprobado" |
| 4 (post-checkpoint) | Sidebar dark theme + collapse fix + filtros por rol | 730bd0e | src/components/layout/Sidebar.tsx, src/components/dashboard/FilterBar.tsx, src/app/(importador)/importador/dashboard/page.tsx, src/app/(proveedor)/proveedor/dashboard/page.tsx, src/app/(despachante)/despachante/dashboard/page.tsx, src/lib/mock-ocs.ts |
| 5 (post-checkpoint) | Sidebar height + navbar dark theme + sign-out + responsive | 67ae462 | src/components/layout/Navbar.tsx, src/components/layout/Sidebar.tsx, src/app/(importador)/layout.tsx, src/app/(proveedor)/layout.tsx, src/app/(despachante)/layout.tsx, src/middleware.ts, todas las dashboard pages |
| 6 (post-checkpoint) | Columnas dinámicas en OCTable por rol | cd64070 | src/components/dashboard/OCTable.tsx |

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

**2. [Rule 1 - Bug] Sidebar dark theme + collapse fix + filtros por rol (post-checkpoint)**
- **Found during:** Human checkpoint verification
- **Issue:** Sidebar tenía fondo claro en lugar de oscuro (#1C1917); el botón de collapse no funcionaba correctamente; FilterBar no era rol-aware (mostraba los mismos filtros para todos los roles); campo `despachante` faltaba en los datos mock.
- **Fix:** Sidebar reescrito con fondo #1C1917, solo isotipo visible, collapse funcional. FilterBar actualizado con props `rol` y `despachante` para mostrar filtro de proveedor+despachante al importador y solo filtro de estado a proveedor/despachante. Campo `despachante` (nombre) agregado a `OC` en mock-ocs.ts.
- **Files modified:** src/components/layout/Sidebar.tsx, src/components/dashboard/FilterBar.tsx, tres dashboard pages, src/lib/mock-ocs.ts
- **Commit:** 730bd0e

**3. [Rule 1 - Bug] Sidebar height + navbar dark theme + sign-out + responsive (post-checkpoint)**
- **Found during:** Post-checkpoint testing
- **Issue:** Sidebar se cortaba en pantallas de cierta altura (faltaba h-screen/h-full en layout); Navbar tenía fondo claro sin botón de sign-out; proveedor/despachante sin botón para cerrar sesión; stat cards no eran responsive en mobile (4 cols en móvil).
- **Fix:** Layout importador con `h-screen overflow-hidden`, sidebar `h-full flex-shrink-0` con sign-out explícito. Navbar con dark theme #1C1917, isotipo + rol label + sign-out button. Layouts proveedor/despachante con prop `rol` en Navbar. Dashboard pages: `p-4 sm:p-6` y stat cards `grid-cols-2 sm:grid-cols-4`.
- **Files modified:** src/components/layout/Navbar.tsx, src/components/layout/Sidebar.tsx, todos los layouts y dashboard pages, src/middleware.ts
- **Commit:** 67ae462

**4. [Rule 2 - Missing Critical Functionality] Columnas dinámicas en OCTable por rol (post-checkpoint)**
- **Found during:** Post-checkpoint testing
- **Issue:** OCTable mostraba las mismas columnas para todos los roles. El importador debía ver Proveedor + Despachante; proveedor debía ver Despachante (no Proveedor); despachante debía ver Proveedor (no Despachante).
- **Fix:** OCTable refactorizado con columnas dinámicas según `rol`: importador (6 cols: Nº OC | Proveedor | Despachante | Estado | Fecha | Acciones), proveedor (5 cols: sin Proveedor, con Despachante), despachante (5 cols: sin Despachante, con Proveedor). `min-w` ajustado por número de columnas.
- **Files modified:** src/components/dashboard/OCTable.tsx
- **Commit:** cd64070

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
- commit 730bd0e: FOUND (sidebar dark theme + collapse + filtros por rol)
- commit 67ae462: FOUND (sidebar height + navbar dark + responsive)
- commit cd64070: FOUND (columnas dinámicas OCTable)
- Human checkpoint: PASSED — usuario verificó y aprobó los tres dashboards
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
- OCTable columnas dinámicas por rol: verificado (importador 6 cols, proveedor/despachante 5 cols)
