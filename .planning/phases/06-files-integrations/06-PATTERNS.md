# Phase 6: Files & Integrations - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 10 (5 nuevos + 5 modificados)
**Analogs found:** 10 / 10

---

## File Classification

| Archivo Nuevo/Modificado | Rol | Data Flow | Analog más cercano | Calidad |
|--------------------------|-----|-----------|-------------------|---------|
| `src/app/api/sign-cloudinary-params/route.ts` | route (API handler) | request-response | `src/app/api/webhooks/clerk/route.ts` | role-match |
| `src/app/api/oc/[id]/pdf/route.ts` | route (API handler) | request-response | `src/app/api/webhooks/clerk/route.ts` | role-match |
| `src/actions/oc.ts` (modificar — agregar helpers) | service | CRUD + event-driven | `src/actions/oc.ts` sí mismo | exact |
| `src/components/wizard/DocumentSlots.tsx` (modificar) | component | file-I/O | `src/components/dashboard/DeleteModal.tsx` (modal) + sí mismo | role-match |
| `src/components/oc-detail/OCDetailHeader.tsx` (modificar) | component | request-response | `src/components/oc-detail/OCDetailHeader.tsx` sí mismo | exact |
| `src/components/emails/OCNotificationEmail.tsx` | component (email template) | event-driven | `src/components/dashboard/DeleteModal.tsx` (estructura JSX) | partial |
| `src/lib/pdf/OCPDFDocument.tsx` | utility (PDF template) | transform | `src/lib/wizard-calculations.ts` (datos de entrada) | partial |
| `src/lib/models/OC.ts` (modificar — agregar `packingList`) | model | CRUD | `src/lib/models/OC.ts` sí mismo | exact |
| `src/lib/mock-ocs.ts` (modificar — agregar `packingList` en tipo) | model/types | — | `src/lib/mock-ocs.ts` sí mismo | exact |
| `next.config.ts` (modificar — agregar `@react-pdf/renderer`) | config | — | `next.config.ts` sí mismo | exact |

---

## Pattern Assignments

### `src/app/api/sign-cloudinary-params/route.ts` (route, request-response)

**Analog:** `src/app/api/webhooks/clerk/route.ts`

**Imports pattern** (clerk/route.ts líneas 1-6):
```typescript
export const runtime = 'nodejs'

import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
```
Copiar la declaración `export const runtime = 'nodejs'` en la primera línea. Para sign-cloudinary NO se necesita `NextRequest` — usar `Request` nativo de Web API (más simple).

**Core pattern** (clerk/route.ts líneas 8-42) — estructura POST handler:
```typescript
export async function POST(req: NextRequest) {
  try {
    // ... lógica del handler
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
```
El nuevo route de firma usa el mismo esqueleto `POST` + try/catch + `return new Response(...)`. Diferencia: retornar `Response.json({ signature })` en lugar de `new Response('OK')`.

**Patrón completo para la nueva ruta:**
```typescript
export const runtime = 'nodejs'

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paramsToSign } = body as { paramsToSign: Record<string, string> }
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )
    return Response.json({ signature })
  } catch (err) {
    console.error('[sign-cloudinary-params]', err)
    return new Response('Error', { status: 500 })
  }
}
```

---

### `src/app/api/oc/[id]/pdf/route.ts` (route, request-response)

**Analog:** `src/app/api/webhooks/clerk/route.ts` + `src/actions/oc.ts` (para auth/acceso)

**Runtime + imports pattern** (clerk/route.ts línea 1):
```typescript
export const runtime = 'nodejs'
```
Mandatorio — igual que el clerk webhook. Sin esto, `@react-pdf/renderer` falla en App Router.

**Auth + IDOR guard pattern** (oc.ts líneas 224-261) — reusar la lógica de `getOCById`:
```typescript
export async function getOCById(
  id: string
): Promise<{ data: { oc: SerializedOC } } | { error: string }> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { error: 'No autorizado' }
  const rol = (sessionClaims?.metadata as { role?: string })?.role
  // ...
  if (rol === 'importador') {
    if (oc.importadorId !== userId) return { error: 'Sin acceso' }
  } else if (rol === 'proveedor') {
    // ... verificar email en emailsProveedor
  } else if (rol === 'despachante') {
    // ... verificar email en emailsDespachante
  }
}
```
El Route Handler llama `getOCById(params.id)` directamente — reutiliza toda la lógica de acceso sin duplicarla.

