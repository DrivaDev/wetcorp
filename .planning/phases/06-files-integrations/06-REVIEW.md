---
phase: 06-files-integrations
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - next.config.ts
  - src/actions/oc.ts
  - src/app/api/oc/[id]/pdf/route.ts
  - src/app/api/sign-cloudinary-params/route.ts
  - src/components/emails/OCNotificationEmail.tsx
  - src/components/oc-detail/OCDetailHeader.tsx
  - src/components/wizard/DocumentSlots.tsx
  - src/lib/mock-ocs.ts
  - src/lib/models/OC.ts
  - src/lib/pdf/OCPDFDocument.tsx
findings:
  critical: 5
  warning: 7
  info: 3
  total: 15
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-06-02
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This phase adds Cloudinary document upload, Resend email notifications, Google Sheets sync, and PDF export. The core architecture decisions are sound (signed uploads, server-side secrets, nodejs runtime declarations), but there are five blockers: one authorization bypass that lets unauthenticated requests generate and stream any OC's PDF, one missing authentication check in the Cloudinary signing route, one unvalidated URL stored into MongoDB that allows an attacker to store arbitrary strings, one crash path when `GOOGLE_PRIVATE_KEY` is undefined, and a typo in the `serializeOC` internal type that silently drops the `produto` fallback path. Seven warnings cover swallowed errors, missing role-check on `updateOC`, float arithmetic on financial values, unsafe type assertion on Cloudinary upload result, stale mock data referenced in production types, and the "otro" slot collision. Three info items cover dead fields, hardcoded URL in email template, and commented-style artifacts.

---

## Critical Issues

### CR-01: PDF route has no authentication — any request streams any OC as PDF

**File:** `src/app/api/oc/[id]/pdf/route.ts:8-28`
**Issue:** The GET handler calls `getOCById(id)`, which internally calls `auth()`. However, if the user is unauthenticated, `getOCById` returns `{ error: 'No autorizado' }` and the route correctly returns 404. But the 404 body is `'OC no encontrada'` rather than `'No autorizado'`, which leaks the existence of authorization enforcement. More critically: `getOCById` returns `{ error: 'Sin acceso' }` for wrong-role or wrong-owner users, and the route maps *all* errors to HTTP 404 with the generic body `'OC no encontrada'`. An unauthenticated caller or a proveedor/despachante who does not own the OC receives a 404 rather than a 401/403, which is an information leak and makes it impossible for callers to distinguish "not found" from "forbidden". The bigger blocker: this route does **not** set an `Authorization` middleware guard of its own — it entirely depends on `getOCById` rejecting. If `getOCById` is ever refactored to skip auth for internal use, this route becomes fully open. The route should perform its own `auth()` check before delegating.
**Fix:**
```typescript
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('No autorizado', { status: 401 })
  }

  const { id } = await params
  const result = await getOCById(id)
  if ('error' in result) {
    const status = result.error === 'Sin acceso' ? 403 : 404
    return new Response(result.error, { status })
  }
  // ... rest of handler
}
```

---

### CR-02: Cloudinary signing route has no authentication — anyone can obtain valid upload signatures

**File:** `src/app/api/sign-cloudinary-params/route.ts:11-24`
**Issue:** The POST handler generates a Cloudinary signed-upload signature using the private `CLOUDINARY_API_SECRET` without calling `auth()` or verifying the caller is a logged-in user. Any unauthenticated party who can reach this endpoint can request valid Cloudinary upload signatures, upload arbitrary files to the project's Cloudinary account, and exhaust the storage quota. This is a security vulnerability.
**Fix:**
```typescript
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('No autorizado', { status: 401 })
  }
  // existing signing logic...
}
```

---

### CR-03: `updateOCDocumento` stores an unvalidated URL string directly into MongoDB

**File:** `src/actions/oc.ts:455-503`
**Issue:** The `url` parameter received from the client is stored directly into `documentos.${slot}` via `$set` with no validation. A malicious client can call this Server Action with an arbitrary string (e.g. a javascript: URI, a path traversal string, an XSS payload, or a URL to an external host) and it will be persisted in MongoDB and later rendered as an `href` in `DocumentSlots.tsx` and `OCDetailHeader.tsx`. The Cloudinary upload widget does return a `secure_url`, but this action is a Server Action callable by any authorized role — the server must not trust the URL value from the client.
**Fix:**
```typescript
// Validate the URL is a Cloudinary HTTPS URL before persisting
const CLOUDINARY_URL_RE = /^https:\/\/res\.cloudinary\.com\//
if (!CLOUDINARY_URL_RE.test(url)) {
  return { error: 'URL de documento inválida' }
}
```
Add this check immediately after the slot validation and before the authorization checks.

---

### CR-04: `syncToSheets` crashes if `GOOGLE_PRIVATE_KEY` is undefined

