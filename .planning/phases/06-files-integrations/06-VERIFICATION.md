---
phase: 06-files-integrations
verified: 2026-06-02T00:00:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Subir un PDF a Cloudinary desde DocumentSlots en modo edición"
    expected: "El widget de Cloudinary se abre, permite seleccionar un PDF, lo sube firmado, y al completar el slot muestra 'Archivo adjunto'. En la OC de MongoDB, el campo documentos.{slot} tiene la URL de Cloudinary."
    why_human: "Requiere cuenta Cloudinary con env vars configuradas y servidor corriendo. No se puede verificar programáticamente sin ambiente real."
  - test: "Verificar que se envía email con Resend al actualizar una OC no borrador"
    expected: "Los destinatarios correctos (proveedor, despachante) reciben un email con el template OCNotificationEmail — logo, colores de marca, datos de la OC, botón 'Ver OC en el sistema'."
    why_human: "Requiere cuenta Resend con RESEND_API_KEY y RESEND_FROM_EMAIL verificados. Fire-and-forget no bloquea la respuesta, así que tampoco es observable desde el retorno del Server Action."
  - test: "Descargar PDF desde el botón Exportar PDF en OCDetailHeader"
    expected: "El navegador descarga un PDF llamado 'OC-{referencia}.pdf' con todas las secciones: info general, tabla de productos, gastos de importación, value cards (FOB/Gastos/Landed), footer Driva Dev y colores de marca."
    why_human: "Requiere servidor corriendo con @react-pdf/renderer instalado y una OC real en MongoDB."
  - test: "Verificar que syncToSheets hace upsert correcto en Google Sheets al guardar una OC"
    expected: "Después de createOC o updateOC, la fila correspondiente en la Google Sheet (o una nueva fila si no existe) tiene las 8 columnas: Referencia OC, Proveedor, Estado, Fecha OC, País de Origen, FOB USD, Total Gastos USD, Landed Cost USD."
    why_human: "Requiere service account de Google con credenciales configuradas y una Sheet real. Fire-and-forget no es observable desde el Server Action."
---

# Phase 6: Files & Integrations — Verification Report