**Core pattern del handler:**
```typescript
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getOCById(id)
  if ('error' in result) return new Response('Not found', { status: 404 })

  const buffer = await renderToBuffer(<OCPDFDocument oc={result.data.oc} />)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="OC-${result.data.oc.referenciaOC}.pdf"`,
    },
  })
}
```
Nota: En Next.js App Router (versión 16+), `params` es una `Promise` — hacer `await params` antes de desestructurar.

---

### `src/actions/oc.ts` — agregar `updateOCDocumento`, `sendOCNotification`, `syncToSheets`

**Analog:** El mismo archivo. Copiar estructura de `updateOC` y `updateOCInfo`.

**Imports pattern** (oc.ts líneas 1-15):
```typescript
'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/mongodb'
import { OC } from '@/lib/models/OC'
import type { EstadoOC, OCDetalle } from '@/lib/mock-ocs'
import type { ... } from '@/lib/wizard-types'
```
Agregar al bloque de imports existente: `import { Resend } from 'resend'`, `import { google } from 'googleapis'`, `import { OCNotificationEmail } from '@/components/emails/OCNotificationEmail'`, `import { calcFOBTotal, calcTotalGastos, calcLandedCost } from '@/lib/wizard-calculations'`.

**Auth + IDOR guard pattern** (oc.ts líneas 275-282) — copiar exacto para `updateOCDocumento`:
```typescript
const { userId } = await auth()
if (!userId) return { error: 'No autorizado' }

await connectDB()

const existing = await OC.findById(id).lean() as { importadorId?: string } | null
if (!existing || existing.importadorId !== userId) return { error: 'Sin acceso' }
```
Para `updateOCDocumento`, el guard debe ser más permisivo: importador O un email en emailsProveedor/emailsDespachante del usuario Clerk (todos los roles pueden subir — D-03).

**Mutación pattern** (oc.ts líneas 283-323) — `findByIdAndUpdate` + retorno `{ data: { id } }`:
```typescript
await OC.findByIdAndUpdate(id, {
  // ... campos
})

return { data: { id } }
```
`updateOCDocumento` usa `$set` con computed key:
```typescript
await OC.findByIdAndUpdate(id, { $set: { [`documentos.${slot}`]: url } })
return { data: { id } }
```

**Error handling pattern** (oc.ts líneas 187-220) — try/catch con mensajes de error específicos:
```typescript
try {
  // ... lógica
  return { data: { id: oc._id.toString() } }
} catch (err: unknown) {
  if (err instanceof Error && ...) {
    return { error: 'Mensaje específico' }
  }
  return { error: 'Error al guardar la OC' }
}
```

**Fire-and-forget pattern** — derivado de RESEARCH.md (no existe aún en el codebase):
```typescript
// Al final de updateOC / updateOCInfo / updateOCDocumento, antes del return:
void sendOCNotification(id, userId)
void syncToSheets(id)
return { data: { id } }
```

**Helper interno fire-and-forget con error silencioso:**
```typescript
async function sendOCNotification(ocId: string, editorUserId: string): Promise<void> {
  try {
    // ... lógica
  } catch (err) {
    console.error('[sendOCNotification] failed:', err)
  }
}
```
Este patrón (try/catch interno con `console.error`) aplica tanto a `sendOCNotification` como a `syncToSheets`.

**Obtener email de Clerk** (oc.ts líneas 245-250) — patrón ya existente:
```typescript
const clerkUser = await (await clerkClient()).users.getUser(userId)
const emails = clerkUser.emailAddresses
  .map(e => e.emailAddress?.toLowerCase() ?? '')
  .filter(Boolean)
```

---

### `src/components/wizard/DocumentSlots.tsx` (modificar — upload real a Cloudinary + modal confirmación)

**Analog:** Sí mismo (para estructura base) + `src/components/dashboard/DeleteModal.tsx` (para el modal de confirmación)

**Estructura 'use client' + imports** (DocumentSlots.tsx líneas 1-3):
```typescript
'use client'
import { useState, useRef } from 'react'
import { Plus, Upload, X, FileText } from 'lucide-react'
```
Agregar: `import { CldUploadWidget } from 'next-cloudinary'` y eliminar `useRef` (ya no se necesita input file oculto).

**Props interface** (DocumentSlots.tsx líneas 29-40) — agregar `ocId` y `onUploadSuccess`:
```typescript
interface DocumentSlotsProps {
  readOnly?: boolean
  ocId?: string
  documentos?: {
    facturaProveedor: string | null
    facturaDespachante: string | null
    conocimientoEmbarque: string | null
    certificadoOrigen: string | null
    certificadoAnalisis?: string | null
    packingList?: string | null   // NUEVO en Phase 6
    otro: string | null
  }
}
```

**Modal de confirmación pattern** (DeleteModal.tsx líneas 11-38) — estructura del modal que ya existe:
```typescript
'use client'

