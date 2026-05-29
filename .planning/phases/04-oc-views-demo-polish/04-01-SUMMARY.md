---
phase: 04-oc-views-demo-polish
plan: 01
subsystem: shared-components
tags: [mock-data, read-only, components, ui]
dependency_graph:
  requires: []
  provides:
    - OCDetalle interface + MOCK_OCS_DETALLE array (10 OCs, 2 with rich data)
    - EstadoBadge Server Component (reusable estado pill)
    - GastosCard readOnly mode
    - OtrosGastosSection readOnly mode
    - DocumentSlots readOnly mode + documentos props
    - EmptyState updated copy (3 states per UI-SPEC)
  affects:
    - src/lib/mock-ocs.ts
    - src/components/ui/EstadoBadge.tsx
    - src/components/wizard/GastosCard.tsx
    - src/components/wizard/OtrosGastosSection.tsx
    - src/components/wizard/DocumentSlots.tsx
    - src/components/dashboard/EmptyState.tsx
tech_stack:
  added: []
  patterns:
    - OCDetalle interface extends OC with full financial fields compatible with wizard-types
    - readOnly opt-in pattern: prop absent = existing wizard behavior unchanged
    - Server Component for display-only badge (no 'use client')
    - FIXED_SLOT_KEYS map for DocumentSlots slot-name to documentos key mapping
key_files:
  created:
    - src/components/ui/EstadoBadge.tsx
  modified:
    - src/lib/mock-ocs.ts
    - src/components/dashboard/EmptyState.tsx
    - src/components/wizard/GastosCard.tsx
    - src/components/wizard/OtrosGastosSection.tsx
    - src/components/wizard/DocumentSlots.tsx
decisions:
  - OCDetalle imports wizard-types via type-only import to avoid circular deps (wizard-types already imports EstadoOC from mock-ocs)
  - emptyGastosDespacho/emptyGastosDespachante/emptyGastosAdicionales/emptyImpuestos constants extracted to avoid repetition across 8 empty OCs
  - DocumentRow accepts fileNameProp rather than reading from local state when readOnly, to display passed documentos data
  - FIXED_SLOT_KEYS record maps slot display names to OCDetalle.documentos keys
metrics:
  duration: ~20 min
  completed: 2026-05-28
  tasks_completed: 3
  files_changed: 6
---

# Phase 04 Plan 01: Base Compartida — Mock Data + readOnly Components + EstadoBadge

OCDetalle interface + MOCK_OCS_DETALLE (10 OCs, OC-003/OC-004 con datos financieros reales a tipoCambio 1200), readOnly opt-in en GastosCard/OtrosGastosSection/DocumentSlots, EstadoBadge Server Component extraído de OCTable, EmptyState con copy correcto del UI-SPEC.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Expandir mock-ocs.ts con OCDetalle y MOCK_OCS_DETALLE | 0928c80 | src/lib/mock-ocs.ts |
| 2 | Crear EstadoBadge + actualizar EmptyState | 6aeb4e0 | src/components/ui/EstadoBadge.tsx, src/components/dashboard/EmptyState.tsx |
| 3 | Agregar readOnly a GastosCard, OtrosGastosSection, DocumentSlots | 234c134 | src/components/wizard/GastosCard.tsx, src/components/wizard/OtrosGastosSection.tsx, src/components/wizard/DocumentSlots.tsx |

## Decisions Made

1. **OCDetalle import pattern**: se usa `import type` para los tipos de wizard-types. Wizard-types ya importa `EstadoOC` desde mock-ocs; agregar import inverso como `import type` evita cualquier riesgo de ciclo en compilación.

2. **Constantes de estado vacío**: se extrajeron `emptyGastosDespacho`, `emptyGastosDespachante`, `emptyGastosAdicionales`, `emptyImpuestos` y `emptyDocumentos` para reusar en las 8 OCs sin datos financieros, en lugar de repetir objetos inline.

3. **FIXED_SLOT_KEYS en DocumentSlots**: mapa de nombre de slot → key del objeto `documentos` para conectar los nombres de display (`'Factura proveedor'`) con las keys tipadas (`facturaProveedor`) sin hardcodear la lógica en el render.

4. **readOnly es opt-in**: ningún prop existente cambió su comportamiento. El wizard de creación (`/importador/oc/nueva`) no pasa `readOnly`, por lo que el comportamiento es idéntico al anterior.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` pasa sin errores en todas las tareas
- MOCK_OCS_DETALLE tiene 10 entradas; OC-003 (id='3') y OC-004 (id='4') tienen productos/gastos/impuestos poblados con `tipoCambio: '1200'`
- EstadoBadge no contiene `'use client'`
- EmptyState contiene los 3 estados de copy: "Todavía no hay OCs", "No hay OCs asignadas", "Sin resultados"
- Los 3 componentes wizard tienen `readOnlyClass` y aceptan `readOnly?: boolean`

## Known Stubs

None. Este plan no construye páginas con datos visibles al usuario — solo infraestructura de datos y componentes base que plans 02 y 03 conectarán a rutas reales.

## Self-Check: PASSED

- src/lib/mock-ocs.ts: FOUND
- src/components/ui/EstadoBadge.tsx: FOUND
- src/components/dashboard/EmptyState.tsx: FOUND
- src/components/wizard/GastosCard.tsx: FOUND
- src/components/wizard/OtrosGastosSection.tsx: FOUND
- src/components/wizard/DocumentSlots.tsx: FOUND
- Commit 0928c80: FOUND
- Commit 6aeb4e0: FOUND
- Commit 234c134: FOUND
