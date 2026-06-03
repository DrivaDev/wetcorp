---
phase: 06-files-integrations
plan: 01
subsystem: document-upload
tags: [cloudinary, upload, documents, server-action, mongoose]
dependency_graph:
  requires: []
  provides: [cloudinary-signed-upload, document-persistence, packingList-field]
  affects: [src/components/wizard/DocumentSlots.tsx, src/actions/oc.ts, src/lib/models/OC.ts]
tech_stack:
  added: [cloudinary@^2, next-cloudinary@^6]
  patterns: [signed-upload, CldUploadWidget, server-action-multi-rol-guard, VALID_SLOTS-whitelist]
key_files:
  created:
    - src/app/api/sign-cloudinary-params/route.ts
  modified:
    - src/lib/models/OC.ts
    - src/lib/mock-ocs.ts
    - src/actions/oc.ts
    - src/components/wizard/DocumentSlots.tsx
    - .env.example
    - package.json
decisions:
  - "CldUploadWidget renderizado por fila (per-row) en vez de un widget global controlado por useEffect — evita hooks-in-render-prop violation"
  - "openSlot controla cuál widget abre programáticamente via IIFE inline en children prop"
  - "updateOCDocumento usa VALID_SLOTS whitelist de 7 valores — T-06-01 mitigado"
  - "Guard multi-rol: importador verifica importadorId; proveedor/despachante verifica email via Clerk — T-06-02 mitigado"
metrics:
  duration: 18 min
  completed: 2026-06-02
  tasks_completed: 2
  files_modified: 7
---

# Phase 6 Plan 01: Cloudinary Signed Upload + packingList Gap Summary

Cloudinary signed upload con CldUploadWidget, Route Handler de firma server-side, Server Action multi-rol para persistir URLs en MongoDB, y corrección del campo `packingList` faltante en el schema Mongoose.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | packingList schema gap + Route Handler firma + updateOCDocumento | aecf253 | OC.ts, mock-ocs.ts, oc.ts, sign-cloudinary-params/route.ts, .env.example, package.json |
| 2 | DocumentSlots con CldUploadWidget real y modal de confirmación | 1ca0788 | DocumentSlots.tsx |

## What Was Built

### Task 1
- `packingList: { type: String, default: null }` agregado al schema Mongoose (entre `certificadoAnalisis` y `otro`)
- `packingList: string | null` agregado a `OCDetalle` interface y `emptyDocumentos` en mock-ocs.ts
- `packingList: d.documentos?.packingList ?? null` en `serializeOC`
- `updateOCDocumento` Server Action con whitelist `VALID_SLOTS` (7 slots) y guard multi-rol (importador + proveedor + despachante)
- `/api/sign-cloudinary-params` Route Handler: firma `paramsToSign` con `CLOUDINARY_API_SECRET` server-side (nunca expuesto al cliente)
- `.env.example` actualizado con `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_API_KEY` requeridas por next-cloudinary en el cliente
- Packages instalados: `cloudinary`, `next-cloudinary`

### Task 2
- `DocumentSlots` reescrito con `CldUploadWidget` (firma via `/api/sign-cloudinary-params`, `resourceType: 'raw'`, folder `drivaoc-docs`)
- Props extendidas con `ocId` para llamar `updateOCDocumento` en `onSuccess`
- Estado `confirmSlot`: cuando el slot ya tiene URL, muestra modal de confirmación antes de abrir el widget
- Estado `openSlot`: controla qué widget se abre programáticamente (IIFE inline en `children` prop)
- Modo `readOnly`: slots con URL muestran link `<a target="_blank">` con ExternalLink icon; slots sin URL muestran "Sin archivo"
- Eliminado: `useRef`, `<input type="file">` — ya no guarda localmente

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Paquetes cloudinary/next-cloudinary no instalados**
- **Found during:** Task 1 (pre-ejecución)
- **Issue:** `package.json` no tenía `cloudinary` ni `next-cloudinary` — la Route Handler y el componente no podían compilar
- **Fix:** `npm install cloudinary next-cloudinary`
- **Files modified:** package.json, package-lock.json
- **Commit:** aecf253

**2. [Rule 1 - Bug] Botón Remove en DocumentRow usaba icon placeholder incorrecto**
- **Found during:** Task 2 (revisión de código)
- **Issue:** Primer borrador usaba `ExternalLink` con `opacity-0` como espaciador en lugar de icon `X`
- **Fix:** Import de `X` from lucide-react y uso correcto en el botón eliminar
- **Commit:** 1ca0788

**3. [Rule 1 - Pattern] useEffect en children prop de CldUploadWidget viola reglas de hooks**
- **Found during:** Task 2 (análisis del plan)
- **Issue:** El plan sugería `useEffect` dentro del `children` render prop — esto viola las reglas de React hooks
- **Fix:** Pattern alternativo sugerido en el propio plan: renderizar CldUploadWidget por fila, controlado por `openSlot === slotKey` via IIFE inline
- **Commit:** 1ca0788

## Threat Model Compliance

| Threat | Status |
|--------|--------|
| T-06-01: Tampering — slot whitelist | Mitigado — `VALID_SLOTS` array con 7 valores, validación con `.includes()` antes de cualquier DB write |
| T-06-02: Tampering — IDOR multi-rol | Mitigado — importador verifica `importadorId === userId`; proveedor/despachante verifica email via Clerk |
| T-06-03: Info Disclosure — API_SECRET | Mitigado — secret solo en Route Handler server-side; `.env.example` usa `NEXT_PUBLIC_` solo para `cloud_name` y `api_key` |
| T-06-04: Signing endpoint sin auth check | Aceptado — cualquier usuario autenticado puede obtener firma; Cloudinary valida contra folder/preset |

## Known Stubs

Ninguno. `updateOCDocumento` persiste en MongoDB real. `CldUploadWidget` sube a Cloudinary real con firma server-side.

## Self-Check: PASSED

- [x] `src/lib/models/OC.ts` contiene `packingList: { type: String, default: null }`
- [x] `src/lib/mock-ocs.ts` contiene `packingList: string | null` en OCDetalle
- [x] `src/actions/oc.ts` contiene `packingList: d.documentos?.packingList ?? null`
- [x] `src/actions/oc.ts` contiene `export async function updateOCDocumento`
- [x] `src/app/api/sign-cloudinary-params/route.ts` existe con `export const runtime = 'nodejs'` como primera línea
- [x] `src/app/api/sign-cloudinary-params/route.ts` contiene `api_sign_request`
- [x] `.env.example` contiene `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=`
- [x] `src/components/wizard/DocumentSlots.tsx` contiene `CldUploadWidget`, `updateOCDocumento`, `signatureEndpoint`, `resourceType: 'raw'`, `confirmSlot`, `ocId`
- [x] `src/components/wizard/DocumentSlots.tsx` NO contiene `useRef` ni `input type="file"`
- [x] `npx tsc --noEmit` sin errores
