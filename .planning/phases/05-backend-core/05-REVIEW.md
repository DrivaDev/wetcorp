---
phase: 05-backend-core
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - src/lib/mongodb.ts
  - src/lib/models/OC.ts
  - src/lib/models/User.ts
  - src/app/api/webhooks/clerk/route.ts
  - next.config.ts
  - src/middleware.ts
  - src/actions/oc.ts
  - src/components/dashboard/DashboardClient.tsx
  - src/app/(importador)/importador/dashboard/page.tsx
  - src/app/(proveedor)/proveedor/dashboard/page.tsx
  - src/app/(despachante)/despachante/dashboard/page.tsx
  - src/lib/mock-ocs.ts
  - src/components/wizard/Step1Form.tsx
  - src/components/wizard/Step2Form.tsx
  - src/components/wizard/WizardPage.tsx
  - src/app/(importador)/importador/oc/[id]/page.tsx
  - src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx
  - src/app/(proveedor)/proveedor/oc/[id]/page.tsx
  - src/app/(proveedor)/proveedor/oc/[id]/editar/EditWizardLoader.tsx
  - src/app/(despachante)/despachante/oc/[id]/page.tsx
  - src/app/(despachante)/despachante/oc/[id]/editar/EditWizardLoader.tsx
findings:
  critical: 5
  warning: 7
  info: 4
  total: 16
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

This phase wires up the full backend core: MongoDB singleton, Mongoose models, Clerk webhook, server actions for OC CRUD, role-based access, and the wizard UI (Step1/Step2). The overall architecture is sound and the IDOR pattern (ownership check before every write) is correctly applied to `updateOC` and `deleteOC`. However, there are five blocker-level issues that must be fixed before shipping: a complete auth bypass in development mode, two places where `proveedor`/`despachante` `EditWizardLoader` components expose the full-edit wizard to read-only roles, monetary value mis-storage (floating-point instead of centavos for some fields), an unhandled rejection path that silently corrupts `connectDB`, and a missing duplicate-handling at the DB level for the User model. Several additional warnings cover data integrity, role confusion, and type safety gaps.

---

## Critical Issues

### CR-01: Full auth bypass via environment variable — middleware

**File:** `src/middleware.ts:11`
**Issue:** When `SKIP_AUTH_DEV=true` is set, the middleware returns `NextResponse.next()` immediately, skipping every authentication and role check. If this variable is ever set in a staging or production environment — or leaked into a Docker image / CI secret — every route becomes publicly accessible with no credentials required. The guard is also reachable in production builds because it only checks `NODE_ENV`, not a stricter build-time flag.
**Fix:**
```typescript
// Remove the bypass entirely, or at minimum make it compile-out at build time:
// Only allow in test environments and never deploy with this flag.
if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH_DEV === 'true') {
  // This line must never exist in a deployed branch.
  // If local dev needs it, gate it behind a separate `DEV_ONLY` build flag
  // that is stripped at `next build` time via defineConstant in next.config.ts.
}
// Safest fix: delete the line entirely and use Clerk's test mode instead.
```

---

### CR-02: `proveedor` and `despachante` EditWizardLoader renders full write wizard — missing role enforcement

**File:** `src/app/(proveedor)/proveedor/oc/[id]/editar/EditWizardLoader.tsx:13`
**File:** `src/app/(despachante)/despachante/oc/[id]/editar/EditWizardLoader.tsx:13`
**Issue:** Both read-only role `EditWizardLoader` components render `<WizardPage initialStep="1" ...>`, which renders `<Step1Form>`. `Step1Form` calls `createOC` on submit and in edit mode calls `updateOC` (indirectly via Step2). The server actions themselves are protected, but the wizard UI presents forms and a "Continuar a Paso 2" button to proveedores and despachantes. A proveedor clicking through will hit the `createOC` action, which will succeed because `createOC` only checks `userId`, not role. This is an authorization logic failure: a proveedor can create OCs under their own `importadorId` (their Clerk userId).
**Fix:**
```typescript
// In both proveedor and despachante EditWizardLoader.tsx:
// These roles are read-only — there should be no /editar route at all.
// Delete the editar routes for proveedor and despachante, or replace with redirect:

export async function EditWizardLoader({ ocId, rol }: Props) {
  redirect(`/${rol}/oc/${ocId}`)
}
```
Additionally, `createOC` must enforce that the caller has the `importador` role:
```typescript
// src/actions/oc.ts — createOC
const { userId, sessionClaims } = await auth()
const rol = (sessionClaims?.metadata as { role?: string })?.role
if (!userId || rol !== 'importador') return { error: 'No autorizado' }
```

