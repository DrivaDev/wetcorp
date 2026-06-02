# Phase 5: Backend Core - Research

**Researched:** 2026-06-02
**Domain:** MongoDB Atlas + Mongoose + Clerk Webhooks + Next.js Server Actions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Numeración de OC**
- D-01: El campo `referenciaOC` del Step 1 ES el identificador visible de la OC — el importador lo define libremente. MongoDB usa `_id` (ObjectId) como clave interna. No hay auto-numeración del sistema.
- D-02: La `referenciaOC` debe ser única por importador. El Server Action `createOC` valida unicidad antes de guardar; si existe, retorna error y Step 1 muestra mensaje inline "Ya existe una OC con esta referencia".

**Flujo wizard → base de datos**
- D-03: Al completar Step 1 ("Continuar a Paso 2"), el Server Action `createOC` guarda la OC como borrador en MongoDB y retorna el `_id`. El router redirige a `/importador/oc/[id]?step=2` con el ID real. Step 2 fetchea la OC de MongoDB por ID — no usa sessionStorage.
- D-04: Al guardar en Step 2 ("Guardar OC"), el Server Action `updateOC` actualiza todos los campos de gastos, impuestos, documentos y el estado. El estado final es el que el importador eligió en Step 1 (sin override automático).
- D-05: Flujo de edición: `EditWizardLoader` fetchea la OC completa de MongoDB por ID (en lugar de leer sessionStorage). Al "Guardar OC", `updateOC` actualiza MongoDB directamente. sessionStorage se elimina del flujo de edición en esta fase.

**Acceso y scoping por rol**
- D-06: Proveedor y despachante se identifican por el email principal de Clerk (`user.emailAddresses[0].emailAddress`). Las queries filtran OCs donde el email está en `emailsProveedor` (para proveedor) o `emailsDespachante` (para despachante).
- D-07: La comparación de email es case-insensitive. Normalizar a lowercase en el Server Action antes de guardar. Usar comparación exacta tras normalización.

**Borradores**
- D-08: Las OCs con `estado: 'borrador'` aparecen en el dashboard del importador con badge "Borrador". Son recuperables. No hay TTL.
- D-09: Las OCs borrador NO son visibles para proveedor/despachante. Solo el importador ve sus propios borradores.

### Claude's Discretion
- Estructura del Mongoose model: embeber arrays de productos/gastos directamente en el documento OC (embed es lo correcto para este caso de uso).
- Manejo de errores en Server Actions: toast de error inline + no redirect (el usuario puede corregir sin perder el formulario).
- Clerk webhook: implementar con `svix` para validar la firma del webhook antes de procesar.
- Stats del dashboard: calcular en el Server Action `getOCs` mediante MongoDB aggregation, no en el cliente.

### Deferred Ideas (OUT OF SCOPE)
- Upload de documentos a Cloudinary → Phase 6
- Emails Resend al asignar proveedor/despachante → Phase 6
- Eliminar Cloudinary asset al borrar OC → Phase 6
- Historial de cambios / audit log → fuera de scope v1
- Clonación de OC → fuera de scope v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-02 | Clerk webhook `user.created` sincroniza usuario y rol a MongoDB | Clerk v7 usa `verifyWebhook` de `@clerk/nextjs/webhooks`; Route Handler en `/api/webhooks/clerk`; env var `CLERK_WEBHOOK_SIGNING_SECRET` |
| OC1-04 | Step 1 guarda OC como `borrador` en MongoDB y redirige a Step 2 con ID real | Server Action `createOC`; `export const runtime = 'nodejs'`; retorna `{ data: { id } }` o `{ error }` |
| OC2-09 | Step 2 actualiza OC en MongoDB; estado cambia de borrador al estado seleccionado | Server Action `updateOC`; `findByIdAndUpdate` con los campos de gastos completos |
| DOC-01 | Stats del dashboard calculadas desde MongoDB scoped por rol | Aggregation pipeline con `$facet` o queries paralelas; importador ve todas sus OCs, proveedor/despachante ven subset |
| DOC-02 | Eliminar OC borra documento de MongoDB; filtros usan queries de MongoDB | Server Action `deleteOC` con `findByIdAndDelete`; `getOCs` con filtros opcionales |
</phase_requirements>

---

## Summary

Phase 5 reemplaza la capa mock de las Phases 1–4 con persistencia real en MongoDB Atlas. Los tres pilares son: (1) el singleton Mongoose ya planeado en CLAUDE.md, (2) Server Actions para CRUD de OCs, y (3) el webhook de Clerk para sincronizar usuarios.

