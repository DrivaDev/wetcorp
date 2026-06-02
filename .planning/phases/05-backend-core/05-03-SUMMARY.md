---
phase: 05-backend-core
plan: "03"
subsystem: wizard+ui
tags: [wizard-wiring, server-actions, server-components, session-storage-removal, end-to-end]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [wizard-end-to-end, EditWizardLoader-server-component, OC-detail-real-data]
  affects: []
tech_stack:
  added: []
  patterns: [server-component-async, client-component-props, no-session-storage]
key_files:
  created: []
  modified:
    - src/components/wizard/Step1Form.tsx
    - src/components/wizard/Step2Form.tsx
    - src/components/wizard/WizardPage.tsx
    - src/app/(importador)/importador/oc/[id]/page.tsx
    - src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/page.tsx
    - src/app/(proveedor)/proveedor/oc/[id]/editar/EditWizardLoader.tsx
    - src/app/(despachante)/despachante/oc/[id]/page.tsx
    - src/app/(despachante)/despachante/oc/[id]/editar/EditWizardLoader.tsx
decisions:
  - "Step1Form tiene props opcionales initialData y ocId para soportar modo edición sin sessionStorage"
  - "En modo edición ocId definido: Step1Form navega a /importador/oc/[ocId]?step=2 sin llamar createOC (datos ya existen en DB)"
  - "WizardPage mapea OCDetalle al shape {info, productos} de Step1Form en modo edición — conversión explícita en el Server Component tree"
  - "Step2Form recibe ocData como prop desde el Server Component padre — no hay useEffect ni sessionStorage"
  - "sessionStorage completamente eliminado de src/ — 0 referencias en el codebase"
metrics:
  duration: "~20 min"
  completed: "2026-06-02"
  tasks_completed: 2
  files_created: 0
  files_modified: 9
---

# Phase 5 Plan 03: Wizard Wiring — Conexión end-to-end al Backend — Summary

Wizard Step1Form conectado a createOC con redirect a /importador/oc/[id]?step=2, Step2Form recibe ocData de MongoDB como prop y llama updateOC al guardar, sessionStorage eliminado de todo el codebase, los 3 EditWizardLoaders convertidos a async Server Components con getOCById, y páginas de detalle de proveedor y despachante reemplazando mocks por datos reales de MongoDB.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Conectar Step1Form a createOC y Step2Form a updateOC (eliminar sessionStorage) | 58e2ca0 | Step1Form.tsx, Step2Form.tsx, WizardPage.tsx, (importador)/oc/[id]/page.tsx |
| 2 | Convertir EditWizardLoaders a Server Components + reemplazar mock en páginas de detalle | ff25cc2 | 3x EditWizardLoader.tsx, (proveedor)/oc/[id]/page.tsx, (despachante)/oc/[id]/page.tsx |

## Decisions Made

1. **Step1Form con props opcionales para edición**: `initialData` pre-pobla los estados de info y productos. `ocId` determina si estamos en modo edición — si está definido, el botón "Continuar a Paso 2" simplemente navega a la ruta de Step 2 con el ID existente en lugar de llamar `createOC`.

2. **WizardPage hace el mapeo OCDetalle → {info, productos}**: El tipo `OCDetalle` tiene estructura plana; `Step1Form` espera `{ info: InfoGeneralState; productos: ProductRow[] }`. El mapeo explícito ocurre en `WizardPage.tsx` para mantener `Step1Form` independiente del tipo de la API.

3. **Step2Form sin useEffect ni sessionStorage**: Recibe `ocData` directamente como prop desde el Server Component que llama a `getOCById`. Los estados de gastos se inicializan desde `ocData` en los `useState`.

4. **Modo edición de Step 1 simplificado**: Siguiendo la directiva D-04 del plan, en el flujo de edición Step 1 pre-carga los datos actuales. Al hacer clic en "Continuar a Paso 2", navega con el `ocId` existente sin persistir cambios de Step 1 en esta fase. El `updateOC` en Step 2 persiste solo gastos y estado.

5. **EditWizardLoaders como pure async Server Components**: Sin estado ni efectos de cliente — llaman `getOCById` y renderizan `WizardPage` con los datos. Si la OC no existe, redirigen al dashboard del rol correspondiente.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corregido tipo en WizardPage para mapeo OCDetalle → initialData**
- **Found during:** Task 1 — TypeScript rechazó pasar `OCDetalle` directamente como `initialData` porque `Step1Form` espera `{ info: InfoGeneralState; productos: ProductRow[] }`
- **Fix:** WizardPage hace el mapeo explícito construyendo el objeto `{ info, productos }` antes de pasar como prop a Step1Form
- **Files modified:** src/components/wizard/WizardPage.tsx
- **Commit:** 58e2ca0 (segunda revisión antes del commit)

## Known Stubs

Ninguno — todos los componentes modificados consumen datos reales de MongoDB o pasan datos reales como props.

## Threat Flags

Ninguno nuevo. Las amenazas del threat model del plan fueron mitigadas por `getOCById` en Plan 02:
- T-05-08 (IDOR): `getOCById` verifica `importadorId === userId` para importador y membership en emailsProveedor/emailsDespachante para proveedor y despachante respectivamente.
- T-05-09 y T-05-10: ocData pasa de Server Component a Client Component via serialización de Next.js — ya validada antes de llegar al cliente.

## Self-Check: PASSED

- src/components/wizard/Step1Form.tsx: FOUND — sin sessionStorage, con createOC
- src/components/wizard/Step2Form.tsx: FOUND — sin sessionStorage, sin useEffect, con updateOC
- src/components/wizard/WizardPage.tsx: FOUND — props ocData y ocId en interfaz
- src/app/(importador)/importador/oc/[id]/page.tsx: FOUND — con getOCById, sin MOCK_OCS_DETALLE
- src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx: FOUND — async Server Component con getOCById
- src/app/(proveedor)/proveedor/oc/[id]/editar/EditWizardLoader.tsx: FOUND — async Server Component con getOCById
- src/app/(despachante)/despachante/oc/[id]/editar/EditWizardLoader.tsx: FOUND — async Server Component con getOCById
- src/app/(proveedor)/proveedor/oc/[id]/page.tsx: FOUND — sin MOCK_OCS_DETALLE, con getOCById
- src/app/(despachante)/despachante/oc/[id]/page.tsx: FOUND — sin MOCK_OCS_DETALLE, con getOCById
- sessionStorage en src/: 0 referencias
- Commit 58e2ca0: FOUND
- Commit ff25cc2: FOUND
- npx tsc --noEmit: sin errores

## Status: COMPLETE