---

### CR-03: `tipoCambio` stored as centavos (×100) but displayed values will be off by factor of 100

**File:** `src/actions/oc.ts:201` and `src/actions/oc.ts:103`
**Issue:** `tipoCambio` is stored with `toCentavos(data.info.tipoCambio)` (multiplied by 100), and read back with `fromCentavos(d.tipoCambio)` (divided by 100). The project rule says "valores monetarios en MongoDB como enteros (centavos)". However `tipoCambio` is an exchange rate (e.g. 1200 ARS/USD), not a monetary amount. Storing it as centavos means a rate of 1200 is saved as 120000 and read back as 1200 — which accidentally works. But if the rate contains decimals (e.g. 1187.50), `toCentavos` stores 118750 and `fromCentavos` returns "1187.5" — still correct by coincidence. The real breakage is in **`gastosDespacho.sim`, `derechos`, `tasaEstadistica`, `otros`** whose labels all say `(USD)`. These values are user-entered in USD (e.g. 45.50), stored as centavos (4550), and `fromCentavos` returns "45.5" correctly. However `mock-ocs.ts` shows these fields containing values like `'85000'`, `'320000'` (raw ARS string values, not centavos). When these mock-style values enter `toCentavos`, the result is `8500000` centavos — a 100× error compared to what the UI entered. The root inconsistency is that the wizard-types define all monetary fields as `string` with no unit contract, making it impossible to know at the call site whether the string is already in centavos or in the display unit. This is a latent data-corruption bug whenever mock data or test data is used to seed via the server actions.
**Fix:** Establish an explicit contract: all `string` monetary fields entering server actions represent the human-readable value (not centavos). Document this in `wizard-types.ts` with a type alias and enforce it via a single conversion layer. Remove `toCentavos`/`fromCentavos` from `tipoCambio` — store it as the raw number (already an integer or near-integer for ARS/USD rates).

---

### CR-04: Unhandled rejection corrupts `mongooseCache.promise` on connection failure

**File:** `src/lib/mongodb.ts:18-24`
**Issue:** If `mongoose.connect()` rejects (e.g. transient network error, wrong URI), `global.mongooseCache.promise` remains set to the rejected Promise. On the next call to `connectDB()`, the `if (!global.mongooseCache.promise)` guard is `false`, so the cached rejected Promise is `await`-ed again, and `mongooseCache.conn` is never set. Subsequent requests will continue to hit the cached rejection instead of attempting a new connection. In a serverless context this means the entire instance is permanently broken until cold-start.
**Fix:**
```typescript
export async function connectDB() {
  if (global.mongooseCache.conn) return global.mongooseCache.conn
  if (!global.mongooseCache.promise) {
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      bufferCommands: false,
    })
  }
  try {
    global.mongooseCache.conn = await global.mongooseCache.promise
  } catch (err) {
    global.mongooseCache.promise = null // reset so next call retries
    throw err
  }
  return global.mongooseCache.conn
}
```

---

### CR-05: Clerk webhook creates duplicate users without error — `user.updated` event not handled

**File:** `src/app/api/webhooks/clerk/route.ts:12-23`
**Issue:** The webhook only handles `user.created`. If a user's role is changed in Clerk's dashboard (via `user.updated`), the MongoDB `User` document keeps the old role. This means the MongoDB `User.rol` field will be permanently out of sync with `sessionClaims.metadata.role`. More critically, the `UserSchema` has `clerkId` as `unique`, but `User.create()` on a duplicate `user.created` event (Clerk can retry webhooks) will throw an E11000 which bubbles up uncaught and returns HTTP 400. The response body `'Error verifying webhook'` is misleading; Clerk will retry, potentially creating log spam. The missing `user.updated` handler means role-change is a silent no-op against the DB.
**Fix:**
```typescript
if (evt.type === 'user.created') {
  await connectDB()
  await User.findOneAndUpdate(
    { clerkId: id },
    { clerkId: id, email: email.toLowerCase(), rol },
    { upsert: true, new: true }
  )
}
if (evt.type === 'user.updated') {
  const { id, email_addresses, public_metadata } = evt.data
  const email = email_addresses[0]?.email_address ?? ''
  const rol = (public_metadata as { role?: string }).role
  if (rol) {
    await connectDB()
    await User.findOneAndUpdate({ clerkId: id }, { email: email.toLowerCase(), rol })
  }
}
```