La complejidad principal está en el wiring del wizard: `Step1Form` debe llamar `createOC` y recibir el ObjectId para redirigir a `/importador/oc/[id]?step=2`, y `Step2Form` debe leer la OC de MongoDB por ID en lugar de sessionStorage. `EditWizardLoader` necesita la misma transformación: fetchear de DB en lugar de buscar en `MOCK_OCS_DETALLE`. Los tres dashboards (importador, proveedor, despachante) reemplazan `MOCK_OCS` por llamadas a `getOCs` que scopean las queries según el rol del usuario autenticado.

Un dato clave: Clerk v7 (instalado: `@clerk/nextjs@^7.4.1`) expone `verifyWebhook` directamente en `@clerk/nextjs/webhooks`, eliminando la necesidad de usar `svix` directamente. El CONTEXT.md menciona svix como decisión de Claude's Discretion, pero la documentación oficial de Clerk v7 muestra el patrón más limpio con `verifyWebhook`.

**Primary recommendation:** Implementar en 3 planes secuenciales: (1) modelos Mongoose + webhook Clerk, (2) Server Actions CRUD + wiring dashboards, (3) wiring wizard completo + eliminación de sessionStorage.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Persistencia OC | Database (MongoDB) | API/Server | MongoDB almacena el documento; Mongoose define el schema |
| Autenticación y roles | Frontend Server (Clerk middleware) | API (webhook) | Middleware ya valida JWT; webhook sincroniza a DB |
| Server Actions CRUD | API / Backend | — | `'use server'` en Next.js App Router, ejecutan en Node.js |
| Scoping de queries por rol | API / Backend | — | El Server Action lee el userId/email del JWT de Clerk y filtra |
| Stats del dashboard | API / Backend | — | Aggregation en MongoDB; nunca calcular en cliente con datos completos |
| Wiring del wizard | Browser / Client | Frontend Server | Step1Form (cliente) llama Server Action; page.tsx (servidor) fetchea OC |
| Eliminar sessionStorage | Browser / Client | — | Remover useEffect que lee `oc-step1-draft`; wizard pasa a usar IDs de URL |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mongoose | 9.6.3 | ODM MongoDB — schemas, models, queries | ODM oficial para MongoDB en Node.js; singleton bien definido para Next.js |
| @clerk/nextjs | 7.4.1 (instalado) | Auth + webhook verification | Ya instalado; `verifyWebhook` built-in en v7 |
| svix | 1.95.1 | Validación de firma de webhook (interno de Clerk) | Clerk v7 lo usa internamente — solo necesario si se valida manualmente |

[VERIFIED: npm registry — mongoose@9.6.3, svix@1.95.1]
[VERIFIED: package.json — @clerk/nextjs@^7.4.1 instalado]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (ninguna adicional) | — | — | El stack ya tiene todo lo necesario |

**Nota:** No se requieren dependencias adicionales. Mongoose es la única instalación nueva.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mongoose | Prisma + MongoDB adapter | Prisma tiene mejor TypeScript autocompletado pero es más pesado y menos maduro con MongoDB que con SQL |
| mongoose | mongodb (driver nativo) | Driver nativo requiere más boilerplate; Mongoose agrega validación de schema y ObjectId handling automático |
| verifyWebhook (Clerk built-in) | svix directo | svix directo es válido pero requiere más código; `verifyWebhook` de Clerk v7 es más limpio |

**Installation:**
```bash
npm install mongoose
```

**Version verification:** mongoose@9.6.3 verificado en npm registry el 2026-06-02.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (importador)
        │
        │ handleContinuar()
        ▼
[Step1Form 'use client']
        │
        │ Server Action createOC(step1Data)
        ▼
[actions/oc.ts 'use server']  ←── auth() → importadorId
        │
        │ OC.create({ ...step1Data, importadorId, estado: 'borrador' })
        ▼
[MongoDB Atlas — collection: ocs]
        │
        │ { _id: ObjectId }
        ▼
[Step1Form] → router.push(`/importador/oc/${id}?step=2`)
        │
        ▼
[page.tsx /importador/oc/[id]] → getOCById(id) ──► MongoDB
        │
        ▼
[Step2Form 'use client'] — recibe ocData como prop (sin sessionStorage)
        │
        │ handleGuardar() → Server Action updateOC(id, step2Data)
        ▼
[actions/oc.ts] → OC.findByIdAndUpdate(id, { gastos..., estado })
        │
        ▼
router.push('/importador/dashboard')
        │
        ▼
[dashboard/page.tsx] → getOCs({ rol: 'importador', importadorId })
        │
        ▼
[MongoDB: aggregate stats + find OCs]
        │
        ▼
[OCTable + StatCards] ← datos reales

─────── Clerk Webhook ───────

Clerk → POST /api/webhooks/clerk
        │
        │ verifyWebhook(req) → evt
        │ evt.type === 'user.created'
        ▼
