# Phase 6: Files & Integrations - Research

**Researched:** 2026-06-02
**Domain:** Cloudinary signed upload, Resend + React Email, @react-pdf/renderer, Google Sheets API v4
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Upload de PDFs a Cloudinary**
- D-01: El upload ocurre en ambos lugares: en Step 2 del wizard (DocumentSlots) y en la página de detalle de la OC.
- D-02: Si el slot ya tiene un PDF, mostrar modal de confirmación antes de reemplazar.
- D-03: Todos los roles (importador, proveedor, despachante) pueden subir documentos.
- D-04: Implementar `/api/sign-cloudinary-params` como Route Handler firmado. `resource_type: 'raw'` para PDFs.
- D-05: Al subir, guardar la URL de Cloudinary en MongoDB en `documentos[slot]`. Si ya tenía URL, reemplazarla.

**Emails con Resend**
- D-06: Email disparado al crear o actualizar la OC, siempre que `estado !== 'borrador'`.
- D-07: Email va a todos los miembros excepto el editor. Lógica por rol documentada en CONTEXT.md.
- D-08: Cuerpo del email: referencia OC, proveedor, estado, fecha OC, notas, botón/link.
- D-09: Template React Email con identidad visual (`#0061a6`, `#62b446`, logo).
- D-10: Envío fire-and-forget — no bloquea la respuesta.

**Export PDF con react-pdf**
- D-11: Botón "Exportar PDF" en `OCDetailHeader`, todos los roles.
- D-12: PDF incluye datos generales, tabla de productos, gastos, valores finales.
- D-13: PDF con branding: logo horizontal, colores `#0061a6` / `#62b446`.
- D-14: Route Handler `/api/oc/[id]/pdf` con `export const runtime = 'nodejs'`.

**Google Sheets Sync**
- D-15: Sync automático al guardar la OC, fire-and-forget.
- D-16: Single-tenant — una sola hoja en env vars (`GOOGLE_SHEETS_SPREADSHEET_ID`).
- D-17: Una fila por OC, upsert por `referenciaOC`.
- D-18: Columnas: Referencia OC, Proveedor, Estado, Fecha OC, País de Origen, FOB USD, Total Gastos USD, Landed Cost USD.
- D-19: La hoja ya existe — no crear headers.
- D-20: Service account JWT, `GOOGLE_PRIVATE_KEY` con `.replace(/\\n/g, '\n')`.

### Claude's Discretion
- Estructura del template de React Email: el planner/executor elige el layout mientras respete colores y logo.
- Lógica de búsqueda de fila en Sheets: `spreadsheets.values.get` + búsqueda por referenciaOC en columna A, luego `values.update` o `values.append`.
- Obtener email del importador: `clerkClient().users.getUser(importadorId)`.

### Deferred Ideas (OUT OF SCOPE)
- Notificación al importador cuando proveedor/despachante suben documentos.
- Configuración per-importador de Google Sheets (multi-tenancy).
- Preview del PDF antes de descargar.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-01 | Upload de PDFs a Cloudinary usando servidor-firmado (signed upload) — never `NEXT_PUBLIC_` para secrets | D-04: `/api/sign-cloudinary-params` con `cloudinary.utils.api_sign_request`, `CLOUDINARY_API_SECRET` solo en servidor |
| DOC-02 | URL de cada documento guardada en el campo correspondiente del documento OC en MongoDB | Nuevo Server Action `updateOCDocumento(id, slot, url)` que hace `$set: { documentos.${slot}: url }` |
| DOC-03 | Documentos solo visibles y descargables (no editables) para proveedor y despachante | `DocumentSlots` ya tiene prop `readOnly` — en detail view se pasan las URLs como links |
| NOTIF-01 | Al crear/guardar OC con mail de proveedor, Resend envía email | Fire-and-forget en `createOC` y `updateOC`/`updateOCInfo` después del return success |
| NOTIF-02 | Al crear/guardar OC con mail de despachante, Resend envía email | Misma función de notificación — destinatarios varían por rol editor |
| NOTIF-03 | Emails usan templates `@react-email/components` con identidad visual | `@react-email/components` 1.0.12 verificado; template con `Body`, `Container`, `Heading`, `Text`, `Button`, `Img` |
| EXPORT-01 | Exportar OC completa a PDF (D-11: todos los roles, no solo importador) | Botón en `OCDetailHeader` — GET a `/api/oc/[id]/pdf` |
| EXPORT-02 | PDF generado server-side con `@react-pdf/renderer` via Route Handler — no puppeteer | `renderToBuffer` en Route Handler con `export const runtime = 'nodejs'` y `@react-pdf/renderer` en `serverExternalPackages` |
| EXPORT-03 | PDF incluye todos los datos: info general, productos, gastos, documentos (links), valores finales, branding | Usar `wizard-calculations.ts` para recalcular valores en el Route Handler |
| SHEETS-01 | Sync a Google Sheet (URL fija en `.env.local`) | `GOOGLE_SHEETS_SPREADSHEET_ID` ya en `.env.example` |
| SHEETS-02 | Sync con service account JWT — operación asíncrona | `googleapis` v173.0.0 verificado; JWT con `google.auth.GoogleAuth` |
| SHEETS-03 | Cada OC ocupa una fila con los campos especificados en D-18 | Lógica upsert: get columna A → encontrar fila → update o append |
</phase_requirements>

