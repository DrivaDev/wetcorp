---
phase: 03-oc-wizard-ui
plan: "01"
subsystem: wizard-foundation
tags: [decimal.js, typescript-types, form, dynamic-table, sessionStorage]
dependency_graph:
  requires: []
  provides:
    - wizard-types (ProductRow, InfoGeneralState, GastosDespacho, GastosDespachante, GastosAdicionales, OtroGastoRow, Step1Data)
    - wizard-calculations (13 funciones puras de cálculo financiero)
    - page.tsx del wizard en /importador/oc/nueva
    - Step1Form con estado completo y validación
    - ProductosTable con recálculo en tiempo real
  affects:
    - plan 03-02 (consume wizard-types y wizard-calculations)
    - plan 03-03 (consume WizardPage stub, reemplaza con implementación real)
tech_stack:
  added:
    - decimal.js@10.6.0
  patterns:
    - Controlled inputs con string state (nunca number) para inputs financieros
    - Array de objetos en useState para tabla dinámica (key={row.id} con UUID)
    - sessionStorage serialization para navegación entre steps
    - Server Component async con await searchParams (Next.js 16)
key_files:
  created:
    - src/lib/wizard-types.ts
    - src/lib/wizard-calculations.ts
    - src/app/(importador)/importador/oc/nueva/page.tsx
    - src/components/wizard/WizardPage.tsx
    - src/components/wizard/Step1Form.tsx
    - src/components/wizard/ProductosTable.tsx
  modified:
    - package.json (decimal.js agregado a dependencies)
    - package-lock.json
decisions:
  - "D-01: Sin indicador de progreso — solo título del paso (implementado)"
  - "D-05: Step1Data serializado a sessionStorage['oc-step1-draft'] al navegar a Step 2 (implementado)"
  - "D-06: useEffect al montar Step1Form lee sessionStorage para pre-poblar formulario (implementado)"
  - "D-07: URL con query params (?step=1, ?step=2), page.tsx Server Component lee searchParams como Promise (implementado)"
  - "D-09: Recálculo en tiempo real por keystroke con calcTotalFila y calcFOBTotal (implementado)"
  - "D-10: Campos requeridos por fila: producto, cantidad, valorUSD — descripción opcional (implementado)"
  - "WizardPage.tsx creado como stub temporal hasta plan 03-03 (necesario para que page.tsx compile)"
metrics:
  duration: "~20 min"
  completed: "2026-05-27"
  tasks_completed: 2
  files_created: 6
  files_modified: 2
---

# Phase 3 Plan 01: Tipos, Cálculos y Step 1 del Wizard — Summary

**One-liner:** Base tipada y computacional del wizard OC con decimal.js, formulario Step 1 con tabla dinámica y recálculo en tiempo real.

---

## Tasks Completed

| Task | Commit | Files |
|------|--------|-------|
| 1: Instalar decimal.js + wizard-types + wizard-calculations | 0e6d732 | src/lib/wizard-types.ts, src/lib/wizard-calculations.ts, package.json |
| 2: page.tsx + Step1Form + ProductosTable | 75904e2 | src/app/(importador)/importador/oc/nueva/page.tsx, src/components/wizard/WizardPage.tsx, src/components/wizard/Step1Form.tsx, src/components/wizard/ProductosTable.tsx |

---

## Interfaces Exportadas

### wizard-types.ts

| Tipo | Campos clave |
|------|-------------|
| `ProductRow` | id, producto, descripcion, cantidad (string), valorUSD (string) |
| `InfoGeneralState` | referenciaOC, estado (EstadoOC), proveedor, emailProveedor, emailDespachante, paisOrigen, fechaOC, llegadaEstimada, tipoCambio (string), divisa, notas |
| `GastosDespacho` | sim, derechos, otros (todos string) |
| `GastosDespachante` | terminal, fleteInternacional (USD), fleteInterno, senasa, despachante (todos string) |
| `GastosAdicionales` | depositoFiscal, digitalizacion, estanciaCamion, iibb (todos string) |
| `OtroGastoRow` | id, descripcion, monto (string), divisa ('ARS' \| 'USD') |
| `Step1Data` | info: InfoGeneralState, productos: ProductRow[] |

### wizard-calculations.ts

| Función | Propósito |
|---------|-----------|
| `calcTotalFila(row)` | Decimal — Cantidad × Valor USD de una fila |
| `calcFOBTotal(rows)` | Decimal — Suma de todos los totales de fila |
| `arsToUSD(montoPesos, tc)` | Decimal — Convierte ARS a USD usando tipo de cambio |
| `usdToARS(montoUSD, tc)` | Decimal — Convierte USD a ARS usando tipo de cambio |
| `calcSubtotalDespacho(g, tc)` | Decimal — Subtotal sección Despacho en USD equivalente |
| `calcSubtotalDespachante(g, tc)` | Decimal — Subtotal sección Despachante en USD equivalente |
| `calcSubtotalAdicionales(g, tc)` | Decimal — Subtotal sección Gastos Adicionales en USD equivalente |
| `calcSubtotalOtros(rows, tc)` | Decimal — Subtotal Otros Gastos con divisa mixta en USD equivalente |
| `calcTotalGastos(d, ds, a, o, tc)` | Decimal — Total global de gastos en USD equivalente |
| `calcLandedCost(fobUSD, gastosUSD)` | Decimal — FOB + Gastos = Landed Cost |
| `isStep1Valid(info, productos)` | boolean — Valida campos requeridos para habilitar Paso 2 |
| `formatUSD(d)` | string — `USD X.XX` |
| `formatARS(d)` | string — `$ X.XX` |

### STORAGE_KEY

`'oc-step1-draft'` — clave usada en sessionStorage para serializar Step1Data.

---

## Deviations from Plan

### Auto-added: WizardPage.tsx stub temporal

- **Found during:** Task 2 — page.tsx requiere importar WizardPage que no existe hasta plan 03-03
- **Issue:** TypeScript error de módulo no encontrado si se importa WizardPage sin que exista
- **Fix:** Creado stub mínimo `src/components/wizard/WizardPage.tsx` con `{ initialStep: string }` props. Plan 03-03 reemplaza con la implementación real.
- **Files modified:** src/components/wizard/WizardPage.tsx (nuevo)
- **Classification:** Rule 3 — Fix bloqueante (import no resolvible)

---

## Known Stubs

| Stub | Archivo | Razón |
|------|---------|-------|
| `WizardPage` retorna `<div>Step {initialStep}</div>` | src/components/wizard/WizardPage.tsx | Stub temporal — plan 03-03 implementa el routing real entre Step1Form y Step2Form |

---

## Self-Check: PASSED

- src/lib/wizard-types.ts: FOUND
- src/lib/wizard-calculations.ts: FOUND
- src/app/(importador)/importador/oc/nueva/page.tsx: FOUND
- src/components/wizard/Step1Form.tsx: FOUND
- src/components/wizard/ProductosTable.tsx: FOUND
- src/components/wizard/WizardPage.tsx: FOUND
- Commit 0e6d732: FOUND
- Commit 75904e2: FOUND
