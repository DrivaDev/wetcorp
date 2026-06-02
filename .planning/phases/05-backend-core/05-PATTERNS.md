# Phase 5: Backend Core - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 13 archivos nuevos/modificados
**Analogs found:** 13 / 13

---

## File Classification

| Archivo nuevo/modificado | Rol | Data Flow | Analog más cercano | Calidad |
|--------------------------|-----|-----------|--------------------|---------|
| `src/lib/mongodb.ts` | utility | request-response | `src/app/(auth)/onboarding/_actions.ts` | role-match (mismo patrón 'use server' + Clerk) |
| `src/lib/models/OC.ts` | model | CRUD | `src/lib/wizard-types.ts` + `src/lib/mock-ocs.ts` | schema-match (interfaces → Mongoose schema) |
| `src/lib/models/User.ts` | model | CRUD | `src/lib/models/OC.ts` (hermano) | exact |
| `src/actions/oc.ts` | service | CRUD | `src/app/(auth)/onboarding/_actions.ts` | role-match (Server Action con auth + retorno `{ data } \| { error }`) |
| `src/app/api/webhooks/clerk/route.ts` | middleware | event-driven | `src/middleware.ts` | partial-match (mismo Clerk, distinto mecanismo) |
| `src/app/(importador)/importador/dashboard/page.tsx` | component | request-response | `src/app/(importador)/importador/dashboard/page.tsx` (sí mismo, a refactorizar) | exact (migración Server Component) |
| `src/app/(proveedor)/proveedor/dashboard/page.tsx` | component | request-response | `src/app/(importador)/importador/dashboard/page.tsx` | exact |
| `src/app/(despachante)/despachante/dashboard/page.tsx` | component | request-response | `src/app/(importador)/importador/dashboard/page.tsx` | exact |
| `src/components/wizard/Step1Form.tsx` | component | request-response | `src/components/wizard/Step1Form.tsx` (sí mismo, a modificar) | exact |
| `src/components/wizard/Step2Form.tsx` | component | request-response | `src/components/wizard/Step2Form.tsx` (sí mismo, a modificar) | exact |
| `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` | component | request-response | `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` (sí mismo) | exact |
| `src/app/(importador)/importador/oc/[id]/page.tsx` | component | request-response | `src/app/(proveedor)/proveedor/oc/[id]/page.tsx` | exact |
| `src/app/(proveedor)/proveedor/oc/[id]/page.tsx` | component | request-response | `src/app/(importador)/importador/oc/[id]/page.tsx` | exact |

---

## Pattern Assignments

### `src/lib/mongodb.ts` (utility, singleton)

**Analog:** `src/app/(auth)/onboarding/_actions.ts` — patrón de módulo con imports de Clerk, más el patrón mandatorio de CLAUDE.md.

**Patrón de imports** (análogo líneas 1-3):
```typescript
import mongoose from 'mongoose'
```

**Patrón de singleton global** (CLAUDE.md — patrón mandatorio):
```typescript
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

**Nota crítica:** `bufferCommands: false` es mandatorio (CLAUDE.md). Sin `await connectDB()` al inicio de cada Server Action, cualquier query falla inmediatamente.

---

### `src/lib/models/OC.ts` (model, CRUD)

**Analogs:**
- `src/lib/wizard-types.ts` — interfaces que mapean directamente a subdocumentos
- `src/lib/mock-ocs.ts` — `OCDetalle` define todos los campos que deben persistirse

**Campos a persistir desde `OCDetalle`** (mock-ocs.ts líneas 30-54):
```typescript
// Campos de OCDetalle que deben persistirse en Mongoose schema:
referenciaOC: string
emailsProveedor: string[]
emailsDespachante: string[]
despacho: string
paisOrigen: string
fechaOC: string
llegadaEstimada: string
tipoCambio: string    // → Number en centavos en Mongoose
divisa: 'ARS/USD' | 'ARS/EUR'
notas: string
productos: ProductRow[]
gastosDespacho: GastosDespacho
gastosDespachante: GastosDespachante
gastosAdicionales: GastosAdicionales
impuestos: Impuestos
otrosGastos: OtroGastoRow[]
documentos: { facturaProveedor, facturaDespachante, conocimientoEmbarque, certificadoOrigen, certificadoAnalisis, otro }
```

**Interfaces de subdocumentos** (wizard-types.ts líneas 28-63):
```typescript
export interface GastosDespacho {
  sim: string
  derechos: string
  otros: string
  tasaEstadistica?: string
}