---

## Summary

Phase 6 conecta cuatro integraciones externas sobre la base de backend ya construida en Phase 5. El trabajo se organiza en tres planes paralelos tras una dependencia secuencial mínima: el upload de Cloudinary requiere que `DocumentSlots` se convierta de cliente-local a cliente-con-Cloudinary, los emails se inyectan en los Server Actions existentes, el PDF export es un Route Handler aislado, y Sheets sync se cuelga del mismo punto de inyección que los emails.

**Brecha crítica detectada:** `DocumentSlots` tiene el slot "Packing list" mapeado a `packingList`, pero el schema Mongoose de `OC` no tiene ese campo — solo tiene `certificadoAnalisis` y `otro`. El plan debe reconciliar este gap (agregar `packingList` al schema o unificar con `otro`). El campo `packingList` tampoco existe en `OCDetalle.documentos` en `mock-ocs.ts`.

**Brecha de env vars:** El `.env.example` actual usa `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`, pero `next-cloudinary` y `CldUploadWidget` esperan `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_API_KEY` como públicas. La firma requiere solo `CLOUDINARY_API_SECRET` como privada. El plan debe aclarar qué vars son `NEXT_PUBLIC_` y cuáles no.

**Primary recommendation:** Implementar en tres planes secuenciales: 06-01 (Cloudinary upload + Server Action updateOCDocumento), 06-02 (Resend + React Email templates), 06-03 (PDF export + Google Sheets sync).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Signing de upload Cloudinary | API / Backend (Route Handler) | — | CLOUDINARY_API_SECRET nunca en cliente |
| Upload de PDF a Cloudinary | Browser / Client | API signing | El widget hace el upload directo a Cloudinary CDN; el servidor solo firma |
| Guardar URL en MongoDB | API / Backend (Server Action) | — | updateOCDocumento es mutación de datos |
| Envío de email Resend | API / Backend (Server Action) | — | Fire-and-forget dentro del Server Action existente |
| Template React Email | API / Backend | — | Renderizado server-side como JSX pasado a Resend |
| Generación PDF export | API / Backend (Route Handler) | — | renderToBuffer requiere Node.js runtime, retorna binary |
| Sheets sync | API / Backend (Server Action) | — | googleapis solo corre server-side; fire-and-forget |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next-cloudinary` | 6.17.5 | `CldUploadWidget` para upload cliente + utilidades | Wrapper oficial de Cloudinary para Next.js; maneja signed uploads con `signatureEndpoint` |
| `cloudinary` (SDK) | — | `cloudinary.utils.api_sign_request` en API Route | SDK oficial para firma server-side |
| `resend` | 6.12.4 | Envío de emails transaccionales | SDK oficial de Resend; integración nativa con React Email |
| `@react-email/components` | 1.0.12 | Primitivas de template (Body, Container, Heading, Text, Button, Img) | Ecosistema oficial de React Email |
| `@react-pdf/renderer` | 4.5.1 | Generación de PDF server-side | Decisión bloqueada (D-14); Puppeteer excede límite de 50 MB en Vercel |
| `googleapis` | 173.0.0 | Google Sheets API v4 con service account | Biblioteca oficial de Google; incluye `google.auth.GoogleAuth` para JWT |

[VERIFIED: npm registry — versiones confirmadas con `npm view <pkg> version` en este contexto]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-email/render` | (incluido en `@react-email/components`) | Renderizar template a HTML para preview local | Solo si se necesita preview HTML en desarrollo |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@react-pdf/renderer` | Puppeteer | Puppeteer excede 50 MB Vercel limit — descartado |
| `next-cloudinary` CldUploadWidget | Upload directo fetch a Cloudinary | CldUploadWidget maneja el flujo firmado out-of-the-box |
| `googleapis` | `@googleapis/sheets` (ESM subpackage) | `googleapis` es el estándar consolidado para proyectos TS |

**Installation:**
```bash
npm install next-cloudinary cloudinary resend @react-email/components @react-pdf/renderer googleapis
```

**Version verification:** Todos los paquetes verificados contra npm registry en 2026-06-02. [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
UPLOAD FLOW
  Browser (DocumentSlots 'use client')
    → GET /api/sign-cloudinary-params (Route Handler — firma con CLOUDINARY_API_SECRET)
    ← { signature }
    → POST directo a Cloudinary CDN (resource_type: raw)
    ← { secure_url }
    → Server Action: updateOCDocumento(id, slot, url)
      → MongoDB: $set documentos.{slot} = url
      → fire-and-forget: sendOCNotification(oc, editorId) [Resend]

EMAIL FLOW
  Server Action (createOC / updateOC / updateOCInfo / updateOCDocumento)
    → resolveRecipients(oc, editorId) [Clerk clerkClient para email importador]
    → resend.emails.send({ react: OCNotificationEmail({...}) }) [NO await en path crítico]
    ← void (fire-and-forget)

PDF EXPORT FLOW
  Browser (botón "Exportar PDF" en OCDetailHeader)
    → GET /api/oc/[id]/pdf (Route Handler, runtime: 'nodejs')
      → getOCById(id) [Server Action existente]
      → calcFOBTotal / calcTotalGastos [wizard-calculations.ts]
      → renderToBuffer(<OCPDFDocument oc={...} />)
      ← Response(buffer, { headers: { Content-Type: 'application/pdf', Content-Disposition: 'attachment' } })

SHEETS SYNC FLOW
  Server Action (createOC / updateOC / updateOCInfo)
    → fire-and-forget: syncToSheets(oc)
      → google.auth.GoogleAuth JWT (service account)
      → sheets.spreadsheets.values.get(range: 'A:A')
      → buscar fila por referenciaOC
      → sheets.spreadsheets.values.update (si existe) O values.append (si no existe)
      ← void
```