---

## Warnings

### WR-01: `updateOC` does not update Step 1 fields — silent data loss on re-edit

**File:** `src/actions/oc.ts:279-319`
**Issue:** `updateOC` only updates gastos, impuestos, otrosGastos, otrosImpuestos, and estado. When the user edits Step 1 fields (proveedor, emails, fechaOC, tipoCambio, productos, etc.) and clicks "Continuar a Paso 2", Step1Form in edit mode skips `createOC` (line 133: `if (ocId) { router.push(...); return }`) and navigates directly to Step2. The Step 1 changes are then silently discarded — `updateOC` never receives or persists them. This is a data-loss bug from the user's perspective.
**Fix:** Either add a separate `updateOCStep1` server action that persists the Step 1 fields, or extend `updateOC` to accept and persist the full OC payload. The `handleContinuar` in `Step1Form` must call this action before navigating.

---

### WR-02: `MONGODB_URI` crashes the process at module load if unset

**File:** `src/lib/mongodb.ts:10`
**Issue:** `const MONGODB_URI = process.env.MONGODB_URI!` uses a non-null assertion but provides no validation. If the variable is absent (e.g. missing in a new deployment), the crash happens deep inside `mongoose.connect()` with an unhelpful error rather than a clear startup failure. In Next.js App Router this can silently render 500s rather than failing loudly at startup.
**Fix:**
```typescript
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set')
```

---

### WR-03: `proveedor`/`despachante` access check uses only the first email address

**File:** `src/actions/oc.ts:246` and `src/actions/oc.ts:251`
**Issue:** When checking proveedor/despachante access in `getOCById`, the code fetches the Clerk user and uses only `clerkUser.emailAddresses[0]?.emailAddress`. Clerk users can have multiple verified email addresses. If the invited email is not the primary email, the access check will fail and the user will see "Sin acceso" even though they are legitimately authorized.
**Fix:** Check all verified email addresses, not just index 0:
```typescript
const emails = clerkUser.emailAddresses
  .map(e => e.emailAddress?.toLowerCase() ?? '')
  .filter(Boolean)
if (!emails.some(e => oc.emailsProveedor.includes(e))) return { error: 'Sin acceso' }
```
The same fix applies to the `getOCs` filter — it also uses only `emailAddresses[0]`.

---

### WR-04: `Step1Form` edit mode skips server action but UI state changes are never persisted

**File:** `src/components/wizard/Step1Form.tsx:132-137`
**Issue:** When `ocId` is set, `handleContinuar` does `router.push(...)` without calling any server action. This means any changes the user made in Step 1 (proveedor name, emails, dates, productos, tipoCambio) are thrown away. The user sees "Continuar a Paso 2" succeed and then proceeds to save Step 2 — but the Step 1 changes never reach the DB. This duplicates WR-01 at the UI layer and confirms the issue is structural.

---

### WR-05: `GastosDespacho` schema and type are inconsistent — `tasaEstadistica` optional in type but required in DB

**File:** `src/lib/wizard-types.ts:28-33` and `src/lib/models/OC.ts:47-50`
**Issue:** `GastosDespacho` declares `tasaEstadistica` as optional (`tasaEstadistica?: string`), but the Mongoose schema stores it as a required field with `default: 0`. Similarly `GastosDespachante` has `gastosOperativos` and `gastosBancarios` as optional in the TypeScript interface but required in the schema. When the optional fields are `undefined` in the wizard state, `toCentavos(undefined)` returns `0` (safe), but the inconsistency means TypeScript will not catch cases where these fields are accidentally omitted. It also creates confusion about whether these fields exist, since code like `ocData?.gastosDespacho?.tasaEstadistica` needs the optional chaining that wouldn't be needed if the type matched the schema.
**Fix:** Make the types match the schema — remove `?` from `tasaEstadistica`, `gastosOperativos`, and `gastosBancarios`.

---