export interface GastosDespachante {
  terminal: string
  fleteInternacional: string
  fleteInterno: string
  senasa: string
  despachante: string
  gastosOperativos?: string
  gastosBancarios?: string
}

export interface GastosAdicionales {
  depositoFiscal: string
  digitalizacion: string
  estanciaCamion: string
}

export interface Impuestos {
  iva: string
  ivaAd: string
  iibb: string
  iigg: string
}

export interface OtroGastoRow {
  id: string
  descripcion: string
  monto: string
  divisa: 'ARS' | 'USD'
}
```

**Patrón anti-overwrite de Mongoose** (mandatorio, RESEARCH.md Pitfall 1):
```typescript
export const OC = mongoose.models.OC ?? mongoose.model('OC', OCSchema)
```

**Índice compuesto para unicidad por importador** (D-02):
```typescript
OCSchema.index({ importadorId: 1, referenciaOC: 1 }, { unique: true })
```

**Conversión centavos** (CLAUDE.md): todos los valores monetarios se guardan como enteros. Al leer del wizard los campos son `string`; convertir con `Math.round(parseFloat(val) * 100)` antes de guardar.

---

### `src/lib/models/User.ts` (model, CRUD)

**Analog:** `src/lib/models/OC.ts` (hermano — mismo patrón Mongoose)

**Patrón de modelo mínimo** (RESEARCH.md Code Examples):
```typescript
import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true },
  rol: { type: String, enum: ['importador', 'proveedor', 'despachante'], required: true },
}, { timestamps: true })

export const User = mongoose.models.User ?? mongoose.model('User', UserSchema)
```

---

### `src/actions/oc.ts` (service, CRUD)

**Analog:** `src/app/(auth)/onboarding/_actions.ts` — único Server Action existente en el proyecto.

**Patrón de Server Action con auth** (onboarding/_actions.ts líneas 1-21):
```typescript
'use server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function completeOnboarding(role: Role): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autenticado' }

  const client = await clerkClient()
  // ...
  return { success: true }
}
```

**Diferencia clave para Phase 5:** agregar `export const runtime = 'nodejs'` al inicio del archivo (CLAUDE.md — obligatorio con Mongoose).

**Patrón de retorno uniforme** (CLAUDE.md):
```typescript
// Éxito:
return { data: { id: oc._id.toString() } }
// Error:
return { error: 'Mensaje legible por el usuario' }
```

**Patrón de normalización de emails** (D-07):
```typescript
const emailsProveedor = formData.emailsProveedor.map(e => e.toLowerCase().trim())
const emailsDespachante = formData.emailsDespachante.map(e => e.toLowerCase().trim())
```

**Patrón de scoping por rol** (RESEARCH.md Pattern 5 — getOCs):
```typescript
const { userId, sessionClaims } = await auth()
const rol = sessionClaims?.metadata?.role as string