### Recommended Project Structure

```
src/
├── app/
│   └── api/
│       ├── sign-cloudinary-params/
│       │   └── route.ts              # POST — firma params, retorna { signature }
│       └── oc/
│           └── [id]/
│               └── pdf/
│                   └── route.ts      # GET — renderToBuffer + response PDF
├── actions/
│   └── oc.ts                         # Agregar: updateOCDocumento, sendOCNotification, syncToSheets
├── components/
│   ├── wizard/
│   │   └── DocumentSlots.tsx         # Modificar: upload real a Cloudinary, modal confirmación
│   ├── oc-detail/
│   │   └── OCDetailHeader.tsx        # Modificar: agregar botón "Exportar PDF"
│   └── emails/
│       └── OCNotificationEmail.tsx   # Nuevo: template React Email
└── lib/
    └── pdf/
        └── OCPDFDocument.tsx         # Nuevo: componente react-pdf Document
```

### Pattern 1: Signed Upload a Cloudinary (resource_type: raw)

**What:** El cliente solicita firma al servidor, luego sube directamente a Cloudinary CDN sin pasar el archivo por el servidor de la app.

**When to use:** Siempre que se suba un archivo a Cloudinary — el secreto NUNCA se expone al cliente.

**API Route (firma):**
```typescript
// src/app/api/sign-cloudinary-params/route.ts
// Source: next.cloudinary.dev/clduploadwidget/signed-uploads
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  const body = await request.json()
  const { paramsToSign } = body as { paramsToSign: Record<string, string> }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )

  return Response.json({ signature })
}
```

**Cliente (DocumentSlots con CldUploadWidget):**
```typescript
// Source: next.cloudinary.dev/clduploadwidget/signed-uploads [CITED]
import { CldUploadWidget } from 'next-cloudinary'

<CldUploadWidget
  signatureEndpoint="/api/sign-cloudinary-params"
  uploadPreset={undefined}           // signed upload no usa uploadPreset
  options={{ resourceType: 'raw' }}  // PDFs como raw
  onSuccess={(result) => {
    const url = (result.info as { secure_url: string }).secure_url
    // llamar updateOCDocumento(ocId, slot, url)
  }}
>
  {({ open }) => <button onClick={() => open()}>Adjuntar</button>}
</CldUploadWidget>
```

