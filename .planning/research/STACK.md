# Technology Stack — DrivaOC

**Project:** DrivaOC — Import Purchase Order Management  
**Researched:** 2026-05-24  
**Research mode:** Ecosystem + Feasibility (stack dimension)

---

## 1. Clerk + Next.js App Router — RBAC Patterns

### Recommendation: publicMetadata over Organizations

**Confidence: HIGH** (verified against Clerk official docs via Context7)

Use `publicMetadata.role` (a single string enum) stored on each Clerk user. Do NOT use Clerk Organizations for this project. Organizations are designed for B2B multi-tenant apps where users belong to teams (think GitHub orgs). DrivaOC has a flat, single-tenant structure with three static roles. publicMetadata is simpler, has no overhead, and is the pattern Clerk's own RBAC guide recommends for this case.

**Role enum:**

```typescript
// types/globals.d.ts
export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'importador' | 'proveedor' | 'despachante'
    }
  }
}
```

### Session Token Configuration (Clerk Dashboard)

Navigate to **Dashboard → Sessions → Customize session token** and add:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

This embeds the role in the JWT so `sessionClaims?.metadata?.role` is available in middleware without an extra network call.

### Middleware Pattern (Next.js 15 / App Router)

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isImportadorRoute = createRouteMatcher(['/dashboard/ocs(.*)', '/dashboard/admin(.*)'])
const isProveedorRoute  = createRouteMatcher(['/dashboard/proveedor(.*)'])
const isDespachante     = createRouteMatcher(['/dashboard/despachante(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth()
  const role = sessionClaims?.metadata?.role

  if (isImportadorRoute(req) && role !== 'importador') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
  if (isProveedorRoute(req) && role !== 'proveedor') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
  if (isDespachante(req) && role !== 'despachante') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
```

### Role Check Helper (Server Components / Server Actions)

```typescript
// lib/roles.ts
import { auth } from '@clerk/nextjs/server'

type Role = 'importador' | 'proveedor' | 'despachante'

export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.role === role
}

export async function getRole(): Promise<Role | undefined> {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.role as Role | undefined
}
```

### Setting a Role (Server Action — importador-only admin)

```typescript
// app/admin/_actions.ts
'use server'
import { checkRole } from '@/lib/roles'
import { clerkClient } from '@clerk/nextjs/server'

export async function setUserRole(userId: string, role: string) {
  if (!(await checkRole('importador'))) return { error: 'Not authorized' }
  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  })
}
```

### What NOT to Use

- **Clerk Organizations** — overkill for a fixed 3-role system; adds org membership complexity with no benefit here.
- **privateMetadata for roles** — not exposed to the JWT, requires a backend round-trip on every request.
- **`auth.protect()` with org permissions** — only works with the Organizations system.

### Package

```bash
npm install @clerk/nextjs
```

Current stable: `@clerk/nextjs ^6.x` (verify exact version at install time; major version tracks Next.js compatibility)

---

## 2. MongoDB Atlas + Mongoose — Connection Pooling on Vercel

### Recommendation: Global cached singleton with `maxPoolSize: 5`

**Confidence: HIGH** (verified against Mongoose official docs + multiple 2025-2026 community discussions)

Vercel Serverless Functions are not persistent processes — each warm container reuses its Node.js global scope between requests, but concurrent invocations get separate containers. Without a global cache, each cold start opens a new MongoDB connection and the Atlas free tier (500-connection limit) is exhausted quickly under load.

### Connection Singleton

```typescript
// lib/db.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Extend the global type to store the cache
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
global.mongooseCache = cached

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,              // keep low for Atlas free tier
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,       // fail fast instead of queuing
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
```

### Model Registration Guard (prevent HMR re-registration)

```typescript
// models/OrdenCompra.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IOrdenCompra extends Document {
  numero: string
  proveedor: string
  despachante: string
  proveedorEmail: string
  despachanteEmail: string
  estado: 'borrador' | 'enviada' | 'en_transito' | 'cerrada'
  // ... other fields
  createdAt: Date
  updatedAt: Date
}