**File:** `src/actions/oc.ts:590`
**Issue:** `process.env.GOOGLE_PRIVATE_KEY!.replace(...)` uses the non-null assertion operator. If the env var is missing (e.g. in a staging environment or during local dev without the key), this throws `TypeError: Cannot read properties of undefined (reading 'replace')`. Because `syncToSheets` is called with `void` and catches only inside itself, the unhandled throw inside the try block will be caught by the surrounding catch at line 672 and silently swallowed — but it still means Sheets sync always fails silently without any useful log. The real blocker is if the same pattern is used in a context without the outer try/catch.

More importantly: `process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL` (line 589) has no `!` assertion and is passed as `client_email` without any defined check. If it is `undefined`, the Google Auth client will fail at runtime with a cryptic auth error.

**Fix:**
```typescript
const privateKey = process.env.GOOGLE_PRIVATE_KEY
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

if (!privateKey || !clientEmail || !spreadsheetId) {
  console.warn('[syncToSheets] Missing Google Sheets env vars — skipping sync')
  return
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
```

---

### CR-05: `serializeOC` internal type has a typo — `produto` fallback is never reached

**File:** `src/actions/oc.ts:73`
**Issue:** The internal type annotation for `productos` items declares `produto?: string` (typo — missing 'c') alongside `producto?: string`. The mapping at line 111 correctly reads `p.produto ?? ''` for the fallback, but the Mongoose schema (`OC.ts:4`) stores the field as `producto` (correct spelling), and the `serializeOC` output at line 112 also reads `p.produto ?? ''`. Since no document ever has a `produto` field, the fallback is always `''` rather than `p.producto`. Any OC that has a `producto` field stored in MongoDB will be serialized with an empty string for the product name in the output — a silent data loss bug.

**Fix:**
```typescript
// Line 73: remove the typo
produtos: Array<{ /* remove: produto?: string; */ producto?: string; descripcion: string; cantidad: number; valorUSD: number }>
// Line 112: use the correct field name
produto: p.producto ?? '',  // was: p.produto ?? ''
```
Also verify line 111: `produto: p.produto ?? ''` should be `producto: p.producto ?? ''` — confirming the output key is also misspelled in the `serializeOC` return.

---

## Warnings

### WR-01: `updateOC` does not verify the caller has the `importador` role

**File:** `src/actions/oc.ts:269-332`
**Issue:** `updateOC` checks that `userId` matches `existing.importadorId` (ownership check), but does not verify `sessionClaims?.metadata?.role === 'importador'`. In contrast, `createOC` (line 173) explicitly checks the role. A proveedor or despachante whose Clerk userId happens to match an `importadorId` (theoretically impossible but a defense-in-depth gap) would pass the ownership check. More practically, if a user's role is changed in Clerk without invalidating their session, they retain update access until the session expires.
**Fix:** Add role check consistent with `createOC`:
```typescript
const { userId, sessionClaims } = await auth()
const rol = (sessionClaims?.metadata as { role?: string })?.role
if (!userId || rol !== 'importador') return { error: 'No autorizado' }
```

---

### WR-02: `toCentavos` uses native float arithmetic — violates project financial math rule

**File:** `src/actions/oc.ts:45-48`
**Issue:** `toCentavos` uses `parseFloat(val) * 100` followed by `Math.round()`. The project's CLAUDE.md standard explicitly requires `decimal.js` for all financial math — never native float. For example, `parseFloat('1.005') * 100` yields `100.50000000000001` before rounding, and `parseFloat('1.015') * 100` yields `101.49999999999999` which rounds to 101 instead of 102, causing silent cent-level rounding errors for certain inputs.
**Fix:**
```typescript
import { Decimal } from 'decimal.js'

function toCentavos(val: string | undefined): number {
  if (!val || val.trim() === '') return 0
  return new Decimal(val).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
}
```

---

### WR-03: `updateOCDocumento` allows proveedor/despachante to upload to a draft OC

**File:** `src/actions/oc.ts:482-495`
**Issue:** The authorization check for `rol === 'proveedor' || rol === 'despachante'` only verifies email membership — it does not check `existing.estado !== 'borrador'`. `getOCById` and `getOCs` correctly block draft OC access for these roles, but `updateOCDocumento` does not. A proveedor who knows an OC ID for a draft can upload documents to it.
**Fix:**
```typescript
} else if (rol === 'proveedor' || rol === 'despachante') {
  if (existing.estado === 'borrador') return { error: 'Sin acceso' }
  // existing email check...
}
```

---

### WR-04: `handleUploadSuccess` silently swallows `updateOCDocumento` errors

**File:** `src/components/wizard/DocumentSlots.tsx:158-164`
**Issue:** `updateOCDocumento(ocId, slot, url).then(() => setOpenSlot(null))` has no `.catch()` handler. If the server action returns `{ error: ... }` or throws, the user sees no feedback — the widget closes and the document appears uploaded in the UI, but nothing was saved to MongoDB. This is a data-integrity issue from the user's perspective: they believe the document is saved when it is not.
**Fix:**
```typescript
const handleUploadSuccess = (slot: string, url: string) => {
  if (ocId) {
    updateOCDocumento(ocId, slot, url).then((result) => {
      if ('error' in result) {
        // surface error to user, e.g. via a toast or state flag
        console.error('Error saving document:', result.error)
      }
      setOpenSlot(null)
    }).catch((err) => {
      console.error('Error saving document:', err)
      setOpenSlot(null)
    })
  } else {
    setOpenSlot(null)
  }
}
```

