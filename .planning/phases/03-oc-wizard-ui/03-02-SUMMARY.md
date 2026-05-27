---
phase: 03-oc-wizard-ui
plan: "02"
subsystem: wizard-step2
tags: [step2, gastos, decimal.js, sessionStorage, react-state, real-time-calc]
dependency_graph:
  requires:
    - plan 03-01 (wizard-types, wizard-calculations, WizardPage stub)
  provides:
    - ResumenStep1 (read-only resumen de Step1Data)
    - GastosCard (card reutilizable para secciones fijas de gastos)
    - OtrosGastosSection (lista dinámica de gastos libres)
    - Step2Form (orquestador completo de Step 2)
  affects:
    - plan 03-03 (inserta ValueCards y DocumentSlots en Step2Form, reemplaza WizardPage stub)
tech_stack:
  added: []
  patterns:
    - GastosCard genérico con campos configurables por props (camposDespacho, camposDespachante, camposAdicionales)
    - OtrosGastosSection con filas dinámicas y key={row.id} UUID estable
    - Step2Form lee sessionStorage en useEffect al montar, redirect a step=1 si vacío (D-06)
    - Cálculos derivados en render (no en estado) — subtotales y total global recalculados por keystroke
    - Toast de éxito con useState + setTimeout (sin librería externa)
key_files:
  created:
    - src/components/wizard/ResumenStep1.tsx
    - src/components/wizard/GastosCard.tsx
    - src/components/wizard/OtrosGastosSection.tsx
    - src/components/wizard/Step2Form.tsx
  modified: []
decisions:
  - "D-03: handleVolver usa router.push sin limpiar sessionStorage — datos de Step 1 persisten (implementado)"
  - "D-04: handleGuardar muestra toast + redirect a /importador/dashboard sin llamada real al backend — Phase 3 (implementado)"
  - "D-06: useEffect al montar lee sessionStorage['oc-step1-draft'], redirige a ?step=1 si vacío (implementado)"
  - "D-11: 4 secciones de gastos en cards separadas — Despacho (3 campos ARS), Despachante (5 campos ARS/USD), Adicionales (4 campos ARS), Otros (dinámica) (implementado)"
  - "D-12: Subtotal por card + total global, todos calculados con decimal.js en tiempo real (implementado)"
  - "STORAGE_KEY confirmado: 'oc-step1-draft' — consistente con plan 03-01"
  - "Step2Form usa cálculos derivados en render (no useMemo) — suficiente para la carga de datos del wizard"
  - "GastosCard recibe values como Record<string, string> — cast aplicado en Step2Form para compatibilidad de tipos"
metrics:
  duration: "~25 min"
  completed: "2026-05-27"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 3 Plan 02: Step 2 del Wizard — Componentes de Gastos — Summary

**One-liner:** Componentes de Step 2 del wizard OC con resumen read-only de Step 1, 4 cards de gastos configurables y subtotales en tiempo real con decimal.js.

---

## Tasks Completed

| Task | Commit | Files |
|------|--------|-------|
| 1: ResumenStep1.tsx y GastosCard.tsx | bbaa34d | src/components/wizard/ResumenStep1.tsx, src/components/wizard/GastosCard.tsx |
| 2: OtrosGastosSection.tsx y Step2Form.tsx | e7da465 | src/components/wizard/OtrosGastosSection.tsx, src/components/wizard/Step2Form.tsx |

---

## Interfaces Exportadas

### ResumenStep1.tsx

| Prop | Tipo | Descripción |
|------|------|-------------|
| `step1Data` | `Step1Data` | Datos del Step 1 leídos desde sessionStorage |

Muestra: Referencia OC, Estado (badge), Proveedor, País de origen, Fecha OC, Llegada estimada, Tipo de cambio + divisa, Notas. Tabla de productos con columnas #, Producto, Descripción, Cantidad, Valor unit. USD, Total USD. Fila de totales con FOB Total en USD + ARS equivalente.

### GastosCard.tsx

| Prop | Tipo | Descripción |
|------|------|-------------|
| `titulo` | `string` | Título de la sección |
| `campos` | `GastoField[]` | Configuración de campos (key, label, divisa) |
| `values` | `Record<string, string>` | Valores actuales de los campos |
| `subtotalUSD` | `Decimal` | Subtotal en USD calculado por el padre |
| `tipoCambio` | `string` | Para mostrar subtotal en ARS |
| `onChange` | `(key, value) => void` | Handler de cambio |

### OtrosGastosSection.tsx

| Prop | Tipo | Descripción |
|------|------|-------------|
| `rows` | `OtroGastoRow[]` | Filas de gastos libres |
| `subtotalUSD` | `Decimal` | Subtotal calculado por el padre |
| `tipoCambio` | `string` | Para equivalente ARS |
| `onAdd` | `() => void` | Agrega fila nueva |
| `onRemove` | `(id) => void` | Elimina fila por ID |
| `onChange` | `(id, field, value) => void` | Actualiza campo de fila |

### Step2Form.tsx

Sin props — lee sessionStorage internamente. Exporta:
- Orquestación completa de Step 2
- Toast de éxito en UI al guardar
- Redirect a /importador/dashboard después de 2000ms

---

## Configuración de Campos por Card

### camposDespacho (3 campos, todos ARS)
- `sim` — SIM (ARS)
- `derechos` — Derechos (ARS)
- `otros` — Otros (ARS)

### camposDespachante (5 campos, ARS y USD)
- `terminal` — Terminal (ARS)
- `fleteInternacional` — Flete internacional (USD) — único campo USD en sección fija
- `fleteInterno` — Flete interno (ARS)
- `senasa` — SENASA (ARS)
- `despachante` — Despachante (ARS)

### camposAdicionales (4 campos, todos ARS)
- `depositoFiscal` — Depósito fiscal (ARS)
- `digitalizacion` — Digitalización (ARS)
- `estanciaCamion` — Estancia de camión (ARS)
- `iibb` — IIBB (ARS)

---

## Nota sobre handleGuardar

`handleGuardar` en Step2Form muestra el toast y redirige al dashboard sin llamar a ningún endpoint real. Esta es la decisión D-04 — Phase 3 es solo UI. La persistencia real en MongoDB se implementa en Phase 5.

---

## Deviations from Plan

None — plan ejecutado exactamente como fue escrito.

---

## Known Stubs

| Stub | Archivo | Razón |
|------|---------|-------|
| Slot para ValueCards y DocumentSlots comentado | src/components/wizard/Step2Form.tsx | Plan 03-03 inserta los componentes reales en este slot |
| WizardPage retorna `<div>Step {initialStep}</div>` | src/components/wizard/WizardPage.tsx | Stub de plan 03-01 — plan 03-03 implementa el routing real entre Step1Form y Step2Form |

---

## Threat Surface Scan

No nuevas superficies de red introducidas. Los componentes de Step 2 son puramente client-side con estado local en React + sessionStorage. Ningún endpoint creado ni modificado.

---

## Self-Check: PASSED

- src/components/wizard/ResumenStep1.tsx: FOUND
- src/components/wizard/GastosCard.tsx: FOUND
- src/components/wizard/OtrosGastosSection.tsx: FOUND
- src/components/wizard/Step2Form.tsx: FOUND
- Commit bbaa34d: FOUND
- Commit e7da465: FOUND