[User.create({ clerkId, email, rol })]
        │
        ▼
MongoDB — collection: users
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── mongodb.ts          # Singleton Mongoose (ya planeado)
│   └── models/
│       ├── OC.ts           # Mongoose model OC (schema completo)
│       └── User.ts         # Mongoose model User (clerkId, email, rol)
├── actions/
│   └── oc.ts               # createOC, updateOC, deleteOC, getOCs, getOCById
└── app/
    └── api/
        └── webhooks/
            └── clerk/
                └── route.ts  # POST handler — verifyWebhook + User.create
```

### Pattern 1: Singleton Mongoose

**What:** Conexión global reutilizable entre invocaciones de Server Actions y hot reloads de Next.js
**When to use:** SIEMPRE antes de cualquier query Mongoose

```typescript
// src/lib/mongodb.ts
// Source: CLAUDE.md (patrón mandatorio del proyecto)
import mongoose from 'mongoose'

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null }
}

export async function connectDB() {
  if (global.mongooseCache.conn) return global.mongooseCache.conn
  if (!global.mongooseCache.promise) {
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      bufferCommands: false,
    })
  }
  global.mongooseCache.conn = await global.mongooseCache.promise
  return global.mongooseCache.conn
}
```

### Pattern 2: Mongoose Schema con subdocumentos embebidos

**What:** OC como documento MongoDB con arrays de productos, gastos, etc. embebidos (no colecciones separadas)
**When to use:** Cuando los subdocumentos siempre se leen junto al documento padre (caso de uso de OC)

```typescript
// src/lib/models/OC.ts
// Source: wizard-types.ts (interfaces existentes del proyecto)
import mongoose, { Schema, Document, Types } from 'mongoose'

// Los valores monetarios ARS se guardan como integers (centavos) — CLAUDE.md
// Los valores USD se guardan como integers (centavos de USD = 0.01 USD)
// tipoCambio se guarda como integer (centavos de ARS/USD)

const ProductRowSchema = new Schema({
  producto: { type: String, required: true },
  descripcion: String,
  cantidad: { type: Number, required: true },
  valorUSD: { type: Number, required: true }, // centavos USD
}, { _id: false })

const OCSchema = new Schema({
  importadorId: { type: String, required: true, index: true },
  referenciaOC: { type: String, required: true },
  estado: {
    type: String,
    enum: ['borrador', 'en_proceso', 'en_transito', 'en_aduana', 'entregada', 'cancelada'],
    required: true,
  },
  proveedor: String,
  emailsProveedor: [String],
  emailsDespachante: [String],
  despacho: String,
  fechaDespacho: String,
  paisOrigen: String,
  fechaOC: String,
  llegadaEstimada: String,
  fechaPago: String,
  tipoCambio: Number,    // centavos (ej: 120000 = 1200.00 ARS/USD)
  divisa: { type: String, enum: ['ARS/USD', 'ARS/EUR'] },
  notas: String,
  productos: [ProductRowSchema],
  gastosDespacho: {
    sim: Number, derechos: Number, tasaEstadistica: Number, otros: Number,
  },
  gastosDespachante: {
    terminal: Number, fleteInternacional: Number, fleteInterno: Number,
    senasa: Number, despachante: Number, gastosOperativos: Number, gastosBancarios: Number,
  },
  gastosAdicionales: {
    depositoFiscal: Number, digitalizacion: Number, estanciaCamion: Number,
  },
  impuestos: {
    iva: Number, ivaAd: Number, iibb: Number, iigg: Number,
  },
  otrosGastos: [{
    descripcion: String, monto: Number, divisa: { type: String, enum: ['ARS', 'USD'] },
  }],
  otrosImpuestos: [{
    descripcion: String, monto: Number, divisa: { type: String, enum: ['ARS', 'USD'] },
  }],
  documentos: {
    facturaProveedor: String,
    facturaDespachante: String,
    conocimientoEmbarque: String,
    certificadoOrigen: String,
    certificadoAnalisis: String,
    otro: String,
  },
}, { timestamps: true })

// Índice compuesto para unicidad de referenciaOC por importador (D-02)
OCSchema.index({ importadorId: 1, referenciaOC: 1 }, { unique: true })

export const OC = mongoose.models.OC ?? mongoose.model('OC', OCSchema)
```

### Pattern 3: Server Action con manejo de errores

**What:** Patrón uniforme de Server Actions — retorna `{ data }` o `{ error: string }`, nunca lanza excepciones al cliente
**When to use:** TODOS los Server Actions del proyecto

```typescript
// src/actions/oc.ts
// Source: CLAUDE.md (patrón mandatorio del proyecto)
'use server'
export const runtime = 'nodejs'  // OBLIGATORIO con Mongoose