if (rol === 'importador') {
  filter = { importadorId: userId }
} else if (rol === 'proveedor') {
  filter = { emailsProveedor: user.email, estado: { $ne: 'borrador' } }
} else if (rol === 'despachante') {
  filter = { emailsDespachante: user.email, estado: { $ne: 'borrador' } }
}
```

**Patrón IDOR guard** (D-05, RESEARCH.md Security):
```typescript
// En updateOC y deleteOC — antes de modificar:
if (oc.importadorId !== userId) return { error: 'Sin acceso' }
```

**Patrón aggregation para stats** (D-09, RESEARCH.md Pattern 5):
```typescript
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
```

**Patrón serialización ObjectId** (RESEARCH.md Pitfall 2): siempre `.lean()` + mapear `_id.toString()` antes de retornar al cliente.

---

### `src/app/api/webhooks/clerk/route.ts` (middleware, event-driven)

**Analog:** `src/middleware.ts` — mismo stack Clerk, pero Route Handler en vez de middleware global.

**Patrón de Route Handler con runtime nodejs** (CLAUDE.md):
```typescript
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
```

**Patrón de verificación de webhook Clerk v7** (RESEARCH.md Pattern 4):
```typescript
import { verifyWebhook } from '@clerk/nextjs/webhooks'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)
    if (evt.type === 'user.created') {
      const { id, email_addresses, public_metadata } = evt.data
      const email = email_addresses[0]?.email_address ?? ''
      const rol = (public_metadata as { role?: string }).role ?? 'importador'
      await connectDB()
      await User.create({ clerkId: id, email: email.toLowerCase(), rol })
    }
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
```

**Pitfall crítico** (RESEARCH.md Pitfall 4): el middleware de Clerk bloquea `/api/webhooks/clerk` con 401 porque el webhook llega sin cookie de sesión. Agregar la ruta como pública en `src/middleware.ts`:
```typescript
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',   // ← agregar esta línea
])
```

**Env var requerida:** `CLERK_WEBHOOK_SIGNING_SECRET`.

---

### Dashboards: `page.tsx` de importador, proveedor y despachante (component, request-response)

**Analog:** Los tres archivos actuales (`src/app/(importador)/importador/dashboard/page.tsx` líneas 1-51, `src/app/(proveedor)/proveedor/dashboard/page.tsx` líneas 1-39, `src/app/(despachante)/despachante/dashboard/page.tsx` líneas 1-39).

**Estructura actual a refactorizar** (importador/dashboard/page.tsx líneas 1-10):
```typescript
'use client'
import { useState } from 'react'
// ...
import { MOCK_OCS } from '@/lib/mock-ocs'

export default function ImportadorDashboardPage() {
  const [searchProveedor, setSearchProveedor] = useState('')
  const todasLasOCs = MOCK_OCS   // ← reemplazar por Server Action
```

**Arquitectura destino** (RESEARCH.md Pitfall 6 — Opción A):
```
page.tsx (async Server Component — sin 'use client')
  └── DashboardClient.tsx ('use client')
        ├── StatCards (recibe stats como prop)
        ├── FilterBar (useState para filtros locales)
        └── OCTable (filtra en cliente el array recibido)
```

**Patrón de page.tsx como Server Component:**
```typescript
// Sin 'use client' — async Server Component
import { getOCs } from '@/actions/oc'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function ImportadorDashboardPage() {
  const result = await getOCs()
  if ('error' in result) { /* manejar error */ }
  const { ocs, stats } = result.data
  return <DashboardClient ocs={ocs} stats={stats} />
}
```

**StatCard acepta props numéricas** (StatCard.tsx — ya preparado):
Los stats deben llegar como `{ totales: number, enTransito: number, enAduana: number, entregadas: number }` — mismo shape que el `stats` calculado manualmente en los dashboards mock actuales (líneas 24-29 del dashboard del importador).

---

### `src/components/wizard/Step1Form.tsx` (component, request-response)

**Analog:** sí mismo (modificación — reemplazar `handleContinuar`).

**Patrón actual a reemplazar** (Step1Form.tsx líneas 94-124 y 157-162):
```typescript
// Leer sessionStorage al montar — ELIMINAR:
useEffect(() => {
  const raw = sessionStorage.getItem('oc-step1-draft')
  // ...
}, [])

// handleContinuar actual — REEMPLAZAR:
const handleContinuar = () => {
  setSubmitted(true)
  if (!isStep1Valid(info, productos)) return
  sessionStorage.setItem('oc-step1-draft', JSON.stringify({ info, productos }))
  router.push('/importador/oc/nueva?step=2')
}
```

**Patrón destino** (D-03 — llamar Server Action y redirigir con ID real):
```typescript
// Import del Server Action (nuevo):
import { createOC } from '@/actions/oc'

// handleContinuar nuevo:
const handleContinuar = async () => {
  setSubmitted(true)
  if (!isStep1Valid(info, productos)) return
  const result = await createOC({ info, productos })
  if ('error' in result) {
    // D-02: mostrar mensaje inline si referenciaOC duplicada
    setServerError(result.error)
    return
  }
  router.push(`/importador/oc/${result.data.id}?step=2`)
}
```

**Patrón de error inline** (D-02 — "Ya existe una OC con esta referencia"):
```typescript
// Estado nuevo:
const [serverError, setServerError] = useState<string | null>(null)

// En JSX junto al campo referenciaOC:
{serverError && <p className="mt-1 text-xs text-red-600">{serverError}</p>}
```

---

### `src/components/wizard/Step2Form.tsx` (component, request-response)

**Analog:** sí mismo (modificación — reemplazar lectura de sessionStorage y `handleGuardar`).

**Patrón actual a reemplazar** (Step2Form.tsx líneas 64-93 y 126-133):
```typescript
// Props actuales — ninguna (lee de sessionStorage):
export function Step2Form() {
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('oc-step1-draft')
    if (!raw) {
      router.replace('/importador/oc/nueva?step=1')
      return
    }
    const data: Step1Data = JSON.parse(raw)
    setStep1Data(data)
  }, [router])

  const handleGuardar = () => {
    // mock — no persiste
    router.push('/importador/dashboard')
  }