const OrdenCompraSchema = new Schema<IOrdenCompra>({
  numero: { type: String, required: true, unique: true },
  proveedor: { type: String, required: true },
  despachante: { type: String, required: true },
  proveedorEmail: { type: String, required: true },    // for email-based matching
  despachanteEmail: { type: String, required: true },  // for email-based matching
  estado: {
    type: String,
    enum: ['borrador', 'enviada', 'en_transito', 'cerrada'],
    default: 'borrador',
  },
}, { timestamps: true })

// Guard against HMR model re-registration
const OrdenCompra: Model<IOrdenCompra> =
  (mongoose.models.OrdenCompra as Model<IOrdenCompra>) ||
  mongoose.model<IOrdenCompra>('OrdenCompra', OrdenCompraSchema)

export default OrdenCompra
```

### Using in Route Handlers / Server Actions

Always include `export const runtime = 'nodejs'` in any route that uses Mongoose. Vercel's Edge Runtime does not support Mongoose's Node.js dependencies.

```typescript
// app/api/ocs/route.ts
export const runtime = 'nodejs'

import { dbConnect } from '@/lib/db'
import OrdenCompra from '@/models/OrdenCompra'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  await dbConnect()
  const { sessionClaims } = await auth()
  const role = sessionClaims?.metadata?.role
  const userEmail = sessionClaims?.email  // or fetch from Clerk user object

  let query = {}
  if (role === 'proveedor') {
    query = { proveedorEmail: userEmail }
  } else if (role === 'despachante') {
    query = { despachanteEmail: userEmail }
  }
  // importador sees all

  const ocs = await OrdenCompra.find(query).lean()
  return NextResponse.json(ocs)
}
```

### What NOT to Use

- **`mongoose.connect()` at module top-level without caching** — creates a new connection on every cold start.
- **Mongoose on Edge Runtime** — will crash; always force `runtime = 'nodejs'`.
- **`maxPoolSize` above 10 on Atlas free tier** — free tier has a 500 total connection limit shared across all serverless instances.

### Package

```bash
npm install mongoose
```

Current stable: `mongoose ^8.x` (latest as of research date: 8.19.x)

---

## 3. Google Sheets API v4 — Service Account Setup

### Recommendation: `googleapis` npm package with JWT auth

**Confidence: HIGH** (Google's official Node.js quickstart; multiple verified 2024-2025 implementations)

The `googleapis` package is the official Google-maintained Node.js client. Use a service account with JWT credentials stored as environment variables (never commit the JSON key file).

### Package

```bash
npm install googleapis
```

The `googleapis` package bundles `google-auth-library` as a peer dependency — no separate install needed.

### Environment Variables

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=driva-oc@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

**Critical:** The private key from the JSON file contains literal `\n` characters. In `.env`, store it as a single string with `\n`. In code, replace `\\n` with `\n`.

### Server Action Pattern

```typescript
// lib/sheets.ts
import { google } from 'googleapis'

export async function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