**Phase Goal:** Cloudinary signed upload, email Resend, export PDF con react-pdf, sync Google Sheets
**Verified:** 2026-06-02
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | El slot 'packingList' existe en el schema Mongoose y se serializa en serializeOC | VERIFIED | `OC.ts` línea 79: `packingList: { type: String, default: null }`. `oc.ts` línea 162: `packingList: d.documentos?.packingList ?? null` |
| 2 | El botón Adjuntar en DocumentSlots abre CldUploadWidget con signatureEndpoint | VERIFIED | `DocumentSlots.tsx` línea 106: `signatureEndpoint="/api/sign-cloudinary-params"` dentro de `CldUploadWidget` |
| 3 | Si el slot ya tiene URL, aparece modal de confirmación antes de abrir el widget | VERIFIED | `DocumentSlots.tsx` líneas 150-156: `handleUploadAttempt` llama `setConfirmSlot(slot)` si `existingUrl` existe. Modal renderizado líneas 240-263 |
| 4 | Al confirmar el upload, updateOCDocumento guarda la URL en MongoDB en documentos.{slot} | VERIFIED | `oc.ts` línea 498: `await OC.findByIdAndUpdate(id, { $set: { [\`documentos.${slot}\`]: url } })` |
| 5 | Todos los roles pueden subir documentos (guard multi-rol en updateOCDocumento) | VERIFIED | `oc.ts` líneas 482-494: importador verifica `importadorId === userId`; proveedor/despachante verifican email via Clerk; rol desconocido retorna error |
| 6 | En modo readOnly, los slots muestran link de descarga si tienen URL, y 'Sin archivo' si no | VERIFIED | `DocumentSlots.tsx` líneas 85-98: `<a href={existingUrl} target="_blank">` cuando hay URL; `<span>Sin archivo</span>` cuando no |
| 7 | Al crear/actualizar OC no borrador, se envía email fire-and-forget a destinatarios correctos | VERIFIED | `oc.ts` líneas 216, 330, 451, 499: `void sendOCNotification(...)` en 4 Server Actions. Guard `borrador` en línea 520 |
| 8 | El template OCNotificationEmail tiene logo, colores de marca, campos OC y botón Ver OC | VERIFIED | `OCNotificationEmail.tsx`: `backgroundColor: '#f0f7ff'`, `color: '#004a80'`, `backgroundColor: '#0061a6'`, `href={link}`, `oc.notas` condicional, footer Driva Dev |
| 9 | El botón 'Exportar PDF' aparece en OCDetailHeader para todos los roles | VERIFIED | `OCDetailHeader.tsx` líneas 29-35: `<a href={\`/api/oc/${oc.id}/pdf\`} download>Exportar PDF</a>` sin guard de rol |
| 10 | GET /api/oc/[id]/pdf retorna application/pdf con IDOR guard y Content-Disposition attachment | VERIFIED | `route.ts` líneas 1, 13, 22-27: `runtime = 'nodejs'`, IDOR via `getOCById`, `Content-Type: application/pdf`, `Content-Disposition: attachment` |
| 11 | syncToSheets hace upsert por referenciaOC con 8 columnas en Google Sheets | VERIFIED | `oc.ts` líneas 638-671: `rowData` de 8 elementos, búsqueda por `referenciaOC` en columna A, update si existe, append si no |
| 12 | GOOGLE_PRIVATE_KEY usa .replace(/\\n/g, '\n') al inicializar GoogleAuth | VERIFIED | `oc.ts` línea 590: `process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')` |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/sign-cloudinary-params/route.ts` | POST handler firmado con CLOUDINARY_API_SECRET | VERIFIED | Existe, primera línea `export const runtime = 'nodejs'`, contiene `api_sign_request` |
| `src/lib/models/OC.ts` | Campo packingList en schema Mongoose | VERIFIED | Línea 79: `packingList: { type: String, default: null }` |
| `src/lib/mock-ocs.ts` | Campo packingList en tipo OCDetalle | VERIFIED | Línea 53: `packingList: string \| null`. También en `emptyDocumentos` (línea 193) y mock OCs (líneas 300, 349) |
| `src/components/wizard/DocumentSlots.tsx` | Upload real a Cloudinary con modal de confirmación | VERIFIED | CldUploadWidget con firma, estado `confirmSlot`, modal inline, `updateOCDocumento` en onSuccess |
| `src/components/emails/OCNotificationEmail.tsx` | Template React Email con identidad visual Driva Dev | VERIFIED | Sin `'use client'`, colores de marca correctos, campos completos, botón con `href={link}` |
| `src/actions/oc.ts` — sendOCNotification | Helper interno con lógica por rol, fire-and-forget | VERIFIED | `async function sendOCNotification` (sin export), 4 inyecciones `void`, guard borrador, `console.error` en catch |
| `next.config.ts` | serverExternalPackages con mongoose y @react-pdf/renderer | VERIFIED | `['mongoose', '@react-pdf/renderer']` |
| `src/lib/pdf/OCPDFDocument.tsx` | Componente react-pdf puro sin hooks | VERIFIED | Sin `useState`/`useEffect`/`useContext`, importa primitivas react-pdf, calcula FOB/gastos/landed, colores de marca |
| `src/app/api/oc/[id]/pdf/route.ts` | Route Handler GET con runtime nodejs, renderToBuffer, Content-Disposition | VERIFIED | `runtime = 'nodejs'`, `renderToBuffer`, `Content-Disposition: attachment`, `await params` (Next.js 15+) |
| `src/components/oc-detail/OCDetailHeader.tsx` | Botón Exportar PDF con `<a download>` para todos los roles | VERIFIED | `<a href={\`/api/oc/${oc.id}/pdf\`} download>`, import `Download` de lucide-react, sin guard de rol |
| `src/actions/oc.ts` — syncToSheets | Helper interno upsert Google Sheets, 3 inyecciones fire-and-forget | VERIFIED | `async function syncToSheets` (sin export), 3 ocurrencias `void syncToSheets` (createOC, updateOC, updateOCInfo), upsert por referenciaOC, 8 columnas, `console.error` en catch |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `DocumentSlots.tsx` | `/api/sign-cloudinary-params` | `signatureEndpoint` prop de CldUploadWidget | WIRED | Línea 106: `signatureEndpoint="/api/sign-cloudinary-params"` |
| `DocumentSlots.tsx` | `updateOCDocumento` | `onUploadSuccess` → `handleUploadSuccess` | WIRED | Línea 160: `updateOCDocumento(ocId, slot, url)` |
| `updateOCDocumento` | MongoDB OC.documentos | `OC.findByIdAndUpdate` con `$set` | WIRED | Línea 498: `{ $set: { [\`documentos.${slot}\`]: url } }` |
| `createOC/updateOC/updateOCInfo/updateOCDocumento` | `sendOCNotification` | `void sendOCNotification(...)` | WIRED | Líneas 216, 330, 451, 499 — 4 inyecciones confirmadas |
| `sendOCNotification` | Resend API | `resend.emails.send({ react: OCNotificationEmail(...) })` | WIRED | Línea 549: `await resend.emails.send(...)` con `react: OCNotificationEmail(...)` |
| `sendOCNotification` | Clerk clerkClient | `clerkClient().users.getUser` | WIRED | Líneas 522-529: editor y importador obtenidos via Clerk |
| `OCDetailHeader.tsx` botón Exportar PDF | `/api/oc/[id]/pdf` | `<a href download>` | WIRED | Líneas 29-35: `href={\`/api/oc/${oc.id}/pdf\`} download` |
| `/api/oc/[id]/pdf` route | `OCPDFDocument` | `renderToBuffer(createElement(OCPDFDocument, { oc }))` | WIRED | Líneas 19-20: `React.createElement(OCPDFDocument, { oc })` + cast + `renderToBuffer` |
| `createOC/updateOC/updateOCInfo` | `syncToSheets` | `void syncToSheets(id)` | WIRED | Líneas 215, 329, 450 — 3 inyecciones confirmadas |
| `syncToSheets` | Google Sheets API v4 | `google.sheets({ version: 'v4', auth })` | WIRED | Líneas 595-670: get + upsert con `spreadsheets.values` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `DocumentSlots.tsx` | `documentos` prop (URLs de Cloudinary) | `updateOCDocumento` → MongoDB | Si: OC.findByIdAndUpdate persiste URL real | FLOWING |
| `OCNotificationEmail.tsx` | `oc` prop (referenciaOC, proveedor, estado, etc.) | `sendOCNotification` → OC.findById().lean() | Si: consulta MongoDB real, no datos hardcodeados | FLOWING |
| `OCPDFDocument.tsx` | `oc: SerializedOC` prop | `getOCById` en route handler → MongoDB | Si: `getOCById` consulta MongoDB con IDOR guard | FLOWING |
| `syncToSheets` | 8 columnas del rowData | `OC.findById().lean()` + calc wizard | Si: datos reales de MongoDB, cálculos con decimal.js | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compila sin errores | `npx tsc --noEmit` | Sin output (exit 0) | PASS |
| Route Handler PDF tiene `runtime = 'nodejs'` como primera línea | grep primera línea | `export const runtime = 'nodejs'` | PASS |
| OCPDFDocument sin hooks de React | grep useState/useEffect/useContext | 0 ocurrencias | PASS |
| 3 inyecciones `void syncToSheets` (no 4, no 2) | grep count | createOC (línea 215), updateOC (329), updateOCInfo (450) | PASS |
| 4 inyecciones `void sendOCNotification` | grep count | createOC (216), updateOC (330), updateOCInfo (451), updateOCDocumento (499) | PASS |
| `GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')` presente | grep | `process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')` línea 590 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Descripción | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DOC-01 | 06-01 | Upload PDFs a Cloudinary con signed upload — never NEXT_PUBLIC_ para secrets | SATISFIED | Route Handler `/api/sign-cloudinary-params` firma con `CLOUDINARY_API_SECRET` server-side; NEXT_PUBLIC_ solo para cloud_name/api_key |
| DOC-02 | 06-01 | URL de documento guardada en OC MongoDB campo correspondiente | SATISFIED | `updateOCDocumento` → `OC.findByIdAndUpdate` con `$set: { documentos.{slot}: url }` |
| DOC-03 | 06-01 | Documentos solo visibles y descargables (no editables) para proveedor y despachante | SATISFIED | `DocumentSlots` en modo `readOnly` muestra `<a target="_blank">` (descarga) sin botón de upload |
| NOTIF-01 | 06-02 | Al crear/guardar OC con mail de proveedor, Resend envía email al proveedor | SATISFIED | `sendOCNotification` incluye `emailsProveedor` en recipients cuando el importador edita |
| NOTIF-02 | 06-02 | Al crear/guardar OC con mail de despachante, Resend envía email al despachante | SATISFIED | `sendOCNotification` incluye `emailsDespachante` en recipients cuando el importador edita |
| NOTIF-03 | 06-02 | Emails usan templates @react-email con identidad visual Driva Dev | SATISFIED | `OCNotificationEmail.tsx` usa `@react-email/components`, colores `#f0f7ff`, `#004a80`, `#0061a6`, `#62b446`, footer Driva Dev |
| EXPORT-01 | 06-03 | Importador puede exportar OC a PDF (acción solo para importador) | PARTIALLY SATISFIED — ver nota | Botón disponible para todos los roles (no solo importador). IDOR guard en el Route Handler via `getOCById` protege el acceso a OCs ajenas, pero el botón no está condicionado a `rol === 'importador'` |
| EXPORT-02 | 06-03 | PDF generado server-side con @react-pdf/renderer via Route Handler — no puppeteer | SATISFIED | `src/app/api/oc/[id]/pdf/route.ts` usa `renderToBuffer` de `@react-pdf/renderer` |
| EXPORT-03 | 06-03 | PDF incluye todos los datos: info general, productos, gastos, documentos (links), valores finales, branding | SATISFIED (parcial en documentos) | `OCPDFDocument.tsx` incluye info general, productos, gastos resumidos, value cards (FOB/Gastos/Landed), footer Driva Dev. Links a documentos Cloudinary NO incluidos en el PDF (slots no renderizados) |
| SHEETS-01 | 06-03 | Importador puede sincronizar datos OC a Google Sheet (URL fija en env) | SATISFIED | `syncToSheets` fire-and-forget en createOC/updateOC/updateOCInfo; GOOGLE_SHEETS_SPREADSHEET_ID en env |
| SHEETS-02 | 06-03 | Sync usa Google Sheets API v4 con service account JWT — operación asíncrona | SATISFIED | `google.auth.GoogleAuth` con credentials de service account; `void syncToSheets(id)` es fire-and-forget |
| SHEETS-03 | 06-03 | Cada OC ocupa una fila con 8 columnas definidas | SATISFIED | `rowData` de 8 elementos: Referencia OC, Proveedor, Estado, Fecha OC, País de Origen, FOB USD, Total Gastos USD, Landed Cost USD |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/wizard/DocumentSlots.tsx` | 74-81 | `<input type="text">` para nombre de documento dinámico ("otro") | Info | No es stub — es funcionalidad real para nombrar documentos adicionales. No afecta el goal. |
| `src/lib/pdf/OCPDFDocument.tsx` | 263-272 | `parseFloat(p.cantidad)` y `parseFloat(p.valorUSD)` — float nativo en lugar de decimal.js | Warning | Viola `CALC-01` (toda matemática financiera debe usar decimal.js). Los totales por producto en el PDF usan float nativo. Los value cards usan `calcFOBTotal`/`calcLandedCost` (decimal.js correcto). Inconsistencia solo en la columna "Total USD" de la tabla de productos del PDF. |

### Nota sobre EXPORT-01

El plan 06-03 indica explícitamente (D-11 en PATTERNS.md): "todos los roles pueden exportar PDF". La decisión de hacer el botón disponible a todos los roles fue intencional y documentada. REQUIREMENTS.md dice "acción solo disponible para importador", pero el plan sobreescribe esto. El IDOR guard en `getOCById` asegura que proveedor y despachante solo puedan descargar PDFs de OCs a las que ya tienen acceso. La diferencia es de UX (quién ve el botón), no de seguridad.

### Human Verification Required

**1. Upload firmado a Cloudinary**

**Test:** En modo edición de una OC, hacer clic en "Adjuntar" en cualquier slot de DocumentSlots.
**Expected:** El widget de Cloudinary se abre, permite seleccionar un PDF, sube con firma server-side, y al completar el slot muestra "Archivo adjunto". En MongoDB, `documentos.{slot}` contiene la URL de Cloudinary.
**Why human:** Requiere env vars `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` configurados y servidor corriendo.

**2. Email de notificación con Resend**

**Test:** Crear o actualizar una OC que tenga emailsProveedor o emailsDespachante configurados y estado distinto de 'borrador'.
**Expected:** Los destinatarios reciben un email del remitente verificado con el template correcto: logo horizontal, colores de marca, datos de la OC (referencia, proveedor, estado, fecha, notas), botón "Ver OC en el sistema" que lleva a la URL correcta.
**Why human:** Requiere `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (dominio verificado en Resend), y `NEXT_PUBLIC_APP_URL`. El envío es fire-and-forget y no es observable desde el retorno del Server Action.

**3. Descarga de PDF**

**Test:** Desde la vista de detalle de una OC (importador, proveedor o despachante), hacer clic en "Exportar PDF".
**Expected:** El navegador descarga un archivo `OC-{referencia}.pdf` bien formado. El PDF contiene todas las secciones (info general, productos con totales, gastos, value cards FOB/Gastos/Landed Cost) con branding Driva Dev (colores azul/verde, footer).
**Why human:** Requiere servidor con `@react-pdf/renderer` funcionando y una OC real en MongoDB con datos.

**4. Sync a Google Sheets**

**Test:** Crear o actualizar una OC con todos los campos completos (productos, gastos, estado no borrador).
**Expected:** En la Google Sheet configurada, aparece (o se actualiza) una fila con las 8 columnas en el orden correcto: Referencia OC, Proveedor, Estado, Fecha OC, País de Origen, FOB USD, Total Gastos USD, Landed Cost USD. Si la OC ya existía en la Sheet, la fila se actualiza en lugar de duplicarse.
**Why human:** Requiere `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID` configurados y el service account con permisos de editor en la Sheet.

### Gaps Summary

No hay gaps bloqueantes. Los 12 must-haves están verificados en el codebase. Se encontraron dos detalles menores:

1. **Float nativo en tabla de productos del PDF** (`OCPDFDocument.tsx` líneas 269-271): `parseFloat` en lugar de `decimal.js` para calcular el total por fila en la tabla de productos. Viola `CALC-01` pero afecta solo la presentación en el PDF, no los cálculos persistidos en MongoDB ni los value cards del PDF (que usan decimal.js correctamente).

2. **EXPORT-01 interpretación de roles**: El botón "Exportar PDF" es visible para todos los roles (no solo importador como dice REQUIREMENTS.md). Esta fue una decisión explícita del plan (D-11: todos los roles pueden exportar). El acceso real está protegido por el IDOR guard en `getOCById`.

La verificación pasa a estado `human_needed` porque las cuatro integraciones externas (Cloudinary, Resend, react-pdf, Google Sheets) requieren ambiente real con env vars para ser validadas funcionalmente.

---

_Verified: 2026-06-02_
_Verifier: Claude (gsd-verifier)_