```

**Patrón destino** (D-04 — recibir props desde page.tsx + llamar updateOC):
```typescript
// Nuevas props:
interface Step2FormProps {
  ocData: OCDetalle  // datos pre-cargados de MongoDB
  ocId: string
}

export function Step2Form({ ocData, ocId }: Step2FormProps) {
  // Inicializar estado desde ocData (en lugar de sessionStorage)
  const [gastosDespacho, setGastosDespacho] = useState(ocData.gastosDespacho ?? emptyGastos)
  // ...

  const handleGuardar = async () => {
    const result = await updateOC(ocId, { gastosDespacho, gastosDespachante, ... })
    if ('error' in result) {
      setServerError(result.error)
      return
    }
    router.push('/importador/dashboard')
  }
```

---

### `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` (component, request-response)

**Analog:** sí mismo (modificación — reemplazar búsqueda en mock por fetch de MongoDB).

**Patrón actual a reemplazar** (EditWizardLoader.tsx líneas 1-45 — cliente + sessionStorage):
```typescript
'use client'
import { useEffect } from 'react'
// ...
import { MOCK_OCS_DETALLE } from '@/lib/mock-ocs'

export function EditWizardLoader({ ocId, rol }: EditWizardLoaderProps) {
  useEffect(() => {
    const oc = MOCK_OCS_DETALLE.find((o) => o.id === ocId)
    if (!oc) { router.replace(`/${rol}/dashboard`); return }
    // escribe sessionStorage...
    sessionStorage.setItem('oc-step1-draft', JSON.stringify(step1Data))
  }, [ocId, rol, router])
  return <WizardPage initialStep="1" />
}
```

**Patrón destino** (D-05 — Server Component que fetchea de DB):
```typescript
// Convertir en Server Component async:
// Sin 'use client' — sin useEffect — sin sessionStorage
import { getOCById } from '@/actions/oc'
import { notFound, redirect } from 'next/navigation'

interface Props { ocId: string; rol: string }

export async function EditWizardLoader({ ocId, rol }: Props) {
  const result = await getOCById(ocId)
  if ('error' in result) redirect(`/${rol}/dashboard`)
  return <WizardPage initialStep="1" ocData={result.data.oc} ocId={ocId} />
}
```

---

### `src/app/(importador)/importador/oc/[id]/page.tsx` (component, request-response)

**Analog:** sí mismo — ya es Server Component async. Solo reemplazar mock por Server Action.

**Patrón actual** (importador/oc/[id]/page.tsx líneas 1-20):
```typescript
import { notFound } from 'next/navigation'
import { MOCK_OCS_DETALLE } from '@/lib/mock-ocs'   // ← reemplazar

export default async function OCDetailPage({ params }: PageProps) {
  const { id } = await params
  const oc = MOCK_OCS_DETALLE.find((o) => o.id === id)  // ← reemplazar
  if (!oc) notFound()
  return (
    <div className="bg-fondo min-h-screen">
      <OCDetailHeader oc={oc} rol="importador" />
      <OCDetailView oc={oc} />
    </div>
  )
}
```

**Patrón destino:**
```typescript
import { getOCById } from '@/actions/oc'
// Eliminar import de MOCK_OCS_DETALLE

export default async function OCDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getOCById(id)
  if ('error' in result) notFound()
  const oc = result.data.oc
  // ...mismo JSX
}
```

El mismo reemplazo aplica a `src/app/(proveedor)/proveedor/oc/[id]/page.tsx` y `src/app/(despachante)/despachante/oc/[id]/page.tsx`.

---

## Shared Patterns

### Autenticación en Server Actions
**Fuente:** `src/app/(auth)/onboarding/_actions.ts` líneas 1-9
**Aplicar a:** `src/actions/oc.ts` (todas las funciones), `src/app/api/webhooks/clerk/route.ts`
```typescript
'use server'
import { auth } from '@clerk/nextjs/server'

