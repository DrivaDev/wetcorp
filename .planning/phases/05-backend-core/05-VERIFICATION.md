---
phase: 05-backend-core
verified: 2026-06-02T12:00:00Z
status: human_needed
score: 7/9 must-haves verified
overrides_applied: 0
deferred:
  - truth: "DOC-01: Upload de PDFs a Cloudinary con servidor-firmado funcional"
    addressed_in: "Phase 6"
    evidence: "ROADMAP Phase 6 success criteria: 'Importador puede subir PDF a cualquiera de los 5 slots — upload via signed endpoint → Cloudinary (resource_type: raw) → URL guardada en MongoDB'"
  - truth: "DOC-02: URL de documento guardada en MongoDB desde flujo de upload real"
    addressed_in: "Phase 6"
    evidence: "ROADMAP Phase 6 requirements: DOC-01, DOC-02, DOC-03 — Phase 5 solo entrega el schema MongoDB (documentos subdocument) que habilita Phase 6"
human_verification:
  - test: "Flujo completo de creación de OC end-to-end"
    expected: "Navegar a /importador/oc/nueva, llenar Step 1, clic 'Continuar a Paso 2' → URL cambia a /importador/oc/[id-real-mongodb]?step=2, llenar gastos en Step 2, clic 'Guardar OC' → redirige al dashboard y la OC aparece en la lista con datos reales"
    why_human: "Requiere MONGODB_URI configurado, autenticación activa con Clerk y conexión real a Atlas. No es verificable con grep estático."
  - test: "Webhook Clerk sincroniza usuario a MongoDB"
    expected: "Crear cuenta nueva en la app → evento user.created llega al webhook → se crea documento en colección 'users' de Atlas con clerkId, email (lowercase) y rol"
    why_human: "Requiere servidor corriendo con CLERK_WEBHOOK_SIGNING_SECRET configurado, endpoint público alcanzable por Clerk, y verificación en Atlas."
  - test: "Stats del dashboard calculadas desde MongoDB real"
    expected: "Con OCs insertadas en Atlas, el dashboard del importador muestra stat cards con valores reales (no 0), y las stats no se ven afectadas al aplicar filtros de búsqueda"
    why_human: "Requiere datos reales en MongoDB para validar que la aggregation retorna valores correctos y que DashboardClient aplica filtros solo en el cliente sin roundtrip."
---

# Phase 5: Backend Core — Verification Report

**Phase Goal:** Todos los datos son reales — MongoDB persiste OCs, Clerk sincroniza roles, Server Actions reemplazan los datos mock
**Verified:** 2026-06-02T12:00:00Z
**Status:** human_needed
**Re-verification:** No — verificación inicial

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Mongoose singleton conectado a MongoDB Atlas (maxPoolSize 5, bufferCommands false) | VERIFIED | `src/lib/mongodb.ts` líneas 19-22: `mongoose.connect(MONGODB_URI, { maxPoolSize: 5, bufferCommands: false })` con `global.mongooseCache` |
| 2 | Modelos OC y User importables sin error 'Cannot overwrite model once compiled' | VERIFIED | `OC.ts` línea 87: `mongoose.models.OC ?? mongoose.model('OC', OCSchema)`. `User.ts` línea 16: `mongoose.models.User ?? mongoose.model('User', UserSchema)` |
| 3 | Webhook POST /api/webhooks/clerk crea User en MongoDB al recibir user.created | VERIFIED | `route.ts` líneas 12-22: verifica `evt.type === 'user.created'`, llama `connectDB()` y `User.create({clerkId, email, rol})` |
| 4 | Middleware no bloquea /api/webhooks/clerk con 401 | VERIFIED | `middleware.ts` línea 4: `createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/clerk'])` — ruta incluida como pública |
| 5 | getOCs retorna OCs reales de MongoDB scoped por rol; proveedor/despachante no ven borradores | VERIFIED | `oc.ts` líneas 337-388: filtro `{ importadorId: userId }` para importador; `{ emailsProveedor: email, estado: { $ne: 'borrador' } }` para proveedor; aggregation `OC.aggregate` para stats |
| 6 | deleteOC borra el documento de MongoDB con IDOR guard | VERIFIED | `oc.ts` líneas 322-334: `existing.importadorId !== userId` guard, luego `OC.findByIdAndDelete(id)` |
| 7 | Step 1 llama createOC y redirige a /importador/oc/[id-real]?step=2 | VERIFIED | `Step1Form.tsx` líneas 126-147: `createOC({ info, productos })`, `router.push('/importador/oc/${result.data.id}?step=2')`. No hay referencias a `sessionStorage`. |
| 8 | Step 2 recibe ocData de MongoDB como prop (no sessionStorage) y llama updateOC | VERIFIED | `Step2Form.tsx` líneas 65-68: props `ocData` y `ocId`. Líneas 157-179: `updateOC(ocId, {...})`. Búsqueda global de `sessionStorage` en `src/`: 0 resultados. |
| 9 | EditWizardLoaders son Server Components async que fetchean OC de MongoDB por ID | VERIFIED | Los 3 `EditWizardLoader.tsx` son async functions sin `'use client'`, usan `getOCById(ocId)`, redirigen al dashboard si error |