import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/mongodb'
import { OC } from '@/lib/models/OC'

export async function createOC(formData: CreateOCInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  await connectDB()

  // Verificar unicidad de referenciaOC (D-02)
  const exists = await OC.findOne({
    importadorId: userId,
    referenciaOC: formData.referenciaOC,
  })
  if (exists) return { error: 'Ya existe una OC con esta referencia' }

  // Normalizar emails a lowercase (D-07)
  const emailsProveedor = formData.emailsProveedor.map(e => e.toLowerCase().trim())
  const emailsDespachante = formData.emailsDespachante.map(e => e.toLowerCase().trim())

  try {
    const oc = await OC.create({
      importadorId: userId,
      ...formData,
      emailsProveedor,
      emailsDespachante,
      estado: 'borrador',
      // Convertir valores string a enteros (centavos)
      tipoCambio: Math.round(parseFloat(formData.tipoCambio) * 100),
    })
    return { data: { id: oc._id.toString() } }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('duplicate key')) {
      return { error: 'Ya existe una OC con esta referencia' }
    }
    return { error: 'Error al guardar la OC' }
  }
}
```

### Pattern 4: Clerk Webhook v7

**What:** Route Handler para recibir eventos de Clerk y sincronizar usuarios a MongoDB
**When to use:** Solo para `user.created` en Phase 5

```typescript
// src/app/api/webhooks/clerk/route.ts
// Source: Clerk docs oficial (verifyWebhook de @clerk/nextjs/webhooks)
// [CITED: https://clerk.com/docs/guides/development/webhooks/syncing]
export const runtime = 'nodejs'

