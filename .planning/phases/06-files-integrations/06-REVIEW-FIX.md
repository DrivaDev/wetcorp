---
phase: 06-files-integrations
fixed_at: 2026-06-02T00:00:00Z
review_path: .planning/phases/06-files-integrations/06-REVIEW.md
iteration: 1
findings_in_scope: 12
fixed: 12
skipped: 0
status: all_fixed
---

# Phase 06: Code Review Fix Report

**Fixed at:** 2026-06-02
**Source review:** .planning/phases/06-files-integrations/06-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 12 (5 Critical + 7 Warning)
- Fixed: 12
- Skipped: 0

TypeScript check after all fixes: `tsc --noEmit` — zero errors.

## Fixed Issues

### CR-01: PDF route has no authentication

**Files modified:** `src/app/api/oc/[id]/pdf/route.ts`
**Commit:** cd086e4
**Applied fix:** Added `import { auth } from '@clerk/nextjs/server'` and an explicit `auth()` check at the top of the GET handler. Returns HTTP 401 for unauthenticated requests, HTTP 403 for `'Sin acceso'` errors, and HTTP 404 for `'OC no encontrada'` errors.

---

### CR-02: Cloudinary signing route has no authentication

**Files modified:** `src/app/api/sign-cloudinary-params/route.ts`
**Commit:** dcda68d
**Applied fix:** Added `import { auth } from '@clerk/nextjs/server'` and a `userId` check before the signing logic. Returns HTTP 401 if no authenticated user.

---

### CR-03: `updateOCDocumento` stores an unvalidated URL string directly into MongoDB

**Files modified:** `src/actions/oc.ts`
**Commit:** 3611047
**Applied fix:** Added a `CLOUDINARY_URL_RE` regex validation (`/^https:\/\/res\.cloudinary\.com\//`) after the slot validation and before auth checks. Returns `{ error: 'URL de documento inválida' }` for any non-Cloudinary URL.

---

### CR-04: `syncToSheets` crashes if `GOOGLE_PRIVATE_KEY` is undefined

**Files modified:** `src/actions/oc.ts`
**Commit:** 4936793
**Applied fix:** Replaced non-null assertions with explicit local variable guards. All three env vars (`GOOGLE_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SHEETS_SPREADSHEET_ID`) are checked together and the function returns early with a `console.warn` if any are missing.

---

### CR-05: `serializeOC` internal type has a typo — `produto` fallback is never reached

**Files modified:** `src/actions/oc.ts`
**Commit:** 9160752
**Applied fix:** Removed the `produto?: string` typo from the `productos` array type annotation in both `serializeOC` (line 73) and `syncToSheets` (line 583). The map already correctly used `p.producto ?? ''` — the type annotation was the only remaining artefact. Both occurrences removed via `replace_all`.

---

### WR-01: `updateOC` does not verify the caller has the `importador` role

**Files modified:** `src/actions/oc.ts`
**Commit:** 591a7f1
**Applied fix:** Replaced `const { userId } = await auth()` with `const { userId, sessionClaims } = await auth()`, added `rol` extraction, and changed the auth guard to `if (!userId || rol !== 'importador') return { error: 'No autorizado' }` — identical to `createOC`.

---

### WR-02: `toCentavos` uses native float arithmetic

**Files modified:** `src/actions/oc.ts`
**Commit:** 09333de
**Applied fix:** Added `import Decimal from 'decimal.js'` (decimal.js was already in `package.json` as `^10.6.0`). Replaced `Math.round(parseFloat(val) * 100)` with `new Decimal(val).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()`.

---

### WR-03: `updateOCDocumento` allows proveedor/despachante to upload to a draft OC

**Files modified:** `src/actions/oc.ts`
**Commit:** faaba2b
**Applied fix:** Added `if (existing.estado === 'borrador') return { error: 'Sin acceso' }` as the first check inside the `else if (rol === 'proveedor' || rol === 'despachante')` branch, before the email membership check.

---

### WR-04: `handleUploadSuccess` silently swallows `updateOCDocumento` errors

**Files modified:** `src/components/wizard/DocumentSlots.tsx`
**Commit:** e34c00b
**Applied fix:** Changed `.then(() => setOpenSlot(null))` to `.then((result) => { if ('error' in result) { console.error(...) } setOpenSlot(null) }).catch((err) => { console.error(...); setOpenSlot(null) })`. `setOpenSlot(null)` is now called in all code paths.

---

### WR-05: All "otro" extra slots share the same `slotKey="otro"` — uploads collide

**Files modified:** `src/components/wizard/DocumentSlots.tsx`
**Commit:** 66d5815
**Applied fix:** Added `'Otro'` to `FIXED_SLOTS` array and `'Otro': 'otro'` to `FIXED_SLOT_KEYS`. Removed the `OtroSlot` interface, `otrosSlots` state, `addOtro`/`removeOtro`/`updateNombre` helpers, the dynamic `otrosSlots.map` render block, and the "Agregar otro documento" button. Removed the `Plus` icon from imports (now unused). The single "Otro" slot is now a static row identical to all other named slots.

---

### WR-06: Unsafe type assertion on Cloudinary upload result

**Files modified:** `src/components/wizard/DocumentSlots.tsx`
**Commit:** afc64af
**Applied fix:** Replaced the direct `(result.info as { secure_url: string }).secure_url` cast with a runtime guard: checks `typeof info !== 'object' || !info || !('secure_url' in info)` and returns early, then extracts `url` and checks `if (!url) return` before calling `onUploadSuccess`.

---

### WR-07: `sendOCNotification` is fired on every `updateOCInfo` call, including borrador saves

**Files modified:** `src/actions/oc.ts`
**Commit:** 148cbaf
**Applied fix:** Expanded the `existing` lean type to include `estado?: string`. Wrapped `void sendOCNotification(id, userId)` in `if (data.info.estado !== 'borrador')` to skip notification calls when saving borrador OCs. `syncToSheets` is still called unconditionally.

---

_Fixed: 2026-06-02_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