**Score:** 9/9 truths verificadas (antes de deferred: 7/9 activas en esta fase)

### Deferred Items

Items no cumplidos en esta fase pero explícitamente cubiertos en fases posteriores del milestone.

| # | Item | Addressed In | Evidence |
|---|------|-------------|---------|
| 1 | DOC-01: Upload firmado a Cloudinary funcional end-to-end | Phase 6 | ROADMAP Phase 6 SC: "upload via signed endpoint → Cloudinary (resource_type: raw) → URL guardada en MongoDB" |
| 2 | DOC-02: URL de documento guardada en MongoDB desde flujo real de upload | Phase 6 | ROADMAP Phase 6 requirements: DOC-01, DOC-02, DOC-03 — Phase 5 provee el schema `documentos` como habilitador |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/mongodb.ts` | Singleton connectDB con global.mongooseCache | VERIFIED | Contiene `global.mongooseCache`, `maxPoolSize: 5`, `bufferCommands: false` |
| `src/lib/models/OC.ts` | Mongoose model OC con schema completo | VERIFIED | Schema completo, índice compuesto único `(importadorId, referenciaOC)`, guard `mongoose.models.OC ??`, incluye `certificadoAnalisis` |
| `src/lib/models/User.ts` | Mongoose model User | VERIFIED | Guard `mongoose.models.User ??`, campos `clerkId`, `email`, `rol` |
| `src/app/api/webhooks/clerk/route.ts` | Route Handler que crea User en MongoDB | VERIFIED | `export const runtime = 'nodejs'`, `verifyWebhook` de `@clerk/nextjs/webhooks`, `User.create` dentro del bloque `user.created` |
| `src/actions/oc.ts` | createOC, updateOC, deleteOC, getOCs, getOCById | VERIFIED | 5 funciones async exportadas, `'use server'`, `runtime = 'nodejs'`, `await connectDB()` en cada función |
| `src/components/dashboard/DashboardClient.tsx` | Client Component con filtros + StatCards + OCTable | VERIFIED | `'use client'`, `useState` para 3 filtros, renderiza StatCard, OCTable, FilterBar con datos reales |
| `src/app/(importador)/importador/dashboard/page.tsx` | Server Component async que llama getOCs | VERIFIED | async function, `getOCs()`, sin `'use client'`, sin `MOCK_OCS` |
| `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` | Server Component async que fetchea OC de MongoDB | VERIFIED | async function, `getOCById(ocId)`, sin `'use client'`, sin `useEffect` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `route.ts` | `src/lib/models/User` | `User.create` | WIRED | Línea 18: `await User.create({...})` en bloque `user.created` |
| `src/middleware.ts` | ruta pública `/api/webhooks/clerk` | `createRouteMatcher` | WIRED | Línea 4: `'/api/webhooks/clerk'` en array de rutas públicas |
| `importador/dashboard/page.tsx` | `src/actions/oc` | `getOCs()` | WIRED | Línea 1 import + línea 5 llamada `await getOCs()` |
| `src/actions/oc.ts` | `src/lib/models/OC` | `OC.find + OC.aggregate` | WIRED | Líneas 363-376: `OC.find(filter).sort(...)` + `OC.aggregate([...])` en `getOCs` |
| `src/actions/oc.ts` | `src/lib/mongodb` | `await connectDB()` | WIRED | Llamada a `connectDB()` en las 5 funciones exportadas |
| `Step1Form.tsx` | `src/actions/oc` | `createOC()` | WIRED | Import línea 11, llamada en `handleContinuar` línea 140 |
| `Step2Form.tsx` | `src/actions/oc` | `updateOC()` | WIRED | Import línea 33, llamada en `handleGuardar` línea 160 |
| `importador/oc/[id]/page.tsx` | `src/actions/oc` | `getOCById(id)` | WIRED | Import + llamada línea 16: `await getOCById(id)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `ImportadorDashboardPage` | `ocs`, `stats` | `getOCs()` → `OC.find()` + `OC.aggregate()` | Si hay datos en Atlas | FLOWING (condicionado a Atlas conectado) |
| `OCDetailPage` (importador) | `oc` | `getOCById(id)` → `OC.findById(id).lean()` | Si la OC existe en Atlas | FLOWING |
| `Step2Form` | `ocData` (prop) | Prop desde Server Component que llamó `getOCById` | Depende del paso anterior | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — requiere MongoDB Atlas conectado con MONGODB_URI en .env.local y servidor corriendo. No verificable estáticamente.