// Example: append a row when OC is created
export async function appendOCRow(ocData: string[]) {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: 'OCs!A:Z',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [ocData],
    },
  })
}
```

### Setup Checklist

1. Create a project in Google Cloud Console
2. Enable **Google Sheets API** on that project
3. Create a **Service Account** → download JSON key
4. Copy `client_email` and `private_key` from the JSON into env vars
5. Open the target Google Sheet → **Share** it with the service account email (Editor permission)
6. Note the spreadsheet ID from the URL

### Alternative: `google-spreadsheet` (Higher-level wrapper)

```bash
npm install google-spreadsheet google-auth-library
```

Provides a more ergonomic API (`doc.getRows()`, typed cells) but adds a dependency layer. Use `googleapis` directly for full control and to avoid version drift. **Recommended to stick with `googleapis` for this project.**

### What NOT to Use

- **OAuth 2.0 user flow** — requires user consent screens and token refresh; overkill for a backend-only integration.
- **API key authentication** — only works for public sheets; service account is correct for private sheets.
- **Committing the service account JSON file** — store credentials as env vars only.

---

## 4. PDF Generation — `@react-pdf/renderer` vs Puppeteer

### Recommendation: `@react-pdf/renderer` with `renderToBuffer` in a Node.js route handler

**Confidence: HIGH** (official react-pdf docs via Context7 + multiple production comparisons; Vercel serverless constraints are well-documented)

### Decision Matrix

| Criterion | `@react-pdf/renderer` | Puppeteer |
|---|---|---|
| Vercel bundle size | ~2 MB | ~100 MB (Chromium) |
| Vercel function limit | Well within 50 MB | Exceeds limit by default |
| Cold start | <500 ms | 2-5 seconds |
| Styling | Flexbox subset of CSS | Full CSS/HTML |
| Custom fonts | Native support | System fonts only (unreliable in serverless) |
| Latin/special chars | Reliable with bundled font | Depends on server font install |
| Maintenance on Vercel | Zero config | Requires `@sparticuz/chromium-min` + S3-hosted binary |
| React 19 / Next.js 15 | v4.1.0+ compatible | N/A |

**Verdict: `@react-pdf/renderer` wins on every axis for Vercel deployment.**

### Known Issue with Next.js 15 — Required Config

Without this config, `@react-pdf/renderer` will throw ESM import errors in Next.js 15:

```javascript
// next.config.ts
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  // ...
}
export default nextConfig
```

Additionally, any route handler that generates PDFs must declare:

```typescript
export const runtime = 'nodejs'
```

### Route Handler Pattern (Next.js App Router)

```typescript
// app/api/ocs/[id]/pdf/route.ts
export const runtime = 'nodejs'

import { renderToBuffer } from '@react-pdf/renderer'
import { OrdenCompraPDF } from '@/components/pdf/OrdenCompraPDF'
import { dbConnect } from '@/lib/db'
import OrdenCompra from '@/models/OrdenCompra'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  await dbConnect()
  const oc = await OrdenCompra.findById(params.id).lean()
  if (!oc) return new NextResponse('Not found', { status: 404 })

  const buffer = await renderToBuffer(<OrdenCompraPDF oc={oc} />)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="OC-${oc.numero}.pdf"`,
    },
  })
}
```

### PDF Component Structure

```typescript
// components/pdf/OrdenCompraPDF.tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register custom fonts if needed (recommended for Latin characters)
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
})

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', fontSize: 10 },
  header: { fontSize: 20, marginBottom: 20 },
  // ...
})

export function OrdenCompraPDF({ oc }: { oc: IOrdenCompra }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Orden de Compra #{oc.numero}</Text>
        {/* ... */}
      </Page>
    </Document>
  )
}
```

### What NOT to Use

- **Puppeteer / `puppeteer-core` + `@sparticuz/chromium`** — Chromium binary is ~100 MB, exceeds Vercel's 50 MB function limit by default; requires hosting the binary separately in S3 and env-var referencing it. Not worth the operational cost for OC PDFs.
- **`react-pdf` (the PDF viewer library)** — this is the *viewer*, not the generator. Different package entirely.
- **`jsPDF`** — generates PDFs imperatively without React components; less maintainable for structured documents.
- **`PDFDownloadLink` on the server** — client-only component; use `renderToBuffer` for server-side generation.

### Package

```bash
npm install @react-pdf/renderer
npm install -D @types/react-pdf  # if needed; check types are included in main package
```

Current stable: `@react-pdf/renderer ^4.x` (latest at research time: 4.5.1; use 4.1.0+ for React 19 support)

---

## 5. Cloudinary — PDF Upload Configuration

### Recommendation: `resource_type: 'raw'` with `upload_stream` for server-side buffers

**Confidence: HIGH** (Cloudinary official Node.js SDK docs via Context7 + official Cloudinary PDF guide)

Cloudinary treats PDFs as `raw` resources. If you upload with `resource_type: 'image'` or `'auto'`, Cloudinary may attempt image-specific processing and fail. Use `'raw'` explicitly.

### Configuration

```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }
```

### Upload a PDF Buffer (from `renderToBuffer`)

