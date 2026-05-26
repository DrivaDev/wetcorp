---
phase: 02-dashboard-ui
plan: "01"
subsystem: data-layer
tags: [mock-data, typescript, types]
dependency_graph:
  requires: []
  provides: [mock-ocs-data-layer]
  affects: [dashboard-components, oc-table, filter-bar, stat-cards]
tech_stack:
  added: []
  patterns: [named-exports, typescript-strict, union-literal-types]
key_files:
  created:
    - src/lib/mock-ocs.ts
  modified: []
decisions:
  - "Interface OC usa emailProveedor/emailDespachante en lugar de proveedor/despachante como campos de email para mayor claridad semántica"
  - "Array MOCK_OCS distribuye los 6 estados con 2x borrador, 2x en_proceso, 2x en_transito, 1x en_aduana, 2x entregada, 1x cancelada"
metrics:
  duration: ~5 min
  completed: 2026-05-25
---

# Phase 2 Plan 01: Mock Data Layer Summary

**One-liner:** Tipos TypeScript OC (EstadoOC union + interfaz OC) y array MOCK_OCS con 10 OCs ficticias cubriendo los 6 estados del sistema para rol-based filtering.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Crear src/lib/mock-ocs.ts con tipos y datos mock | f4a025b | src/lib/mock-ocs.ts |

## Decisions Made

- La interfaz OC contiene `emailProveedor` y `emailDespachante` (campos diferenciados del campo `proveedor` string display name) para permitir filtrado por rol en Phase 5 cuando Clerk provea el sessionClaims email.
- Distribución de estados: 2 borrador, 2 en_proceso, 2 en_transito, 1 en_aduana, 2 entregada, 1 cancelada — cubre los 6 estados para renderizar todos los badges posibles en Phase 2.
- Emails mock divididos: `proveedor@empresa.com` (OCs 1-5), `otro@proveedor.com` (OCs 6-10); `despachante@logistica.com` (OCs 1-7), `otro@despacho.com` (OCs 8-10) — permite demo de filtrado por rol en dashboards de proveedor/despachante.

## Deviations from Plan

None - plan ejecutado exactamente como fue escrito.

## Known Stubs

- MOCK_OCS contiene datos hardcodeados — intencional para Phase 2 UI-only. Phase 5 reemplaza con Server Actions + Mongoose queries scoped por rol.
- `emailProveedor` / `emailDespachante` son strings mock — Phase 5 reemplaza con `sessionClaims.metadata.email` de Clerk JWT.

## Threat Flags

Ninguno — Phase 2 es UI-only con datos ficticios, sin PII real ni endpoints de red.

## Self-Check: PASSED

- src/lib/mock-ocs.ts: FOUND
- commit f4a025b: FOUND
- npx tsc --noEmit: sin errores
- export type EstadoOC: presente
- export interface OC: presente
- export const MOCK_OCS: presente
- 10 entradas en MOCK_OCS: verificado
- 6 estados cubiertos: borrador(2), en_proceso(2), en_transito(2), en_aduana(1), entregada(2), cancelada(1)
- emailProveedor presente en interfaz: verificado
- emailDespachante presente en interfaz: verificado
- Sin default export: verificado
- Sin any/as any: verificado