### Requirements Coverage

| Requirement | Source Plan | Descripción | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| AUTH-02 | 05-01 | Rol sincronizado a MongoDB via webhook user.created | SATISFIED | `route.ts`: `User.create({ clerkId: id, email, rol })` en `evt.type === 'user.created'` |
| OC1-04 | 05-03 | Step 1 persiste en MongoDB con estado borrador y redirige con ID real | SATISFIED | `createOC`: `estado: 'borrador'`, retorna `id`; Step1Form: `router.push('/importador/oc/${result.data.id}?step=2')` |
| OC2-09 | 05-02, 05-03 | Al completar Step 2, estado cambia de borrador al seleccionado | SATISFIED | `updateOC`: `estado: data.estado`; Step2Form pasa `step1Data.info.estado` |
| DOC-01 | 05-02 | Upload de PDFs a Cloudinary (servidor-firmado) | DEFERRED to Phase 6 | Schema `documentos` existe en OC model, pero el signed upload endpoint y widget son Phase 6 |
| DOC-02 | 05-02 | URL de documento guardada en MongoDB | DEFERRED to Phase 6 | `documentos` subdocument en schema permite almacenar URLs, pero ningún flujo de upload escribe estas URLs aún |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/wizard/Step2Form.tsx` | 320 | `<DocumentSlots />` sin props de `ocData.documentos` | Info | DocumentSlots renderiza slots estáticos vacíos; no muestra URLs de documentos existentes. Funcional para creación pero incompleto para edición. Previsto para Phase 6 (upload). |

Nota sobre `DocumentSlots`: el componente no recibe ni muestra las URLs de `ocData.documentos`. Es un stub de UI para slots de documentos — intencional para esta fase, ya que la funcionalidad de upload real llega en Phase 6. No es un blocker para el goal de Phase 5.

### Human Verification Required

#### 1. Flujo completo de creación de OC end-to-end

**Test:** Con MONGODB_URI y CLERK_WEBHOOK_SIGNING_SECRET configurados, autenticarse como importador, ir a `/importador/oc/nueva`, llenar Step 1 (referenciaOC único, proveedor, emails, al menos 1 producto), hacer clic en "Continuar a Paso 2"
**Expected:** La URL cambia a `/importador/oc/[id-mongodb-real]?step=2` (ID hexadecimal de MongoDB, no 'nueva'). Step 2 carga con el resumen de Step 1. Llenar algunos gastos y hacer clic en "Guardar OC" → redirige al dashboard → la OC aparece en la lista de OCs con datos reales.
**Why human:** Requiere conexión real a MongoDB Atlas (MONGODB_URI), autenticación activa, y no es verificable con análisis estático.

#### 2. Webhook Clerk sincroniza usuario a MongoDB

**Test:** Con todos los env vars configurados y endpoint público alcanzable, crear una cuenta nueva en la app (sign-up).
**Expected:** El evento `user.created` llega a `/api/webhooks/clerk`, se verifica la firma HMAC, y se crea un documento en la colección `users` de Atlas con `clerkId`, `email` en lowercase, y `rol` correcto.
**Why human:** Requiere Clerk Webhook configurado con endpoint público (ngrok o deploy), CLERK_WEBHOOK_SIGNING_SECRET real, y verificación directa en Atlas.

#### 3. Stats del dashboard calculadas con MongoDB aggregation real

**Test:** Con OCs en Atlas (al menos 1 en estado `en_transito`, 1 en `en_aduana`, 1 en `entregada`), navegar al dashboard del importador.
**Expected:** Las 4 stat cards muestran valores correctos (no todos ceros). Aplicar filtros de búsqueda — los stat cards NO cambian (se calculan desde MongoDB, no desde el filtro del cliente).
**Why human:** Requiere datos reales en Atlas para validar la aggregation pipeline y el comportamiento correcto del DashboardClient (filtros solo afectan la lista, no las stats).

### Gaps Summary

No se encontraron gaps bloqueadores para el goal de la fase. Todos los artefactos centrales están presentes, son sustantivos y están correctamente conectados.

Los ítems DOC-01 y DOC-02 están diferidos a Phase 6 por diseño — Phase 5 entrega la capa de persistencia (schema MongoDB) y Phase 6 entrega el flujo de upload real a Cloudinary.

La única advertencia es que `DocumentSlots` en Step2Form no recibe `ocData.documentos` como prop, lo que significa que en el flujo de edición los documentos previos no se muestran. Esto es esperado para esta fase (Phase 6 lo completa).

El status es `human_needed` porque el flujo end-to-end requiere verificación con MongoDB Atlas y Clerk reales — los 3 criterios de éxito del roadmap no son verificables estáticamente.

---

_Verificado: 2026-06-02T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