**Server Action updateOCDocumento:**
```typescript
// 'use server'
export async function updateOCDocumento(
  id: string,
  slot: keyof OCDocumentos,
  url: string
): Promise<{ data: { id: string } } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }
  await connectDB()
  await OC.findByIdAndUpdate(id, { $set: { [`documentos.${slot}`]: url } })
  // fire-and-forget email
  void sendOCNotification(id, userId)
  return { data: { id } }
}
```

### Pattern 2: Resend + React Email (fire-and-forget)

**What:** Template React Email renderizado como JSX y enviado via Resend. Se invoca con `void` para no bloquear.

**When to use:** Al finalizar `createOC`, `updateOC`, `updateOCInfo`, `updateOCDocumento` — siempre que `estado !== 'borrador'`.

**Template:**
```typescript
// src/components/emails/OCNotificationEmail.tsx
// Source: resend.com/docs/send-with-nextjs [CITED]
import { Body, Container, Heading, Text, Button, Img, Html } from '@react-email/components'

export function OCNotificationEmail({ oc, link }: { oc: OCResumen; link: string }) {
  return (
    <Html>
      <Body style={{ backgroundColor: '#f0f7ff', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: '#fff', borderRadius: 8 }}>
          <Img src="https://drivaoc.com/logo-horizontal.svg" alt="Sistema integral COMEX" height={40} />
          <Heading style={{ color: '#004a80' }}>Actualización OC {oc.referenciaOC}</Heading>
          <Text>Proveedor: {oc.proveedor}</Text>
          <Text>Estado: {oc.estado}</Text>
          <Text>Fecha OC: {oc.fechaOC}</Text>
          {oc.notas && <Text>Notas: {oc.notas}</Text>}
          <Button href={link} style={{ backgroundColor: '#0061a6', color: '#fff' }}>
            Ver OC
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

**Función helper (fire-and-forget):**
```typescript
// en src/actions/oc.ts — llamar con void, nunca await en path crítico
async function sendOCNotification(ocId: string, editorUserId: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  // ... fetch oc, resolve recipients via clerkClient
  // D-07: resolver destinatarios según rol del editor
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: recipients,
    subject: `Actualización OC ${oc.referenciaOC}`,
    react: OCNotificationEmail({ oc, link }),
  })
}
```

### Pattern 3: PDF Export con @react-pdf/renderer

**What:** Route Handler que genera PDF en Node.js runtime y lo retorna como stream binario.

**When to use:** GET `/api/oc/[id]/pdf` — botón "Exportar PDF" en OCDetailHeader.

**next.config.ts (ya tiene mongoose — agregar react-pdf):**
```typescript
// next.config.ts — MODIFICAR para agregar @react-pdf/renderer
const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', '@react-pdf/renderer'],
}
```

**Route Handler:**
```typescript
// src/app/api/oc/[id]/pdf/route.ts
// Source: react-pdf.org/node, github.com/diegomura/react-pdf/discussions/2402 [CITED]
export const runtime = 'nodejs'

import { renderToBuffer } from '@react-pdf/renderer'
import { OCPDFDocument } from '@/lib/pdf/OCPDFDocument'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const result = await getOCById(params.id)
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

**Componente PDF (sin Context — usar solo primitivas react-pdf):**
```typescript
// src/lib/pdf/OCPDFDocument.tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

// CRÍTICO: No usar React Context ni hooks de cliente.
// Calcular valores con wizard-calculations.ts directamente.
```

### Pattern 4: Google Sheets Upsert

**What:** Buscar fila existente por referenciaOC en columna A, luego update o append.

**When to use:** Al finalizar `createOC`, `updateOC`, `updateOCInfo` — fire-and-forget.