import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    if (evt.type === 'user.created') {
      const { id, email_addresses, public_metadata } = evt.data
      const email = email_addresses[0]?.email_address ?? ''
      const rol = (public_metadata as { role?: string }).role ?? 'importador'

      await connectDB()
      await User.create({
        clerkId: id,
        email: email.toLowerCase(),
        rol,
      })
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
```

**Env var requerida:** `CLERK_WEBHOOK_SIGNING_SECRET` (obtenida del Dashboard de Clerk → Webhooks → Endpoint → Signing Secret).

**Nota sobre svix:** Clerk v7 ya incluye `verifyWebhook` en `@clerk/nextjs/webhooks` que maneja la verificación de firma internamente usando svix. No es necesario instalar `svix` directamente. [VERIFIED: Context7/clerk-docs]

### Pattern 5: getOCs con scoping por rol

**What:** Consulta de OCs filtrada por rol del usuario autenticado
**When to use:** Dashboards de importador, proveedor y despachante

```typescript
// src/actions/oc.ts (continuación)
export async function getOCs() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { error: 'No autorizado' }
  const rol = sessionClaims?.metadata?.role as string

  await connectDB()

  let filter: Record<string, unknown> = {}

  if (rol === 'importador') {
    filter = { importadorId: userId }
  } else if (rol === 'proveedor') {
    // Obtener email del usuario desde Clerk o User model
    const user = await User.findOne({ clerkId: userId })
    if (!user) return { data: { ocs: [], stats: defaultStats() } }
    filter = {
      emailsProveedor: user.email,   // ya normalizado a lowercase
      estado: { $ne: 'borrador' },   // D-09: borradores no visibles
    }
  } else if (rol === 'despachante') {
    const user = await User.findOne({ clerkId: userId })
    if (!user) return { data: { ocs: [], stats: defaultStats() } }
    filter = {
      emailsDespachante: user.email,
      estado: { $ne: 'borrador' },   // D-09
    }
  }

  const [ocs, stats] = await Promise.all([
    OC.find(filter).sort({ createdAt: -1 }).lean(),
    OC.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        totales: { $sum: 1 },
        enTransito: { $sum: { $cond: [{ $eq: ['$estado', 'en_transito'] }, 1, 0] } },
        enAduana: { $sum: { $cond: [{ $eq: ['$estado', 'en_aduana'] }, 1, 0] } },
        entregadas: { $sum: { $cond: [{ $eq: ['$estado', 'entregada'] }, 1, 0] } },
      }},
    ]),
  ])

  return { data: { ocs, stats: stats[0] ?? defaultStats() } }
}
```

### Anti-Patterns to Avoid

- **sessionStorage para datos de wizard entre rutas:** El wizard ahora usa MongoDB + URL params. `sessionStorage.getItem('oc-step1-draft')` debe eliminarse de Step1Form, Step2Form y EditWizardLoader.
- **Importar modelos Mongoose directamente en Client Components:** Los modelos Mongoose solo pueden usarse en Server Actions y Route Handlers (Node.js runtime).
- **`mongoose.model()` sin guard `mongoose.models.X ?? `:** En Next.js con hot reload, redefinir el modelo en cada request lanza "Cannot overwrite model once compiled".
- **Guardar valores calculados (totales) en MongoDB:** Los cálculos se recalculan en cliente/servidor con decimal.js. Solo se persisten los inputs del wizard.
- **float nativo para valores monetarios:** Usar `Math.round(parseFloat(val) * 100)` antes de guardar. Recuperar dividiendo por 100 al leer.
- **`NEXT_PUBLIC_` para secrets de MongoDB o Clerk:** Solo env vars sin prefijo para servidor.
- **Server Actions sin `export const runtime = 'nodejs'`:** Mongoose necesita el runtime de Node.js; sin este export puede fallar en Vercel Edge.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verificación firma webhook | Parser manual de headers `svix-id`, `svix-timestamp`, `svix-signature` | `verifyWebhook` de `@clerk/nextjs/webhooks` | Implementación HMAC-SHA256 correcta con timing-safe comparison; ya incluida en el SDK |
| Singleton de conexión DB | Nueva conexión por request | `global.mongooseCache` (patrón CLAUDE.md) | Evita agotar el pool de conexiones en serverless; reutiliza conexión entre invocaciones |
| Unicidad de referenciaOC | Validación en memoria antes de guardar | `unique: true` en índice compuesto + catch de duplicate key | El índice maneja race conditions; la validación en memoria tiene race condition entre requests concurrentes |
| ObjectId como string | Conversión manual de hex strings | `.toString()` en el `_id` retornado por Mongoose / `Types.ObjectId` | `_id.toString()` retorna el hex string que Next.js puede serializar |

**Key insight:** El caso más crítico es la validación de unicidad. Aunque se hace `findOne` antes de `create` (para dar un mensaje de error amigable antes del duplicate key de MongoDB), el índice único es la defensa real contra race conditions.

---

## Common Pitfalls

### Pitfall 1: `mongoose.models.OC` no existe en primer request

**What goes wrong:** En Next.js App Router, cada archivo de modelo se ejecuta fresco en el primer request. Si el modelo ya fue registrado (por hot reload o por importación en otro módulo), `mongoose.model('OC', schema)` lanza "Cannot overwrite model once compiled".
**Why it happens:** Next.js no preserva el módulo cacheado entre reloads en dev, pero mongoose sí preserva `mongoose.models` en memoria.
**How to avoid:** `export const OC = mongoose.models.OC ?? mongoose.model('OC', OCSchema)`
**Warning signs:** Error "Cannot overwrite `OC` model once compiled" en consola de desarrollo.

### Pitfall 2: Server Action serializa ObjectId sin `.toString()`

**What goes wrong:** Next.js no puede serializar `Types.ObjectId` directamente cuando se pasa entre Server Action y Client Component. El build falla o el runtime tira "Cannot serialize...".
**Why it happens:** ObjectId es una clase Mongoose, no un tipo primitivo.
**How to avoid:** En el Server Action retornar `{ data: { id: oc._id.toString() } }`. Al leer documentos con `.lean()`, los `_id` siguen siendo ObjectId — mapear a string antes de retornar.
**Warning signs:** Error "Only plain objects, and a few built-ins, can be passed to Client Components from Server Components."

### Pitfall 3: `bufferCommands: false` lanza error si connectDB no se llamó antes

**What goes wrong:** Cualquier query Mongoose antes de que `connectDB()` se resuelva lanza "Buffering timed out after 10000ms" o error inmediato con `bufferCommands: false`.
**Why it happens:** El patrón del proyecto (CLAUDE.md) deshabilita buffering para detectar errores de conexión rápido.
**How to avoid:** Siempre `await connectDB()` como primera línea en cada Server Action y Route Handler que use Mongoose.
**Warning signs:** "MongooseError: Operation `ocs.findOne()` buffering timed out after 10000ms".

### Pitfall 4: Middleware de Clerk bloquea `/api/webhooks/clerk`

**What goes wrong:** Clerk middleware protege todas las rutas de `/api/` por defecto. El webhook de Clerk llega sin cookie de sesión y es rechazado con 401.
**Why it happens:** El matcher de middleware del proyecto incluye `/(api|trpc)(.*)`.
**How to avoid:** Agregar la ruta del webhook como pública en el middleware. En `clerkMiddleware`, el webhook se verifica con la firma del payload, no con JWT de sesión — es seguro hacerlo público.
**Warning signs:** Webhook registrado en Clerk Dashboard pero nunca dispara (todos los intentos fallan con 401).

### Pitfall 5: `sessionClaims?.metadata?.role` undefined al leer desde Server Action

**What goes wrong:** `auth()` en un Server Action retorna `sessionClaims` con `metadata` vacío, por lo que `role` es `undefined` aunque el usuario tiene rol en `publicMetadata` de Clerk.
**Why it happens:** Clerk requiere configurar "Customize session token" en el Dashboard para embeber `publicMetadata` en el JWT. Sin esta configuración, `sessionClaims.metadata` existe pero no tiene los campos custom.
**How to avoid:** Verificar en Clerk Dashboard → Sessions → Customize session token que incluya `{ "metadata": "{{user.public_metadata}}" }`. Ya documentado en STATE.md como blocker.
**Warning signs:** `role` es `undefined` en producción pero el onboarding funciona. Las queries retornan 0 OCs para todos los roles.

### Pitfall 6: Dashboard pages son `'use client'` — no pueden llamar Server Actions directamente

**What goes wrong:** Los tres dashboards (importador, proveedor, despachante) son actualmente Client Components con `'use client'`. Server Actions no se pueden importar directamente y llamar en el render de un Client Component de la misma manera que en un Server Component.
**Why it happens:** Los dashboards necesitaban `useState` para los filtros (decisión Phase 2).
**How to avoid:** Dos opciones: (A) convertir la page.tsx a Server Component que fetchee los datos y pase props a un Client Component hijo que maneje los filtros, o (B) usar `useEffect` + `startTransition` para llamar el Server Action desde el Client Component. **Opción A es la correcta** — es el patrón Next.js App Router: Server Component hace el fetch, Client Component maneja la interactividad.

Arquitectura recomendada para dashboard:
```
page.tsx (Server Component async)
  └── DashboardClient.tsx ('use client')
        ├── StatCards (recibe stats como prop)
        ├── FilterBar (useState para filtros locales)
        └── OCTable (filtra en cliente el array recibido)