### WR-06: `valorUSD` in `ProductRowSchema` stored as centavos but field name implies USD

**File:** `src/lib/models/OC.ts:8` and `src/actions/oc.ts:207`
**Issue:** `ProductRowSchema.valorUSD` is typed `Number` and is stored via `toCentavos(p.valorUSD)` — so 45.50 USD is stored as 4550. The field name `valorUSD` strongly implies it holds a USD value, not centavos-of-USD. When `serializeOC` reads it back with `fromCentavos(p.valorUSD)`, it returns "45.5" which is correct. However, if any code ever reads `valorUSD` from the raw Mongoose document without going through `serializeOC`, it will interpret 4550 as $4550 — a 100× error. The mock data in `mock-ocs.ts` uses plain `'45.50'` strings for the same field, deepening the confusion.
**Fix:** Rename the DB field to `valorUSDCentavos` or add a JSDoc comment `// stored in USD-centavos (×100)` to the schema field. Consider a consistent naming convention for all centavo-stored fields.

---

### WR-07: `OCDetailPage` for importador exposes wizard (Step 2) via unauthenticated query param

**File:** `src/app/(importador)/importador/oc/[id]/page.tsx:20-22`
**Issue:** The page renders `<WizardPage initialStep="2">` based solely on `step === '2'` from the URL query params (`searchParams`). There is no check that the request came from a legitimate wizard flow — any user who knows the OC's MongoDB `_id` can navigate directly to `?step=2` and get the Step 2 editing UI. The server action `updateOC` does enforce ownership, so data cannot actually be written by a non-owner, but the UI still loads and shows the gastos/documentos editing form. This is a UI-level information disclosure and a confusing UX for other importadores who guessed the ID.
**Fix:** Remove the `?step=2` query-param shortcut from the detail page. The wizard flow should be accessible exclusively via the `/editar` route, which already calls `getOCById` (with auth) before rendering. Alternatively, verify ownership before showing the wizard UI in the page itself.

---

## Info

### IN-01: Mock data still present and imported in production code

**File:** `src/lib/mock-ocs.ts`
**Issue:** `MOCK_OCS` and `MOCK_OCS_DETALLE` are exported from `mock-ocs.ts` and imported by `DashboardClient.tsx` (for types) and `Step2Form.tsx` (for `OCDetalle` type). While only types are imported in those files, the full 500-line mock array is bundled into the server module. The `mock-ocs.ts` file should be split: move type definitions to `types.ts` and delete or isolate the mock data.

---

### IN-02: `serializeOC` uses `crypto.randomUUID()` for row IDs — unstable across renders

**File:** `src/actions/oc.ts:110` and `src/actions/oc.ts:142`
**Issue:** Each call to `serializeOC` generates new UUIDs for product rows and otrosGastos rows via `crypto.randomUUID()`. This means every time a component fetches and re-renders with a fresh `serializeOC` result, the row IDs change. React keying on these IDs will cause unnecessary unmount/remount cycles, breaking focus and input state in the wizard. The IDs should be derived from stable data (e.g. index or a stored field) rather than generated at serialization time.

---

### IN-03: `middleware.ts` — `NextResponse.next()` returned without explicit auth for public routes

**File:** `src/middleware.ts:18`
**Issue:** When `isAuthenticated` is `false` and `isPublicRoute(req)` is `true`, the code returns `NextResponse.next()`. This is correct for sign-in/sign-up pages. However `/api/webhooks/clerk` is listed as a public route. It is protected by Clerk's `verifyWebhook` signature check in the route handler, so this is acceptable, but it's worth noting that the webhook route is intentionally unauthenticated and this is load-bearing. A code comment here would prevent a future reviewer from "fixing" it.

---

### IN-04: `emptyGastosDespacho` in `mock-ocs.ts` missing `tasaEstadistica` field

**File:** `src/lib/mock-ocs.ts:170`
**Issue:** `emptyGastosDespacho` is `{ sim: '', derechos: '', otros: '' }` — it omits `tasaEstadistica`. This mismatches the `GastosDespacho` type even with the optional marker, and the Mongoose schema always stores it. If any code spreads `emptyGastosDespacho` into a Step2Form state, the `tasaEstadistica` input will be `undefined` (not `''`), causing a controlled/uncontrolled React input warning.

---

_Reviewed: 2026-06-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