interface DeleteModalProps {
  open: boolean
  // ...
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteModal({ open, ..., onConfirm, onCancel }: DeleteModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-texto/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-acento p-6 max-w-sm w-full flex flex-col gap-4">
        {/* ... contenido */}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="border border-acento text-texto hover:bg-fondo px-4 py-2 rounded-lg font-normal min-h-[44px] transition-colors duration-150">
            Cancelar
          </button>
          <button onClick={onConfirm} className="bg-principal text-white hover:bg-titulares px-4 py-2 rounded-lg font-medium min-h-[44px] transition-colors duration-150">
            Reemplazar
          </button>
        </div>
      </div>
    </div>
  )
}
```
Para el modal de confirmación de reemplazo de PDF en `DocumentSlots`, usar exactamente esta estructura de clase CSS — cambiar colores de rojo (`bg-red-600`) a principal (`bg-principal`) ya que no es una acción destructiva-irreversible.

**Estado para modal** (patrón derivado de OCDetailActions.tsx líneas 12-13):
```typescript
const [confirmSlot, setConfirmSlot] = useState<string | null>(null)
```

---

### `src/components/oc-detail/OCDetailHeader.tsx` (modificar — agregar botón "Exportar PDF")

**Analog:** Sí mismo.

**Botón "Editar" existente** (OCDetailHeader.tsx líneas 29-35) — copiar estructura exacta para botón "Exportar PDF":
```typescript
<Link
  href={`/${rol}/oc/${oc.id}/editar`}
  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-principal text-principal font-medium text-sm hover:bg-principal hover:text-white transition-colors min-h-[44px]"
>
  <Pencil size={16} /> Editar
</Link>
```
El botón de export usa `<a>` nativo en lugar de `<Link>` (para forzar descarga con atributo `download`), pero mismas clases CSS. Usar color `acento` en lugar de `principal` para distinguir visualmente:
```typescript
<a
  href={`/api/oc/${oc.id}/pdf`}
  download
  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-acento text-acento font-medium text-sm hover:bg-acento hover:text-white transition-colors min-h-[44px]"
>
  <Download size={16} /> Exportar PDF
</a>
```
Agregar `Download` a los imports de `lucide-react`. El botón se muestra para todos los roles (sin guard `rol === 'importador'`).

---

### `src/components/emails/OCNotificationEmail.tsx` (nuevo — template React Email)

**Analog:** `src/components/dashboard/DeleteModal.tsx` (estructura JSX funcional con props tipadas)

**Estructura de componente funcional tipado** (DeleteModal.tsx líneas 1-9):
```typescript
'use client'   // NO aplicar — este componente es server-side only

