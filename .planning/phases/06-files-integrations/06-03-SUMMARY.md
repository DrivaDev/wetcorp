---
phase: 06-files-integrations
plan: 03
subsystem: pdf-export-sheets-sync
tags: [react-pdf, google-sheets, pdf-export, fire-and-forget, googleapis]
dependency_graph:
  requires: [06-01, 06-02]
  provides: [oc-pdf-export, google-sheets-sync, syncToSheets-helper]
  affects: [next.config.ts, src/lib/pdf/OCPDFDocument.tsx, src/app/api/oc/[id]/pdf/route.ts, src/components/oc-detail/OCDetailHeader.tsx, src/actions/oc.ts]
tech_stack:
  added: ["@react-pdf/renderer@^4.5.1", "googleapis@^173.0.0"]
  patterns: [react-pdf-pure-component, route-handler-nodejs-runtime, fire-and-forget-void, google-sheets-upsert]
key_files:
  created:
    - src/lib/pdf/OCPDFDocument.tsx
    - src/app/api/oc/[id]/pdf/route.ts
  modified:
    - next.config.ts
    - src/components/oc-detail/OCDetailHeader.tsx
    - src/actions/oc.ts
    - package.json
decisions:
  - "SerializedOC exportada desde src/actions/oc.ts — permite importación por tipo en OCPDFDocument sin circular dependency (types are erased at runtime)"
  - "React.createElement con cast a ReactElement<DocumentProps> — evita error de tipos entre FunctionComponentElement y DocumentProps de react-pdf"
  - "new Uint8Array(buffer) en lugar de Buffer directo — Buffer<ArrayBufferLike> no satisface BodyInit en Next.js 15+ Response API"
  - "syncToSheets usa dynamic import para wizard-calculations — evita incluir decimal.js en el bundle del Server Action sync path principal"
  - "gastosDespachoTyped con fromCentavos — reutiliza helper existente para conversión centavos → string decimal"
metrics:
  duration: 22 min
  completed: 2026-06-02
  tasks_completed: 2
  files_modified: 6
---

# Phase 6 Plan 03: PDF Export + Google Sheets Sync Summary

PDF descargable con branding Driva Dev via `@react-pdf/renderer` (componente puro, Route Handler nodejs, IDOR via `getOCById`) y sincronización automática a Google Sheets con upsert por `referenciaOC` como fire-and-forget en los tres Server Actions mutadores.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | next.config.ts + OCPDFDocument + Route Handler PDF | 01a9c7a | next.config.ts, src/lib/pdf/OCPDFDocument.tsx, src/app/api/oc/[id]/pdf/route.ts, src/actions/oc.ts, package.json, package-lock.json |
| 2 | Botón Exportar PDF en OCDetailHeader + syncToSheets | 7f47d70 | src/components/oc-detail/OCDetailHeader.tsx, src/actions/oc.ts |

## What Was Built

### Task 1
- `next.config.ts`: `serverExternalPackages` actualizado a `['mongoose', '@react-pdf/renderer']`
- `SerializedOC` exportada con `export type` desde `src/actions/oc.ts`
- `src/lib/pdf/OCPDFDocument.tsx`: componente puro sin hooks, sin Context, recibe `SerializedOC` como prop
  - Colores de marca: `#0061a6` (principal), `#004a80` (titulares), `#62b446` (acento/landed cost)
  - Secciones: header con referenciaOC + estado, Info General, Productos con tabla, Gastos de Importación, Value Cards (FOB/Gastos/Landed Cost), Footer
  - Cálculos via `calcFOBTotal`, `calcTotalGastos`, `calcLandedCost` de `wizard-calculations.ts`
- `src/app/api/oc/[id]/pdf/route.ts`: Route Handler GET
  - `export const runtime = 'nodejs'` como primera línea
  - `params` como `Promise<{ id: string }>` (Next.js 15+)
  - IDOR via `getOCById` (importador verifica importadorId; proveedor/despachante verifica email en listas)
  - `renderToBuffer` + `new Uint8Array(buffer)` para `BodyInit` compatible
  - `Content-Disposition: attachment; filename="OC-{referenciaOC}.pdf"`
- Packages instalados: `@react-pdf/renderer`, `googleapis`

### Task 2
- `src/components/oc-detail/OCDetailHeader.tsx`: botón `Exportar PDF` con `<a href="/api/oc/${oc.id}/pdf" download>` y clases `border-acento text-acento`, antes del botón Editar, para todos los roles
- `src/actions/oc.ts`:
  - `import { google } from 'googleapis'` agregado
  - `syncToSheets(ocId)` helper interno (sin `export`): conecta MongoDB, obtiene doc, convierte centavos → decimal, calcula FOB/gastos/landed, upsert en Google Sheets por `referenciaOC` en columna A (8 columnas: Referencia OC, Proveedor, Estado, Fecha OC, País de Origen, FOB USD, Total Gastos USD, Landed Cost USD)
  - `GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')` al inicializar GoogleAuth (mandatorio CLAUDE.md)
  - `void syncToSheets(id)` inyectado en `createOC`, `updateOC`, `updateOCInfo` (fire-and-forget)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Paquetes @react-pdf/renderer y googleapis no instalados**