```typescript
// Source: developers.google.com/workspace/sheets/api [CITED]
import { google } from 'googleapis'

async function syncToSheets(oc: SerializedOC): Promise<void> {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // MANDATORIO
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!

  // Buscar fila existente
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:A',
  })
  const rows = res.data.values ?? []
  const rowIndex = rows.findIndex(r => r[0] === oc.referenciaOC)

  const rowData = [
    oc.referenciaOC,
    oc.proveedor,
    oc.estado,
    oc.fechaOC,
    oc.paisOrigen,
    calcFOBTotal(oc.productos).toFixed(2),
    calcTotalGastos(...).toFixed(2),
    calcLandedCost(...).toFixed(2),
  ]

  if (rowIndex >= 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `A${rowIndex + 1}:H${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    })
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:H',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowData] },
    })
  }
}
```

### Anti-Patterns to Avoid

- **`await sendOCNotification(...)` en el path crítico:** Bloquea la respuesta. Siempre `void sendOCNotification(...)`.
- **`await syncToSheets(...)` en el path crítico:** Igual que email — siempre `void syncToSheets(...)`.
- **`CLOUDINARY_API_SECRET` en variable `NEXT_PUBLIC_`:** Expone el secreto al cliente. La firma solo ocurre en el Route Handler server-side.
- **Puppeteer para PDF:** Excede 50 MB en Vercel. Solo `@react-pdf/renderer`.
- **`@react-pdf/renderer` sin `serverExternalPackages`:** Causa crash en App Router. Debe estar en `next.config.ts`.
- **React Context en componente PDF:** El componente `OCPDFDocument` corre en un Route Handler fuera del árbol de React — no puede recibir Context. Pasar todos los datos como props.
- **`GOOGLE_PRIVATE_KEY` sin `.replace(/\\n/g, '\n')`:** La clave privada en env var tiene `\n` como string literal, no como newline. Sin el replace, la autenticación falla silenciosamente.
- **Upload sin modal de confirmación:** D-02 exige modal si el slot ya tiene PDF. Sin modal, los usuarios sobreescriben sin querer.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upload firmado a Cloudinary | Custom fetch + firma manual | `CldUploadWidget` con `signatureEndpoint` | Maneja reintentos, progress, validación de tipo/tamaño |
| Email transaccional | SMTP directo o nodemailer | `resend` SDK + `@react-email/components` | Deliverability, templating con JSX, ya decidido |
| Generación de PDF | HTML/CSS + Puppeteer | `@react-pdf/renderer` | Puppeteer = 50+ MB binario, bloqueado en Vercel |
| Auth Google Sheets | OAuth manual | `google.auth.GoogleAuth` con service account | El SDK maneja renovación de tokens JWT automáticamente |
| Upsert en Sheets | Base de datos como intermediario | get + find + update/append directo a Sheets API | Sheets es la única fuente de verdad requerida por el cliente |

**Key insight:** Cada integración tiene un SDK oficial que maneja la autenticación, reintentos y edge cases. Construir wrappers propios introduce superficie de bugs sin beneficio.

---

## Common Pitfalls

### Pitfall 1: `packingList` no existe en el schema Mongoose

**What goes wrong:** `DocumentSlots.tsx` mapea "Packing list" a `packingList`, pero `OC.ts` (Mongoose schema) no tiene ese campo — solo tiene `certificadoAnalisis` y `otro`. El upload a Cloudinary guardaría en un campo inexistente y se perdería.

**Why it happens:** El UI se construyó con 6 slots en Phase 3 (incluyendo Packing list), pero el schema se definió con 5 + `otro`. No hubo sincronización.

**How to avoid:** El planner debe incluir una tarea en Wave 1 para: (a) agregar `packingList: { type: String, default: null }` al schema Mongoose, y (b) agregar `packingList: string | null` a `OCDetalle.documentos` en `mock-ocs.ts` y a `serializeOC` en `oc.ts`. Sin esto, el upload de packing list silently falla. [VERIFIED: grep del codebase]

**Warning signs:** TypeScript no genera error porque `FIXED_SLOT_KEYS` usa `keyof NonNullable<DocumentSlotsProps['documentos']>` y `DocumentSlotsProps` tiene `packingList?: string | null` — el `?` lo hace opcional.

### Pitfall 2: Variables de entorno Cloudinary — naming mismatch

**What goes wrong:** El `.env.example` actual tiene `CLOUDINARY_API_KEY` y `CLOUDINARY_CLOUD_NAME` sin prefijo `NEXT_PUBLIC_`. `CldUploadWidget` de `next-cloudinary` requiere `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_API_KEY` para funcionar en el cliente.

**Why it happens:** El `.env.example` fue definido antes de elegir el approach con `next-cloudinary`.

**How to avoid:** El plan debe: (a) actualizar `.env.example` para tener `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_API_KEY` como públicas, y mantener `CLOUDINARY_API_SECRET` como privada. La API Route de firma solo necesita `CLOUDINARY_API_SECRET`. [VERIFIED: next.cloudinary.dev docs]

### Pitfall 3: `@react-pdf/renderer` sin `serverExternalPackages`

**What goes wrong:** Next.js App Router intenta bundlear `@react-pdf/renderer` como módulo de servidor y falla con `TypeError: ba.Component is not a constructor` o `PDFDocument is not a constructor`.

**Why it happens:** react-pdf usa APIs de Node.js que no son compatibles con el bundler de Next.js para Server Components.

**How to avoid:** Agregar `'@react-pdf/renderer'` al array `serverExternalPackages` en `next.config.ts`. El archivo ya tiene `['mongoose']` — agregar al array. [VERIFIED: react-pdf.org/compatibility, multiple GitHub issues]

### Pitfall 4: Componente PDF con React Context

**What goes wrong:** Un componente PDF que intenta usar `useContext` o que recibe props via Context de React falla cuando se renderiza en un Route Handler (fuera del árbol de React de la app).

**Why it happens:** El Route Handler instancia `renderToBuffer` independientemente del árbol de React de Next.js — no hay Provider activo.

**How to avoid:** `OCPDFDocument` debe ser un componente puro que recibe todos los datos como props. No usar ningún hook ni Context. Calcular valores con `wizard-calculations.ts` directamente en el Route Handler y pasar los resultados como props al componente. [VERIFIED: github.com/vercel/next.js discussions #68553]

### Pitfall 5: Google Sheets API — newline en GOOGLE_PRIVATE_KEY

**What goes wrong:** Autenticación falla con `Error: error:0909006C:PEM routines:get_name:no start line`. La clave privada queda mal formateada.

**Why it happens:** Los env vars almacenan `\n` como dos caracteres (`\` y `n`), no como newline real.

**How to avoid:** Siempre: `process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')` al usar la clave. Documentado en CLAUDE.md como mandatorio. [VERIFIED: CLAUDE.md]