interface DeleteModalProps {
  open: boolean
  ocNumero: string
  proveedor: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteModal({ open, ocNumero, proveedor, onConfirm, onCancel }: DeleteModalProps) {
```
Mismo patrón de interface + función nombrada exportada. Sin `'use client'` ya que se renderiza server-side por Resend.

**Colores de marca** (de CLAUDE.md):
- Fondo: `#f0f7ff`
- Principal/azul: `#0061a6`
- Titulares: `#004a80`
- Acento/verde: `#62b446`
- Texto: `#1C1917`

**Patrón del template:**
```typescript
import { Body, Container, Heading, Text, Button, Img, Html, Section } from '@react-email/components'

interface OCResumen {
  referenciaOC: string
  proveedor: string
  estado: string
  fechaOC: string
  notas: string
}

interface OCNotificationEmailProps {
  oc: OCResumen
  link: string
}

export function OCNotificationEmail({ oc, link }: OCNotificationEmailProps) {
  return (
    <Html>
      <Body style={{ backgroundColor: '#f0f7ff', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff', borderRadius: 8, padding: 32 }}>
          <Img src="https://[dominio]/logo-horizontal.svg" alt="Sistema integral COMEX" height={40} />
          <Heading style={{ color: '#004a80', fontSize: 20 }}>
            Actualización OC {oc.referenciaOC}
          </Heading>
          <Text style={{ color: '#1C1917' }}>Proveedor: {oc.proveedor}</Text>
          <Text style={{ color: '#1C1917' }}>Estado: {oc.estado}</Text>
          <Text style={{ color: '#1C1917' }}>Fecha OC: {oc.fechaOC}</Text>
          {oc.notas && <Text style={{ color: '#1C1917' }}>Notas: {oc.notas}</Text>}
          <Button href={link} style={{ backgroundColor: '#0061a6', color: '#ffffff', borderRadius: 6, padding: '12px 24px' }}>
            Ver OC
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

---

### `src/lib/pdf/OCPDFDocument.tsx` (nuevo — componente react-pdf)

**Analog:** `src/lib/wizard-calculations.ts` (fuente de datos) + `src/components/oc-detail/OCDetailView.tsx` (estructura de display — referencia visual, NO copiar hooks)

**CRÍTICO:** No usar ningún hook de React, no usar Context. Solo primitivas de `@react-pdf/renderer` y props. El componente `OCDetailView.tsx` muestra cómo organizar las secciones pero usa hooks — el PDF replica el layout sin ninguno de ellos.

**Importaciones correctas para react-pdf:**
```typescript
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'
```
No importar nada de `react` salvo el JSX transform implícito.

**Colores marca para StyleSheet:**
```typescript
const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 32, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, borderBottom: '2px solid #0061a6', paddingBottom: 12 },
  heading: { fontSize: 18, color: '#004a80', fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, color: '#0061a6', fontWeight: 'bold', marginBottom: 6, marginTop: 16 },
  label: { fontSize: 9, color: '#666666' },
  value: { fontSize: 10, color: '#1C1917' },
  tableHeader: { backgroundColor: '#0061a6', color: '#ffffff', fontSize: 9, fontWeight: 'bold', padding: 4 },
  tableCell: { fontSize: 9, padding: 4, borderBottom: '1px solid #e5e7eb' },
  accentValue: { fontSize: 12, color: '#62b446', fontWeight: 'bold' },
})
```

**Cálculos dentro del componente** (derivados de wizard-calculations.ts) — calcular ANTES de renderizar, pasando resultados como variables locales:
```typescript
// Patrón de uso correcto (sin hooks):
const fob = calcFOBTotal(oc.productos)
const tc = oc.tipoCambio
const gastos = calcTotalGastos(oc.gastosDespacho, oc.gastosDespachante, oc.gastosAdicionales, oc.otrosGastos, tc)
const landedCost = calcLandedCost(fob, gastos)
```

---

### `src/lib/models/OC.ts` (modificar — agregar `packingList`)

**Analog:** Sí mismo. Copiar patrón de campo `certificadoAnalisis`.

**Campo existente a copiar** (OC.ts línea 78):
```typescript
certificadoAnalisis: { type: String, default: null },
```
Agregar en el bloque `documentos` del schema (líneas 73-80):
```typescript
documentos: {
  facturaProveedor: { type: String, default: null },
  facturaDespachante: { type: String, default: null },
  conocimientoEmbarque: { type: String, default: null },
  certificadoOrigen: { type: String, default: null },
  certificadoAnalisis: { type: String, default: null },
  packingList: { type: String, default: null },   // AGREGAR
  otro: { type: String, default: null },
},
```

---

### `src/lib/mock-ocs.ts` (modificar — agregar `packingList` en tipo `OCDetalle`)

**Analog:** Sí mismo. Copiar patrón de `certificadoAnalisis` en la interface `OCDetalle`.

**Tipo existente** (mock-ocs.ts líneas 47-54):
```typescript
documentos: {
  facturaProveedor: string | null
  facturaDespachante: string | null
  conocimientoEmbarque: string | null
  certificadoOrigen: string | null
  certificadoAnalisis: string | null
  otro: string | null
}
```
Agregar `packingList: string | null` después de `certificadoAnalisis`.

También actualizar `serializeOC` en `src/actions/oc.ts` (líneas 153-161):
```typescript
documentos: {
  // ... campos existentes
  certificadoAnalisis: d.documentos?.certificadoAnalisis ?? null,
  packingList: d.documentos?.packingList ?? null,   // AGREGAR
  otro: d.documentos?.otro ?? null,
},
```

---

### `next.config.ts` (modificar — agregar `@react-pdf/renderer`)

**Analog:** Sí mismo.

**Config existente** (next.config.ts líneas 1-7):
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose'],
}

export default nextConfig
```
Modificar únicamente el array `serverExternalPackages`:
```typescript
serverExternalPackages: ['mongoose', '@react-pdf/renderer'],
```

---

## Shared Patterns

### Auth + IDOR Guard
**Fuente:** `src/actions/oc.ts` líneas 275-282
**Aplicar a:** `updateOCDocumento` (Server Action), Route Handler `/api/oc/[id]/pdf`
```typescript
const { userId } = await auth()
if (!userId) return { error: 'No autorizado' }

await connectDB()

const existing = await OC.findById(id).lean() as { importadorId?: string } | null
if (!existing || existing.importadorId !== userId) return { error: 'Sin acceso' }
```
Para `updateOCDocumento` el guard es multi-rol: verificar `importadorId === userId` OR email del usuario en `emailsProveedor` OR `emailsDespachante`.