```

---

## Code Examples

### Conversión string → centavos (wizard → MongoDB)

```typescript
// Source: CLAUDE.md (patrón mandatorio — decimal.js para finanzas)
// Guardar valor string del wizard como integer (centavos) en MongoDB
function toCentavos(val: string | undefined): number {
  if (!val || val.trim() === '') return 0
  return Math.round(parseFloat(val) * 100)
}

// Recuperar: centavos → string para el wizard
function fromCentavos(val: number | undefined): string {
  if (val === undefined || val === 0) return ''
  return (val / 100).toString()
}
```

### getOCById para Step 2 (fetch de MongoDB)

```typescript
// src/actions/oc.ts
export async function getOCById(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  await connectDB()

  const oc = await OC.findById(id).lean()
  if (!oc) return { error: 'OC no encontrada' }

  // Verificar que el importador es el dueño (o que tiene acceso por email)
  if (oc.importadorId !== userId) return { error: 'Sin acceso' }

  return { data: { oc: serializeOC(oc) } }
}
```

### Índice único compuesto (evitar duplicados de referenciaOC)

```typescript
// Source: Context7/automattic/mongoose — índice compuesto
OCSchema.index({ importadorId: 1, referenciaOC: 1 }, { unique: true })
```

### Modelo User (mínimo para Phase 5)

```typescript
// src/lib/models/User.ts
import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true },
  rol: { type: String, enum: ['importador', 'proveedor', 'despachante'], required: true },
}, { timestamps: true })

export const User = mongoose.models.User ?? mongoose.model('User', UserSchema)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| svix directo para verificar webhooks | `verifyWebhook` de `@clerk/nextjs/webhooks` | Clerk v7 | Menos boilerplate; svix sigue siendo la dependencia subyacente pero el SDK lo abstrae |
| `mongoose.connect()` en cada request | Singleton con `global.mongooseCache` | Next.js serverless era | Evita agotamiento del pool de conexiones |

**Deprecated/outdated:**
- `afterSignOutUrl` en `UserButton` de Clerk: removido en v7 — ya manejado con `afterSignOutUrl` en `ClerkProvider` (ya resuelto en Phase 1, documentado en STATE.md).

---

## Key Wiring Changes (Mock → Real)

Esta tabla enumera cada archivo que pasa de datos mock a datos reales:

| Archivo | Cambio requerido |
|---------|-----------------|
| `src/components/wizard/Step1Form.tsx` | `handleContinuar` llama `createOC` en lugar de escribir sessionStorage; redirige a `/importador/oc/[id]?step=2` con ID real |
| `src/components/wizard/Step2Form.tsx` | Eliminar `useEffect` que lee sessionStorage; recibir `ocData` y `ocId` como props desde page.tsx |
| `src/app/(importador)/importador/oc/nueva/page.tsx` | Solo sirve Step 1; Step 2 ahora está en `/importador/oc/[id]?step=2` |
| `src/app/(importador)/importador/oc/[id]/page.tsx` | Reemplazar `MOCK_OCS_DETALLE.find()` por `getOCById(id)` |
| `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` | Reemplazar búsqueda en `MOCK_OCS_DETALLE` por `getOCById(id)` server-side |
| `src/app/(importador)/importador/dashboard/page.tsx` | Convertir a Server Component; llamar `getOCs()`; pasar datos a DashboardClient |
| `src/app/(proveedor)/proveedor/dashboard/page.tsx` | Ídem — usar email de Clerk para scopear query |
| `src/app/(despachante)/despachante/dashboard/page.tsx` | Ídem |
| `src/app/(proveedor)/proveedor/oc/[id]/page.tsx` | Reemplazar mock por `getOCById` |
| `src/app/(despachante)/despachante/oc/[id]/page.tsx` | Ídem |

**Nota sobre la ruta del wizard:** Actualmente `/importador/oc/nueva` maneja Step 1 y Step 2 con `?step=1` y `?step=2`. Con el backend real, Step 2 necesita un ID de OC en la URL. Opciones:
- (A) Mantener `/importador/oc/nueva?step=1` para crear; después de `createOC`, redirigir a `/importador/oc/[id]?step=2` (la ruta `[id]` ya existe).
- (B) Crear una nueva ruta `/importador/oc/[id]` que maneje ambos steps.

**Opción A es más limpia** — Step 1 vive en `/nueva`, Step 2 vive en `/[id]?step=2`. La página `/importador/oc/[id]/page.tsx` ya existe y muestra el detalle; se necesita separar la lógica de step=2 o usar una ruta distinta. **Recomendación:** `page.tsx` de `[id]` detecta `searchParams.step === '2'` para mostrar Step2Form en lugar de OCDetailView.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Mongoose, Server Actions | ✓ | (runtime Next.js) | — |
| MongoDB Atlas | Persistencia OC | requiere env var `MONGODB_URI` | Atlas cloud | — |
| Clerk Dashboard (webhook config) | AUTH-02 | requiere configuración manual | Manual setup | — |
| mongoose (npm) | Modelos OC/User | ✗ (no instalado aún) | 9.6.3 disponible | — |

**Missing dependencies con no fallback:**
- `MONGODB_URI`: debe estar configurada en `.env.local` antes de ejecutar cualquier plan de esta fase. Sin esto, `connectDB()` falla en el primer request.
- Clerk Webhook Signing Secret: requiere crear el endpoint en el Dashboard de Clerk y obtener `CLERK_WEBHOOK_SIGNING_SECRET`.
- Clerk session token customization: requiere configurar en Clerk Dashboard → Sessions → Customize session token para que `sessionClaims.metadata.role` esté disponible (blocker ya documentado en STATE.md).

---

## Validation Architecture

No hay test framework configurado en el proyecto actualmente (no existe `jest.config.*`, `vitest.config.*`, ni directorio `tests/`). Dado que las Phases 1–4 se ejecutaron sin tests automatizados y que esta fase es principalmente wiring (reemplazar mock por real), la validación es funcional:

**Criterios de validación por plan:**

| Req ID | Comportamiento | Tipo | Método |
|--------|---------------|------|--------|
| AUTH-02 | Clerk webhook procesa `user.created` sin error 4xx | Funcional | Ngrok + Clerk Dashboard → test webhook |
| OC1-04 | Step 1 → guardar → redirige a `/importador/oc/[id]?step=2` con ID real en URL | Funcional | Browser manual |
| OC2-09 | Step 2 → guardar → OC aparece en dashboard con estado correcto | Funcional | Browser manual |
| DOC-01 | Stats del dashboard muestran conteos reales desde MongoDB | Funcional | Crear OCs de prueba, verificar stats |
| DOC-02 | Eliminar OC → desaparece del dashboard | Funcional | Browser manual |