### Pitfall 6: Fire-and-forget con `void` no captura errores

**What goes wrong:** Un error en `sendOCNotification` o `syncToSheets` queda silencioso — no hay log ni telemetría.

**Why it happens:** `void asyncFn()` descarta la promesa rechazada.

**How to avoid:** Envolver en try/catch interno dentro de la función async, con `console.error` (no throw). La operación principal no debe fallar, pero los errores deben ser visibles en logs de Vercel.

```typescript
async function sendOCNotification(...): Promise<void> {
  try {
    // ... lógica de envío
  } catch (err) {
    console.error('[sendOCNotification] failed:', err)
  }
}
```

---

## Code Examples

### Env vars requeridas (actualización de .env.example)

```bash
# Cloudinary (Phase 6) — ACTUALIZAR desde versión actual
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=     # público — usado por CldUploadWidget en cliente
NEXT_PUBLIC_CLOUDINARY_API_KEY=        # público — usado por CldUploadWidget
CLOUDINARY_API_SECRET=                 # PRIVADO — solo en API Route de firma

# Resend (Phase 6)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Google Sheets (Phase 6)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=                    # con \n como string — .replace() al usar
GOOGLE_SHEETS_SPREADSHEET_ID=
```

### Botón "Exportar PDF" en OCDetailHeader

```typescript
// En OCDetailHeader.tsx — agregar junto al botón "Editar"
// La descarga es un <a> con href directo — no requiere 'use client'
<a
  href={`/api/oc/${oc.id}/pdf`}
  download
  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-acento text-acento font-medium text-sm hover:bg-acento hover:text-white transition-colors min-h-[44px]"
>
  <Download size={16} /> Exportar PDF
</a>
```

### Modal de confirmación antes de reemplazar PDF