### Obtener email de usuario desde Clerk
**Fuente:** `src/actions/oc.ts` líneas 245-250
**Aplicar a:** `sendOCNotification` (para obtener email del importador y verificar rol del editor)
```typescript
const clerkUser = await (await clerkClient()).users.getUser(userId)
const emails = clerkUser.emailAddresses
  .map(e => e.emailAddress?.toLowerCase() ?? '')
  .filter(Boolean)
```

### Error handling en Server Actions
**Fuente:** `src/actions/oc.ts` líneas 187-220
**Aplicar a:** `updateOCDocumento`
```typescript
try {
  // ... lógica
  return { data: { id } }
} catch (err: unknown) {
  return { error: 'Error al guardar la OC' }
}
```

### Fire-and-forget con try/catch interno
**Fuente:** RESEARCH.md Pattern 2 (no existe aún, crear este patrón)
**Aplicar a:** `sendOCNotification`, `syncToSheets`
```typescript
async function sendOCNotification(...): Promise<void> {
  try {
    // ... lógica
  } catch (err) {
    console.error('[sendOCNotification] failed:', err)
  }
}
// Invocar con:
void sendOCNotification(id, userId)
void syncToSheets(id)
```

### Clases CSS de botón estilo "acción secundaria"
**Fuente:** `src/components/oc-detail/OCDetailHeader.tsx` líneas 29-35
**Aplicar a:** Botón "Exportar PDF" en `OCDetailHeader`, botones del modal de confirmación en `DocumentSlots`
```typescript
// Botón borde azul:
"flex items-center gap-2 px-4 py-2 rounded-lg border border-principal text-principal font-medium text-sm hover:bg-principal hover:text-white transition-colors min-h-[44px]"

// Botón borde acento (verde):
"flex items-center gap-2 px-4 py-2 rounded-lg border border-acento text-acento font-medium text-sm hover:bg-acento hover:text-white transition-colors min-h-[44px]"
```

### runtime = 'nodejs' en Route Handlers
**Fuente:** `src/app/api/webhooks/clerk/route.ts` línea 1
**Aplicar a:** `/api/sign-cloudinary-params/route.ts`, `/api/oc/[id]/pdf/route.ts`
```typescript
export const runtime = 'nodejs'
```
Primera línea del archivo, antes de cualquier import.

---

## No Analog Found

Ningún archivo queda completamente sin analog. Los archivos con analog parcial son:

| Archivo | Rol | Data Flow | Razón |
|---------|-----|-----------|-------|
| `src/components/emails/OCNotificationEmail.tsx` | component (email) | event-driven | No existen templates de email en el codebase — usar primitivas `@react-email/components` |
| `src/lib/pdf/OCPDFDocument.tsx` | utility (PDF) | transform | No existen componentes react-pdf — usar primitivas `@react-pdf/renderer`; estructura visual referenciada en `OCDetailView.tsx` pero sin copiar hooks |

Para estos dos archivos, el planner debe referenciar los ejemplos de RESEARCH.md Patterns 2 y 3 directamente.

---

## Critical Gaps (el planner DEBE incluir tareas para estos)

| Gap | Impacto | Solución |
|-----|---------|---------|
| `packingList` no existe en schema Mongoose (`OC.ts`) ni en tipo `OCDetalle` (`mock-ocs.ts`) | Upload silently falla — el campo no se persiste | Agregar en Wave 1 de plan 06-01, antes de cualquier trabajo en `DocumentSlots` |
| `serializeOC` en `oc.ts` no serializa `packingList` | La URL subida no llega al cliente | Agregar `packingList: d.documentos?.packingList ?? null` en `serializeOC` |
| `next.config.ts` solo tiene `mongoose` en `serverExternalPackages` | `@react-pdf/renderer` crashea en App Router | Agregar en Wave 1 de plan 06-03, antes de crear el Route Handler del PDF |
| `.env.example` usa `CLOUDINARY_API_KEY` sin `NEXT_PUBLIC_` | `CldUploadWidget` no funciona en cliente | Actualizar a `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_API_KEY` |

---

## Metadata

**Scope de búsqueda de analogs:**
- `src/app/api/` — 1 archivo
- `src/actions/` — 1 archivo
- `src/components/` — 22 archivos
- `src/lib/` — modelos, tipos, cálculos

**Archivos escaneados:** 12
**Fecha de extracción de patrones:** 2026-06-02