---

### WR-05: All "otro" extra slots share the same `slotKey="otro"` — uploads collide

**File:** `src/components/wizard/DocumentSlots.tsx:215`
**Issue:** When multiple "otro" slots are added via `addOtro`, each rendered `DocumentRow` is given `slotKey="otro"`. This means:
1. `openSlot` state matches all "otro" rows simultaneously — clicking "Adjuntar" on the first "otro" row will trigger the upload widget for every "otro" row that renders (all call `open()` when `openSlot === 'otro'`).
2. Every successful upload calls `onUploadSuccess('otro', url)`, which calls `updateOCDocumento(ocId, 'otro', url)`, overwriting the single `documentos.otro` field with the last upload.
3. `existingUrl={documentos?.otro ?? null}` is the same for all "otro" rows.

The UI allows adding multiple "otro" slots, but the data model only supports one. This is a functional mismatch — multiple slots give the false impression that multiple "other" documents can be stored.
**Fix:** Either restrict the UI to a single "otro" slot (remove the `addOtro` / `otrosSlots` multi-slot behavior and replace with a single static row), or expand the data model to support `otrosDocumentos: string[]` and assign unique slot keys accordingly.

---

### WR-06: Unsafe type assertion on Cloudinary upload result

**File:** `src/components/wizard/DocumentSlots.tsx:109`
**Issue:** `(result.info as { secure_url: string }).secure_url` performs a forced cast with no runtime validation. If `result.info` is a string (which the Cloudinary widget SDK can return in some error states) or undefined, this will either produce `undefined` which is stored as-is, or crash with a runtime TypeError. The `secure_url` then gets passed to `updateOCDocumento` without a presence check.
**Fix:**
```typescript
onSuccess={(result) => {
  const info = result.info
  if (typeof info !== 'object' || !info || !('secure_url' in info)) return
  const url = (info as { secure_url: string }).secure_url
  if (!url) return
  onUploadSuccess(slotKey, url)
}}
```

---

### WR-07: `sendOCNotification` is fired on every `updateOCInfo` call, including no-op saves

**File:** `src/actions/oc.ts:451`
**Issue:** `void sendOCNotification(id, userId)` is called unconditionally at the end of `updateOCInfo`. Every save of Step 1 (e.g. every keystroke trigger if auto-saved, or each time the user clicks Save on an unchanged form) sends notification emails to all proveedor and despachante recipients. While `sendOCNotification` skips borrador OCs, once an OC transitions out of borrador, every edit triggers emails. This can spam recipients and exhaust Resend quota rapidly.
**Fix:** Pass a flag from the caller to indicate whether a meaningful state change occurred, or only call `sendOCNotification` when the `estado` field has changed.

---

## Info

### IN-01: Hardcoded production URL in email template

**File:** `src/components/emails/OCNotificationEmail.tsx:22`
**Issue:** `src="https://sistema-comex.vercel.app/logo-horizontal.svg"` is hardcoded. If the production domain changes, the logo will break in all sent emails. The `NEXT_PUBLIC_APP_URL` env var is already used in `sendOCNotification` for the OC link — the same pattern should be used here.
**Fix:** Pass `baseUrl` as a prop to `OCNotificationEmail` and construct the image src dynamically, or use `process.env.NEXT_PUBLIC_APP_URL` in the server action when constructing the email props.

---

### IN-02: Dead field `numeroDespacho` hardcoded to `''` in `serializeOC`

**File:** `src/actions/oc.ts:95`
**Issue:** `numeroDespacho: ''` is always hardcoded empty in `serializeOC`. The `OC` interface in `mock-ocs.ts` requires this field, but the Mongoose schema (`OC.ts`) has no `numeroDespacho` field. The mock data populates it for display purposes, but the real data path always produces an empty string. This is dead state — either the schema needs the field, or the interface/mock should be updated to reflect reality.
**Fix:** Add `numeroDespacho` to the Mongoose schema (if it is needed), or remove it from the `OC` interface and `SerializedOC` type, and update the mock data accordingly.

---

### IN-03: `mock-ocs.ts` contains production-referenced types but is never used in production paths

**File:** `src/lib/mock-ocs.ts:1-521`
**Issue:** `MOCK_OCS` and `MOCK_OCS_DETALLE` are exported but (presumably) unused in production code paths now that MongoDB is connected. The file exports `EstadoOC` and `OCDetalle` types that are imported across production files (`oc.ts` line 6, `OCDetailHeader.tsx` line 5, `OCPDFDocument.tsx` line 7). This couples production type definitions to a mock data file — a maintenance hazard. If mock data is updated for testing, it can unintentionally drift from real schema.
**Fix:** Extract `EstadoOC`, `OC`, and `OCDetalle` type definitions to a dedicated `src/lib/types/oc.ts` file. Keep mock data in `src/lib/mock-ocs.ts` importing from the types file. This decouples type definitions from mock data.

---

_Reviewed: 2026-06-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