```typescript
// lib/uploadPDF.ts
import { cloudinary } from './cloudinary'

export function uploadPDFBuffer(
  buffer: Buffer,
  options: { publicId: string; folder?: string }
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',           // REQUIRED for PDFs
        public_id: options.publicId,
        folder: options.folder ?? 'ocs',
        overwrite: true,
        format: 'pdf',
      },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve({ secure_url: result.secure_url, public_id: result.public_id })
      }
    )
    stream.end(buffer)
  })
}
```

### Combined PDF Generation + Upload

```typescript
// In a server action or route handler
const buffer = await renderToBuffer(<OrdenCompraPDF oc={oc} />)
const { secure_url } = await uploadPDFBuffer(buffer, {
  publicId: `oc-${oc.numero}-${oc._id}`,
  folder: 'ocs',
})
// Store secure_url in MongoDB document
await OrdenCompra.findByIdAndUpdate(oc._id, { pdfUrl: secure_url })
```

### What NOT to Use

- **`resource_type: 'image'`** — Cloudinary will attempt image conversions on the PDF and may fail or produce unexpected results.
- **`resource_type: 'auto'`** — unpredictable for PDFs; sometimes detected as image, sometimes raw. Be explicit.
- **Storing PDFs in a public Cloudinary folder without access control** — if OC PDFs are sensitive, use signed URLs or authenticated delivery. Consider a private delivery type.
- **`next-cloudinary`** — this package is for image optimization components in React; not needed for server-side PDF uploads.

### Environment Variables

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Package

```bash
npm install cloudinary
```

Current stable: `cloudinary ^2.x`

---

## 6. Resend — Transactional Email

### Recommendation: Route Handler pattern with React Email templates

**Confidence: HIGH** (Resend official docs via Context7; well-documented Next.js App Router integration)

Resend is the cleanest transactional email API for Next.js. Pair it with `@react-email/components` to write email templates as React components with a live preview server.

### Packages

```bash
npm install resend @react-email/components
```

### Environment Variable

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

The `from` address must use a domain you've verified in the Resend dashboard. During development, use `onboarding@resend.dev` as a fallback sender.

### Email Template

```typescript
// emails/OcNotificacion.tsx
import {
  Html, Head, Body, Container, Heading, Text, Section
} from '@react-email/components'

interface Props {
  numeroOC: string
  destinatario: string
  estado: string
}

export function OcNotificacion({ numeroOC, destinatario, estado }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Heading>Orden de Compra #{numeroOC}</Heading>
          <Text>Hola {destinatario},</Text>
          <Text>
            La OC #{numeroOC} ha sido actualizada al estado: <strong>{estado}</strong>.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### Route Handler (App Router)

```typescript
// app/api/email/oc-notification/route.ts
export const runtime = 'nodejs'

import { Resend } from 'resend'
import { OcNotificacion } from '@/emails/OcNotificacion'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { numeroOC, destinatario, email, estado } = await req.json()

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
    to: [email],
    subject: `OC #${numeroOC} — Estado actualizado`,
    react: OcNotificacion({ numeroOC, destinatario, estado }),
  })

  if (error) {
    return Response.json({ error }, { status: 500 })
  }

  return Response.json(data)
}
```

### Server Action Pattern (alternative to route handler)

```typescript
// app/ocs/_actions.ts
'use server'
import { Resend } from 'resend'
import { OcNotificacion } from '@/emails/OcNotificacion'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function notificarCambioEstado(
  email: string,
  destinatario: string,
  numeroOC: string,
  estado: string
) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: [email],
    subject: `OC #${numeroOC} — ${estado}`,
    react: OcNotificacion({ numeroOC, destinatario, estado }),
  })
}
```

### What NOT to Use

- **Nodemailer** — fine but requires SMTP credentials management; Resend's API is simpler and has better deliverability out of the box.
- **`resend.emails.send()` from client components** — leaks the API key. Always call from Server Actions or Route Handlers.
- **HTML strings instead of React Email** — harder to maintain and preview; React Email's `npx react-email dev` preview server is a significant DX win.

---

## Complete Package Summary

```bash
# Auth
npm install @clerk/nextjs

# Database
npm install mongoose

# Google Sheets
npm install googleapis

# PDF Generation
npm install @react-pdf/renderer