**Wave 0 Gaps:** No hay framework de tests que agregar en Wave 0. El proyecto no usa testing automatizado en las fases anteriores.

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Sí | Clerk JWT — ya implementado en middleware |
| V3 Session Management | Sí | Clerk maneja tokens; `auth()` en Server Actions |
| V4 Access Control | Sí | Scoping de queries por `importadorId` / email en Server Actions |
| V5 Input Validation | Sí | Normalizar emails a lowercase; validar que `importadorId` del JWT coincide con OC antes de update/delete |
| V6 Cryptography | Sí (webhook) | `verifyWebhook` de Clerk — HMAC-SHA256 con timing-safe comparison |

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR en updateOC/deleteOC | Spoofing | Verificar que `oc.importadorId === userId` antes de modificar |
| Inyección NoSQL en filtros | Tampering | Mongoose sanitiza inputs en queries tipadas; evitar `$where` con strings |
| Webhook spoofing | Spoofing | `verifyWebhook` con `CLERK_WEBHOOK_SIGNING_SECRET` |
| Exposición de borradores | Information Disclosure | Query filter `estado: { $ne: 'borrador' }` para proveedor/despachante (D-09) |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Los dashboards se convierten a Server Components (page.tsx async) con un Client Component hijo para los filtros | Architecture Patterns (Pitfall 6) | Si los filtros necesitan datos frescos de DB al cambiar, puede requerir router.refresh() o una estrategia diferente |
| A2 | La ruta `/importador/oc/[id]` con `?step=2` es la mejor opción para Step 2 post-createOC | Key Wiring Changes | Si la page.tsx de [id] se vuelve compleja mezclando detalle y wizard, puede justificar una subruta separada |
| A3 | El modelo User se necesita para lookup de email en proveedor/despachante (dado que Clerk SDK server-side puede obtener el email del userId directamente) | getOCs pattern | Clerk server SDK (`clerkClient.users.getUser(userId)`) puede reemplazar el User model para lookup; pero el modelo User es útil para tener datos locales |

---

## Open Questions

1. **¿Convertir dashboards a Server Components o mantenerlos como Client Components?**
   - What we know: Los filtros (proveedor, estado) actualmente usan `useState` en Client Components. Los datos de MongoDB deben fetchearse en el servidor.
   - What's unclear: ¿Qué tan fluida es la UX si los filtros hacen un full page reload vs filtrado en cliente con el array completo pre-cargado?
   - Recommendation: Server Component fetcha todos los datos; Client Component hijo filtra en cliente el array recibido como prop. Mismo patrón que las Phases anteriores pero con datos reales.

2. **¿Obtener email de proveedor/despachante desde Clerk SDK o desde modelo User?**
   - What we know: Clerk server SDK (`clerkClient.users.getUser(userId)`) puede retornar el email del usuario autenticado sin necesitar el modelo User.
   - What's unclear: Si no existe el registro en User (porque el webhook no corrió, ej. usuario preexistente), el fallback con Clerk SDK es más robusto.
   - Recommendation: Usar `clerkClient.users.getUser(userId)` para obtener el email en `getOCs` — más simple y sin dependencia del webhook para datos del usuario autenticado. El modelo User sigue siendo útil para registrar el momento de creación.

---

## Project Constraints (from CLAUDE.md)

- TypeScript strict — sin `any`, sin `as any`
- Server Actions para CRUD; API Routes solo para: Cloudinary signing, PDF download, Clerk webhook
- `export const runtime = 'nodejs'` en routes que usan Mongoose o react-pdf
- Mongoose: singleton global con `maxPoolSize: 5`, `bufferCommands: false`
- `decimal.js` para toda matemática financiera — nunca float nativo
- Valores monetarios en MongoDB como enteros (centavos)
- Sin comentarios explicativos — el código debe ser autoexplicativo
- Clerk role check: `sessionClaims?.metadata?.role` (requiere customizar session token en Clerk Dashboard)
- Cloudinary PDF: `resource_type: 'raw'`, signed upload via API Route (nunca `NEXT_PUBLIC_` para secrets)

---

## Sources

### Primary (HIGH confidence)
- `/automattic/mongoose` (Context7) — subdocuments, aggregation, índices compuestos, singleton pattern
- `/clerk/clerk-docs` (Context7) — `verifyWebhook`, `user.created` webhook event, `auth()` en Server Actions
- `src/lib/wizard-types.ts` (codebase) — interfaces `ProductRow`, `GastosDespacho`, etc. → schema Mongoose
- `src/lib/mock-ocs.ts` (codebase) — `OCDetalle` — referencia completa de campos a persistir
- `CLAUDE.md` (project) — patrones mandatorios: singleton, centavos, runtime nodejs

### Secondary (MEDIUM confidence)
- `src/components/wizard/Step1Form.tsx` (codebase) — flujo handleContinuar actual a reemplazar
- `src/components/wizard/Step2Form.tsx` (codebase) — flujo handleGuardar actual a reemplazar
- `src/app/(importador)/importador/dashboard/page.tsx` (codebase) — patrón dashboard a migrar
- `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` (codebase) — sessionStorage a eliminar

### Tertiary (LOW confidence)
- Ninguna.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — mongoose@9.6.3 y @clerk/nextjs@7.4.1 verificados en npm; `verifyWebhook` verificado en Context7/clerk-docs
- Architecture: HIGH — basada en código existente del proyecto + patrones CLAUDE.md
- Pitfalls: HIGH — todos verificados contra el código actual del proyecto o documentación oficial

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (estable — mongoose y clerk son dependencias maduras)