const { userId } = await auth()
if (!userId) return { error: 'No autorizado' }
```

### Runtime nodejs (mandatorio con Mongoose)
**Fuente:** CLAUDE.md — patrón mandatorio
**Aplicar a:** `src/actions/oc.ts`, `src/app/api/webhooks/clerk/route.ts`
```typescript
export const runtime = 'nodejs'
```

### Retorno uniforme de Server Actions
**Fuente:** `src/app/(auth)/onboarding/_actions.ts` (línea 6 — tipo de retorno)
**Aplicar a:** todas las funciones en `src/actions/oc.ts`
```typescript
// Éxito:
return { data: { ... } }
// Error:
return { error: 'Mensaje legible por el usuario' }
```

### Conectar DB antes de cualquier query
**Fuente:** CLAUDE.md + RESEARCH.md Pitfall 3
**Aplicar a:** `src/actions/oc.ts` (todas las funciones), `src/app/api/webhooks/clerk/route.ts`
```typescript
await connectDB()
// Luego cualquier operación Mongoose
```

### Verificación de propiedad antes de update/delete (IDOR guard)
**Fuente:** RESEARCH.md Security Domain
**Aplicar a:** `updateOC`, `deleteOC` en `src/actions/oc.ts`
```typescript
const oc = await OC.findById(id).lean()
if (!oc || oc.importadorId !== userId) return { error: 'Sin acceso' }
```

### Normalización de emails a lowercase
**Fuente:** D-07 — CONTEXT.md
**Aplicar a:** `createOC` y `updateOC` en `src/actions/oc.ts`
```typescript
const emailsProveedor = formData.emailsProveedor.map(e => e.toLowerCase().trim())
const emailsDespachante = formData.emailsDespachante.map(e => e.toLowerCase().trim())
```

### Filtro de borradores para proveedor/despachante
**Fuente:** D-09 — CONTEXT.md
**Aplicar a:** `getOCs` en `src/actions/oc.ts` (filtros de proveedor y despachante)
```typescript
filter = {
  emailsProveedor: user.email,
  estado: { $ne: 'borrador' },
}
```

### Serialización de documentos Mongoose para el cliente
**Fuente:** RESEARCH.md Pitfall 2
**Aplicar a:** todas las funciones de `src/actions/oc.ts` que retornan documentos
```typescript
// Usar .lean() para obtener plain objects
const oc = await OC.findById(id).lean()
// Mapear _id a string antes de retornar
return { data: { oc: { ...oc, _id: oc._id.toString() } } }
```

### Patrón middleware público para webhook
**Fuente:** RESEARCH.md Pitfall 4 — `src/middleware.ts` línea 4
**Aplicar a:** `src/middleware.ts` (modificación puntual)
```typescript
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
])
```

---

## No Analog Found

No hay archivos completamente sin analog. Los únicos archivos verdaderamente nuevos (`src/lib/mongodb.ts`, `src/lib/models/OC.ts`, `src/lib/models/User.ts`, `src/actions/oc.ts`, `src/app/api/webhooks/clerk/route.ts`) tienen patrones concretos definidos en RESEARCH.md que fueron verificados contra la documentación oficial de Mongoose y Clerk v7. Ver sección "Pattern Assignments" para los excerpts de código a copiar.

---

## Metadata

**Scope de búsqueda de analogs:** `src/` completo
**Archivos escaneados:** 48 archivos `.ts` / `.tsx`
**Fecha de extracción:** 2026-06-02