# File Storage
npm install cloudinary

# Email
npm install resend @react-email/components

# TypeScript types (may already be bundled)
npm install -D @types/node
```

### next.config.ts Required Additions

```typescript
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  // Add mongoose if Edge runtime conflicts surface:
  // serverExternalPackages: ['@react-pdf/renderer', 'mongoose'],
}
export default nextConfig
```

---

## Alternatives Considered and Rejected

| Category | Recommended | Rejected | Reason |
|---|---|---|---|
| RBAC | Clerk publicMetadata | Clerk Organizations | Organizations are for B2B multi-tenant; overkill for 3 static roles |
| PDF Generator | @react-pdf/renderer | Puppeteer | Puppeteer's Chromium (~100 MB) exceeds Vercel's 50 MB function limit |
| PDF Generator | @react-pdf/renderer | jsPDF | jsPDF is imperative; React components are more maintainable for complex layouts |
| Google Sheets | googleapis (official) | google-spreadsheet | Adds unnecessary abstraction; `googleapis` is official and stable |
| Email | Resend + React Email | Nodemailer | Nodemailer needs SMTP config; Resend is API-first with better DX |
| PDF Upload | cloudinary `resource_type: 'raw'` | `resource_type: 'auto'` | `auto` is unpredictable for PDFs; `raw` is explicit and correct |
| DB connection | Global cached singleton | Per-request `mongoose.connect()` | Per-request connect exhausts Atlas free tier connection limits |

---

## Required Environment Variables Summary

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/drivaoc?retryWrites=true&w=majority

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## Confidence Assessment

| Area | Confidence | Basis |
|---|---|---|
| Clerk RBAC / publicMetadata | HIGH | Clerk official docs (Context7), Clerk's own RBAC guide |
| Mongoose connection pooling | HIGH | Mongoose official Next.js docs (Context7), 2025-2026 community consensus |
| Google Sheets googleapis | HIGH | Google official Node.js quickstart, multiple verified 2024-2025 examples |
| @react-pdf/renderer on Vercel | HIGH | Official react-pdf docs (Context7), production comparison analysis |
| react-pdf/renderer Next.js 15 config | MEDIUM | Confirmed working config (serverExternalPackages); active GitHub issues for edge cases in v4.1-4.5 — test at setup |
| Cloudinary PDF upload | HIGH | Cloudinary official docs (Context7) + official PDF upload guide |
| Resend + React Email | HIGH | Resend official docs (Context7), straightforward integration |

---

## Sources

- [Clerk RBAC with metadata — official guide](https://clerk.com/docs/guides/secure/basic-rbac)
- [Clerk clerkMiddleware() reference](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Clerk RBAC in Next.js 15 — official blog](https://clerk.com/blog/nextjs-role-based-access-control)
- [Mongoose — Using with Next.js (official)](https://mongoosejs.com/docs/nextjs.html)
- [Mongoose — Connections & Pooling (official)](https://mongoosejs.com/docs/connections.html)
- [MongoDB connection limits on Vercel serverless](https://www.mongodb.com/community/forums/t/large-number-of-connections-with-mongoose-and-vercel/204917)
- [Google Sheets API Node.js quickstart (official)](https://developers.google.com/workspace/sheets/api/quickstart/nodejs)
- [react-pdf compatibility (official)](https://react-pdf.org/compatibility)
- [react-pdf Next.js 15 example](https://github.com/diegomura/react-pdf/blob/master/packages/examples/next-15/README.md)
- [Cloudinary PDF upload guide (official)](https://cloudinary.com/documentation/ts_how_to_upload_manage_and_deliver_pdf_files)
- [Cloudinary Node.js SDK docs](https://cloudinary.com/documentation/node_integration)
- [Resend — Send with Next.js (official)](https://resend.com/docs/send-with-nextjs)
- [Next.js serverExternalPackages config (official)](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages)
- [PDF generation comparison: Puppeteer vs react-pdf (production)](https://dev.to/iurii_rogulia/pdf-generation-on-the-server-puppeteer-vs-react-pdfrenderer-a-production-comparison-44cg)