- **Found during:** Task 1 (pre-ejecución)
- **Issue:** `package.json` no tenía `@react-pdf/renderer` ni `googleapis`
- **Fix:** `npm install @react-pdf/renderer googleapis`
- **Files modified:** package.json, package-lock.json
- **Commit:** 01a9c7a

**2. [Rule 1 - Bug] React.createElement type mismatch con renderToBuffer**
- **Found during:** Task 1 (verificación TypeScript)
- **Issue:** `React.createElement(OCPDFDocument, { oc })` retorna `FunctionComponentElement<OCPDFDocumentProps>` que no es asignable a `ReactElement<DocumentProps>` esperado por `renderToBuffer`
- **Fix:** Cast explícito `as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>`
- **Files modified:** src/app/api/oc/[id]/pdf/route.ts
- **Commit:** 01a9c7a

**3. [Rule 1 - Bug] Buffer<ArrayBufferLike> no satisface BodyInit**
- **Found during:** Task 1 (verificación TypeScript)
- **Issue:** `new Response(buffer, ...)` donde buffer es `Buffer<ArrayBufferLike>` — TypeScript error: Buffer no tiene las propiedades de `URLSearchParams` requeridas por `BodyInit`
- **Fix:** `new Response(new Uint8Array(buffer), ...)` — `Uint8Array` es `BodyInit` válido
- **Files modified:** src/app/api/oc/[id]/pdf/route.ts
- **Commit:** 01a9c7a

**4. [Rule 1 - Bug] syncToSheets usaba variable gastosDespacho con propiedades inválidas**
- **Found during:** Task 2 (revisión de código pre-commit)
- **Issue:** Primera versión de `syncToSheets` tenía variable `gastosDespacho` duplicada con propiedades placeholder inexistentes (`outros`, `outros_invalid`, etc.) que causarían type errors
- **Fix:** Eliminada la variable duplicada; usar directamente `gastosDespachoTyped` con `fromCentavos`
- **Files modified:** src/actions/oc.ts
- **Commit:** 7f47d70

## Threat Model Compliance

| Threat | Status |
|--------|--------|
| T-06-09: Information Disclosure — /api/oc/[id]/pdf IDOR | Mitigado — getOCById tiene IDOR guard completo; el Route Handler delega toda la lógica de acceso |
| T-06-10: Information Disclosure — GOOGLE_PRIVATE_KEY | Mitigado — private_key solo en Server Action con process.env; nunca expuesta al cliente |
| T-06-11: DoS — syncToSheets | Aceptado — fire-and-forget con try/catch; fallo en Sheets no afecta guardado de OC |
| T-06-12: Tampering — syncToSheets upsert | Aceptado — contrato establecido: columna A = referenciaOC |

## Known Stubs

Ninguno. `OCPDFDocument` renderiza datos reales de la OC. `syncToSheets` llama a Google Sheets API real con service account JWT.

## Self-Check: PASSED

- [x] `next.config.ts` contiene `serverExternalPackages: ['mongoose', '@react-pdf/renderer']`
- [x] `src/lib/pdf/OCPDFDocument.tsx` existe y contiene `export function OCPDFDocument`
- [x] `src/lib/pdf/OCPDFDocument.tsx` contiene `import { Document, Page, View, Text, StyleSheet }`
- [x] `src/lib/pdf/OCPDFDocument.tsx` NO contiene `useState` ni `useEffect` ni `useContext`
- [x] `src/lib/pdf/OCPDFDocument.tsx` contiene `calcFOBTotal`, `calcTotalGastos`, `calcLandedCost`
- [x] `src/lib/pdf/OCPDFDocument.tsx` contiene `color: '#0061a6'` y `color: '#004a80'`
- [x] `src/app/api/oc/[id]/pdf/route.ts` primera línea es `export const runtime = 'nodejs'`
- [x] `src/app/api/oc/[id]/pdf/route.ts` contiene `renderToBuffer`
- [x] `src/app/api/oc/[id]/pdf/route.ts` contiene `Content-Disposition`
- [x] `src/app/api/oc/[id]/pdf/route.ts` contiene `await params`
- [x] `src/components/oc-detail/OCDetailHeader.tsx` contiene `Exportar PDF`
- [x] `src/components/oc-detail/OCDetailHeader.tsx` contiene `download` como atributo del `<a>`
- [x] `src/components/oc-detail/OCDetailHeader.tsx` contiene `import { Pencil, Download }`
- [x] `src/actions/oc.ts` contiene `import { google } from 'googleapis'`
- [x] `src/actions/oc.ts` contiene `async function syncToSheets(`
- [x] `src/actions/oc.ts` contiene `.replace(/\\n/g, '\n')` en GOOGLE_PRIVATE_KEY
- [x] `src/actions/oc.ts` contiene 3 ocurrencias de `void syncToSheets`
- [x] `src/actions/oc.ts` contiene `console.error('[syncToSheets] failed:', err)`
- [x] `src/actions/oc.ts` NO contiene `await syncToSheets`
- [x] `npx tsc --noEmit` sin errores
