---
phase: 05-backend-core
plan: "02"
subsystem: persistence+ui
tags: [server-actions, mongodb, dashboard, server-components, idor]
dependency_graph:
  requires: [05-01]
  provides: [createOC, updateOC, deleteOC, getOCs, getOCById, DashboardClient]
  affects: [05-03-PLAN.md]
tech_stack:
  added: []
  patterns: [server-action-with-auth, server-component-async, client-component-filters, centavos-conversion]
key_files:
  created:
    - src/actions/oc.ts
    - src/components/dashboard/DashboardClient.tsx
  modified:
    - src/app/(importador)/importador/dashboard/page.tsx
    - src/app/(proveedor)/proveedor/dashboard/page.tsx
    - src/app/(despachante)/despachante/dashboard/page.tsx
    - src/lib/mock-ocs.ts
decisions:
  - "fecha en SerializedOC usa createdAt (ISO) en lugar de fechaOC (string ingresado por usuario en DD/MM/YYYY) — formatFecha en OCTable requiere YYYY-MM-DD"
  - "cantidad de productos se guarda como entero sin multiplicar x100 — no es valor monetario sino cantidad de unidades"
  - "serializeOC retorna SerializedOC = OCDetalle & extras — extiende en lugar de reemplazar para compatibilidad con OCTable sin cambios"
  - "mock-ocs.ts actualizado para incluir certificadoAnalisis en OCDetalle.documentos — agregado en commit 1b3d6ab pero faltaba en el tipo"
  - "Fallback vacío en los 3 dashboard pages cuando getOCs retorna error — evita crash si MONGODB_URI no está configurada"
metrics:
  duration: "~20 min"
  completed: "2026-06-02"
  tasks_completed: 2
  files_created: 2
  files_modified: 4
---

# Phase 5 Plan 02: Server Actions OC + Dashboards con Datos Reales — Summary

5 Server Actions de OC con auth guards, IDOR protection y conversión de centavos, más los 3 dashboards refactorizados a Server Components async que fetchean datos reales de MongoDB vía getOCs().

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Server Actions — createOC, updateOC, deleteOC, getOCs, getOCById | 88b1bb2 | src/actions/oc.ts, src/lib/mock-ocs.ts |
| 2 | Refactorizar los 3 dashboards a Server Components + crear DashboardClient | a451ba6 | src/components/dashboard/DashboardClient.tsx, 3 dashboard pages |

## Decisions Made

1. **`fecha` usa `createdAt` (ISO) en lugar de `fechaOC`**: `fechaOC` es un string ingresado por el usuario en formato `DD/MM/YYYY`. `OCTable.formatFecha` espera `YYYY-MM-DD`. Usar `createdAt` de MongoDB (siempre ISO) garantiza formato correcto.

2. **`cantidad` de productos sin multiplicar x100**: `toCentavos` es para valores monetarios. La cantidad de unidades (ej: `100 unidades`) se guarda como entero directo con `Math.round(parseFloat(val || '0'))`.

3. **`SerializedOC` extiende `OCDetalle`**: Añade `fechaDespacho`, `fechaPago`, `importadorId`, `otrosImpuestos` como campos extra sin modificar la interfaz base que consume OCTable.

4. **`mock-ocs.ts` actualizado**: Se agregó `certificadoAnalisis: string | null` al tipo `OCDetalle.documentos` para alinear con el modelo MongoDB (ya existía en DocumentSlots y el schema Mongoose desde commit `1b3d6ab`).

5. **Fallback vacío en dashboard pages**: `'error' in result ? { ocs: [], stats: defaultStats() } : result.data` — los dashboards muestran EmptyState en lugar de lanzar error si MongoDB no está disponible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing field] Agregado `certificadoAnalisis` a `OCDetalle.documentos`**
- **Found during:** Task 1 — TypeScript strict detectó que `serializeOC` retorna `certificadoAnalisis` pero `OCDetalle.documentos` no lo tenía
- **Fix:** Agregado `certificadoAnalisis: string | null` al tipo en `mock-ocs.ts` y a todos los objetos `emptyDocumentos` y documentos inline en `MOCK_OCS_DETALLE`
- **Files modified:** `src/lib/mock-ocs.ts`
- **Commit:** 88b1bb2

**2. [Rule 1 - Bug] `fecha` usa `createdAt` en lugar de `fechaOC`**
- **Found during:** Task 1 — análisis de `formatFecha` en OCTable
- **Issue:** `fechaOC` es `DD/MM/YYYY`; `formatFecha` hace `.split('-')` esperando `YYYY-MM-DD`
- **Fix:** `serializeOC` mapea `fecha` siempre desde `createdAt` (ISO), ignorando `fechaOC` para este campo
- **Files modified:** `src/actions/oc.ts`
- **Commit:** 88b1bb2

## Known Stubs

Ninguno — los dashboards consumen datos reales de MongoDB a través de `getOCs()`. Si la BD está vacía, muestra `EmptyState` correctamente.

## Threat Flags

Ninguno nuevo. Todas las amenazas del threat model fueron mitigadas:
- T-05-04 (IDOR): `importadorId !== userId` en `updateOC` y `deleteOC`
- T-05-05 (info disclosure): `estado === 'borrador'` gate en `getOCById` para proveedor/despachante
- T-05-06 (NoSQL injection): email viene del JWT de Clerk, no de input del usuario
- T-05-07 (spoofing): rol extraído de `sessionClaims.metadata.role` (JWT firmado), no de parámetros

## Self-Check: PASSED

- src/actions/oc.ts: FOUND
- src/components/dashboard/DashboardClient.tsx: FOUND
- src/app/(importador)/importador/dashboard/page.tsx: FOUND (sin 'use client', con getOCs)
- src/app/(proveedor)/proveedor/dashboard/page.tsx: FOUND (sin 'use client', con getOCs)
- src/app/(despachante)/despachante/dashboard/page.tsx: FOUND (sin 'use client', con getOCs)
- Commit 88b1bb2: FOUND
- Commit a451ba6: FOUND
- npx tsc --noEmit: sin errores

## Status: COMPLETE
