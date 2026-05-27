---
phase: 03-oc-wizard-ui
plan: 03
subsystem: ui
tags: [nextjs, react, decimal.js, tailwind, wizard, lucide-react]

# Dependency graph
requires:
  - phase: 03-01
    provides: WizardPage stub, Step1Form, ProductosTable, wizard-types, wizard-calculations
  - phase: 03-02
    provides: ResumenStep1, GastosCard, OtrosGastosSection, Step2Form con gastos en tiempo real
provides:
  - ValueCards: 3 cards finales (FOB, Gastos, Landed Total) con USD + ARS via decimal.js
  - DocumentSlots: 5 slots estáticos con UI de estado vacío — Server Component
  - WizardPage: root Client Component que orquesta Step1Form | Step2Form sin estado propio
  - Step2Form integrado con ValueCards y DocumentSlots — wizard completo end-to-end
affects: [04-oc-detail-ui, 05-oc-backend, 06-cloudinary-upload]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ValueCards recibe instancias Decimal ya calculadas — nunca strings para operaciones aritméticas"
    - "DocumentSlots como Server Component puro — sin use client, sin estado, sin handlers"
    - "WizardPage minimal: < 15 líneas, sin useState ni useEffect, fuente de verdad en URL prop"

key-files:
  created:
    - src/components/wizard/ValueCards.tsx
    - src/components/wizard/DocumentSlots.tsx
  modified:
    - src/components/wizard/WizardPage.tsx
    - src/components/wizard/Step2Form.tsx

key-decisions:
  - "D-13: ValueCards en grid sm:grid-cols-3 con Card 3 (Costo Landed Total) usando bg-fondo para distinción visual"
  - "D-14: DocumentSlots Server Component estático — slots son read-only por diseño, Phase 6 agrega upload real"
  - "DOC-03 parcial: slots visibles para todos los roles — UI lista, funcionalidad de upload diferida"
  - "WizardPage como orquestador mínimo: la fuente de verdad del step es la URL, no estado local"

patterns-established:
  - "Server Component para UI puramente estática — sin use client si no hay interacción"
  - "Decimal props desde el padre: el componente hijo (ValueCards) solo calcula Landed Cost, el padre calcula FOB y GastosTotal"

requirements-completed: [OC2-07, OC2-08, CALC-01, CALC-02, CALC-03, DOC-03]

# Metrics
duration: 15min
completed: 2026-05-27
---

# Phase 3 Plan 03: OC Wizard UI — ValueCards, DocumentSlots y WizardPage Summary

**Wizard de OC completo end-to-end: ValueCards con FOB/Gastos/Landed Total en USD+ARS via decimal.js, 5 DocumentSlots estáticos, y WizardPage como root mínimo que orquesta Step1Form|Step2Form desde URL prop**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-27T00:00:00Z
- **Completed:** 2026-05-27
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- ValueCards.tsx: 3 cards finales (Valor FOB, Gastos de Importación, Costo Landed Total) con valor USD en text-3xl y subtítulo ARS usando decimal.js — Card 3 diferenciada con bg-fondo per D-13
- DocumentSlots.tsx: 5 slots con border-dashed border-acento, Upload icon size=32, "Sin archivo adjunto" — Server Component puro sin use client
- WizardPage.tsx: reemplaza el stub temporal de 03-01 con implementación completa de < 15 líneas sin estado propio
- Step2Form.tsx: integra DocumentSlots y ValueCards en el orden correcto (gastos → total global → documentos → value cards → footer)

## Task Commits

1. **Task 1: Crear ValueCards.tsx y DocumentSlots.tsx** — `bbb5d4d` (feat)
2. **Task 2: Crear WizardPage.tsx + integrar ValueCards y DocumentSlots en Step2Form** — `c7fabb5` (feat)

## Files Created/Modified

- `src/components/wizard/ValueCards.tsx` — 3 cards finales con calcLandedCost, formatUSD, formatARS, usdToARS importados de wizard-calculations
- `src/components/wizard/DocumentSlots.tsx` — 5 slots estáticos, Server Component (sin 'use client'), usa Upload de lucide-react
- `src/components/wizard/WizardPage.tsx` — Client Component root del wizard: if (initialStep === '2') return Step2Form else return Step1Form
- `src/components/wizard/Step2Form.tsx` — agrega imports de ValueCards y DocumentSlots; reemplaza placeholder comment con los componentes integrados

## Decisions Made

- **D-13 implementado:** ValueCards usa grid sm:grid-cols-3, Card 3 (Costo Landed Total) tiene bg-fondo para distinción visual como indica el spec
- **D-14 implementado:** DocumentSlots es Server Component sin use client — los slots son read-only por diseño, compatible con futura vista proveedor/despachante (Phase 4)
- **DOC-03 parcial:** La UI de slots está visible; el upload real de Cloudinary va en Phase 6
- **WizardPage mínimo:** La fuente de verdad del step es la URL (searchParams en page.tsx). WizardPage no necesita useState ni sessionStorage — esa lógica vive en cada componente de step individualmente

## Deviations from Plan

None — plan ejecutado exactamente como fue escrito.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- El wizard de OC está completo de extremo a extremo para Phase 3: Step 1 (info + productos) → Step 2 (gastos + documentos + value cards) → toast + redirect al dashboard
- Phase 4 (OC Detail UI) puede construir las vistas de detalle de OC — DocumentSlots ya es compatible con rol read-only sin cambios
- Phase 5 (Backend) conectará el handleGuardar real con MongoDB + Server Action
- Phase 6 (Cloudinary) implementará el upload real en los DocumentSlots — el componente no necesita cambios de estructura

---
*Phase: 03-oc-wizard-ui*
*Completed: 2026-05-27*