```typescript
// En DocumentSlots.tsx — lógica en handleUploadAttempt
const handleUploadAttempt = (slot: string, existingUrl: string | null) => {
  if (existingUrl) {
    setConfirmSlot(slot) // muestra modal
  } else {
    openUploadWidget(slot)
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `serverComponentsExternalPackages` (experimental) | `serverExternalPackages` (stable) | Next.js 14.1 | La clave en `next.config.ts` es `serverExternalPackages`, no bajo `experimental` |
| Pages Router para Cloudinary signing | App Router Route Handler | Next.js 13+ | `export async function POST(request: Request)` en lugar de `export default function handler(req, res)` |
| `renderToString` de react-pdf | `renderToBuffer` | react-pdf v3+ | `renderToBuffer` retorna un `Buffer` directamente usable como `Response` body |

**Deprecated/outdated:**
- `experimental.serverComponentsExternalPackages`: Movido a top-level `serverExternalPackages` en Next.js 14.1+. El proyecto usa Next.js 16.2.6 — usar top-level únicamente. [VERIFIED: nextjs.org docs]
- `cloudinary.v2.uploader.upload` desde cliente: Nunca válido para secrets. Solo server-side con firma o unsigned para assets públicos.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | El logo en `/public/logo-horizontal.svg` es accesible como URL pública en producción para usarlo en el template de email con `<Img src="https://dominio/logo-horizontal.svg">` | Code Examples — Pattern 2 | Si el dominio no está configurado, el logo no aparece en el email. Alternativa: base64 inline o URL de Cloudinary |
| A2 | La hoja de Google Sheets ya tiene datos en la columna A comenzando desde la fila 1 (sin fila de headers vacía antes de datos) | Pattern 4 | El índice de fila calculado desde `values.get` podría desfasarse si hay filas de encabezado — necesita ajuste de offset |
| A3 | `resend` permite `from` con dominio personalizado desde el inicio — el DNS ya fue verificado (mencionado en STATE.md como tarea de Phase 1) | Pattern 2 | Si el dominio Resend no está verificado, los emails caen en spam o son rechazados. Verificar en dashboard de Resend antes de ejecutar |

---

## Open Questions

1. **¿`packingList` se agrega al schema Mongoose o se unifica con `otro`?**
   - Lo que sabemos: El UI tiene 6 slots fijos incluyendo "Packing list". El schema tiene 5 + `otro`.
   - Qué es incierto: Si agregar `packingList` al schema es backward-compatible con datos existentes en MongoDB (lo es, dado que Mongoose ignora campos no definidos en documentos anteriores).
   - Recomendación: Agregar `packingList` al schema como campo nuevo en Wave 1 del plan. Bajo riesgo.

2. **¿El email del importador se obtiene de Clerk o de MongoDB User?**
   - Lo que sabemos: CONTEXT.md dice usar `clerkClient().users.getUser(importadorId)`. El modelo `User` en MongoDB también tiene el email.
   - Qué es incierto: Si MongoDB User puede estar desincronizado del email real de Clerk.
   - Recomendación: Usar Clerk como fuente de verdad (más confiable) — `(await clerkClient()).users.getUser(importadorId)` tal como especifica CONTEXT.md.

3. **¿El botón "Exportar PDF" abre en nueva pestaña o descarga directamente?**
   - Lo que sabemos: D-11 dice "botón que descarga el archivo". El `<a download>` descarga directamente.
   - Recomendación: Usar `<a href="/api/oc/[id]/pdf" download>` para forzar descarga sin abrir preview del browser.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | @react-pdf/renderer, googleapis | ✓ | En Vercel (runtime: 'nodejs') | — |
| npm registry | Instalar packages | ✓ | — | — |
| Cloudinary account | DOC-01 | [ASSUMED] | — | Bloqueante — requiere credenciales del cliente |
| Resend account + dominio verificado | NOTIF-01/02 | [ASSUMED] | — | Bloqueante — requiere API key y dominio verificado |
| Google service account + Sheets ID | SHEETS-01 | [ASSUMED] | — | Bloqueante — requiere configuración en Google Cloud Console |

**Missing dependencies with no fallback:**
- Cloudinary credentials (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) — deben estar en `.env.local` antes de ejecutar 06-01
- Resend API key + dominio verificado — deben estar en `.env.local` antes de ejecutar 06-02
- Google service account credentials + Spreadsheet ID — deben estar en `.env.local` antes de ejecutar 06-03

---

## Validation Architecture

> `nyquist_validation: false` en `.planning/config.json` — sección omitida.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (Clerk maneja auth; esta fase no modifica auth) |
| V3 Session Management | no | — |
| V4 Access Control | yes | IDOR guard en `updateOCDocumento` y Route Handler `/api/oc/[id]/pdf` — verificar acceso del userId al OC antes de operar |
| V5 Input Validation | yes | Validar que `slot` sea un keyof válido del schema documentos antes de `$set`; validar `id` de MongoDB antes de query |
| V6 Cryptography | yes | `CLOUDINARY_API_SECRET` y `GOOGLE_PRIVATE_KEY` solo en variables server-side (nunca `NEXT_PUBLIC_`) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR en upload — usuario sube PDF a OC que no le pertenece | Tampering | Verificar `oc.importadorId === userId` O que el userId tenga email en `emailsProveedor`/`emailsDespachante` en `updateOCDocumento` |
| IDOR en PDF export — descargar PDF de OC de otro importador | Information Disclosure | Reusar lógica de acceso de `getOCById` en Route Handler `/api/oc/[id]/pdf` |
| Inyección de slot inválido | Tampering | Whitelist de keys válidas: `['facturaProveedor', 'facturaDespachante', 'conocimientoEmbarque', 'certificadoOrigen', 'certificadoAnalisis', 'packingList', 'otro']` |
| Exposición de API secret Cloudinary | Information Disclosure | Firma solo en Route Handler server-side; nunca en `NEXT_PUBLIC_` |

---

## Sources

### Primary (HIGH confidence)
- [next.cloudinary.dev/clduploadwidget/signed-uploads](https://next.cloudinary.dev/clduploadwidget/signed-uploads) — Pattern firma server-side, env vars requeridas
- [react-pdf.org/node](https://react-pdf.org/node) — API `renderToBuffer` y `renderToStream`
- [react-pdf.org/compatibility](https://react-pdf.org/compatibility) — Requisito `serverExternalPackages`, compatibilidad Next.js
- [resend.com/docs/send-with-nextjs](https://resend.com/docs/send-with-nextjs) — Pattern Server Action + template React Email
- [developers.google.com/workspace/sheets/api/reference/rest/v4](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append) — API Sheets append/update
- npm registry — versiones verificadas en 2026-06-02

### Secondary (MEDIUM confidence)
- [github.com/diegomura/react-pdf/discussions/2402](https://github.com/diegomura/react-pdf/discussions/2402) — Pattern working `renderToBuffer` en Route Handler Next.js 13+
- [github.com/vercel/next.js/discussions/68553](https://github.com/vercel/next.js/discussions/68553) — Restricción React Context en Route Handler con react-pdf
- [nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages) — Configuración top-level (no experimental)

### Tertiary (LOW confidence)
- WebSearch results sobre react-pdf + Next.js 15/16 compatibility — múltiples issues abiertos, solución confirmada via `serverExternalPackages` por múltiples fuentes

---

## Project Constraints (from CLAUDE.md)

| Directiva | Impacto en Phase 6 |
|-----------|-------------------|
| TypeScript strict — sin `any`, sin `as any` | Tipar correctamente `result.info` de `CldUploadWidget` con cast explícito; tipar `paramsToSign` como `Record<string, string>` |
| Server Actions para CRUD; API Routes solo para Cloudinary signing, PDF download, Clerk webhook | Upload signing = API Route ✓; PDF download = API Route ✓; updateOCDocumento = Server Action ✓; sendOCNotification y syncToSheets = helpers internos de Server Actions |
| `export const runtime = 'nodejs'` en routes que usan Mongoose o react-pdf | Route Handler `/api/oc/[id]/pdf` DEBE tener `export const runtime = 'nodejs'` |
| Mongoose singleton global con `maxPoolSize: 5`, `bufferCommands: false` | `updateOCDocumento` llama `connectDB()` como todos los Server Actions existentes |
| `decimal.js` para toda matemática financiera — nunca float nativo | Calcular FOB, Total Gastos, Landed Cost con `wizard-calculations.ts` para el PDF y para Sheets |
| Valores monetarios en MongoDB como enteros (centavos) | `updateOCDocumento` no toca valores monetarios — no aplica aquí |
| Sin comentarios explicativos | Templates React Email y componentes PDF sin comentarios |
| Cloudinary: `resource_type: 'raw'` para PDFs, signed upload via API Route | D-04 ya lo especifica — `options={{ resourceType: 'raw' }}` en CldUploadWidget |
| Google Sheets: `GOOGLE_PRIVATE_KEY` con `.replace(/\\n/g, '\n')` | Mandatorio en `syncToSheets` |
| Fire-and-forget para Resend y Sheets | `void sendOCNotification(...)`, `void syncToSheets(...)` |

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — versiones verificadas en npm registry
- Architecture: HIGH — patrones confirmados en docs oficiales y código existente inspeccionado
- Pitfalls: HIGH — pitfall `packingList`/schema gap verificado con grep del codebase; pitfall `serverExternalPackages` verificado en docs oficiales

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (apis estables; react-pdf tiene issues históricos con versiones de Next.js — re-verificar si Next.js actualiza a 17+)
