# Architecture Patterns — DrivaOC

**Domain:** Purchase Order Management System (multi-role)
**Researched:** 2026-05-24
**Overall confidence:** HIGH (Next.js/Clerk/MongoDB patterns verified against official docs and current sources)

---

## 1. Next.js App Router Route Groups — Role-Based Layouts

### Decision: Use Route Groups for Separate Layout Trees

Route groups (`(folderName)`) are excluded from the URL path and allow completely separate `layout.tsx` files per role. This is the correct primitive for DrivaOC's three distinct UI shells.

**Confidence: HIGH** — verified against Next.js official docs (v16.2.6, updated 2026-05-19).

### Folder Structure — App Directory

```
app/
├── layout.tsx                      ← Root layout (Clerk provider, fonts, global CSS only)
│
├── (auth)/                         ← Route group: unauthenticated pages
│   ├── layout.tsx                  ← Minimal layout (centered card, no nav)
│   ├── sign-in/
│   │   └── page.tsx
│   ├── sign-up/
│   │   └── page.tsx
│   └── onboarding/
│       └── page.tsx                ← Role selection after first sign-up
│
├── (importador)/                   ← Route group: importador shell
│   ├── layout.tsx                  ← Sidebar layout (AppShell with sidebar nav)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── oc/
│   │   ├── nueva/
│   │   │   ├── page.tsx            ← Step 1 (drafts new OC)
│   │   │   └── [id]/
│   │   │       └── completar/
│   │   │           └── page.tsx    ← Step 2 (completes draft OC)
│   │   └── [id]/
│   │       └── page.tsx            ← OC detail view (importador)
│   └── perfil/
│       └── page.tsx
│
├── (proveedor)/                    ← Route group: proveedor shell
│   ├── layout.tsx                  ← Navbar-only layout
│   ├── dashboard/
│   │   └── page.tsx
│   └── oc/
│       └── [id]/
│           └── page.tsx            ← Read-only OC detail
│
├── (despachante)/                  ← Route group: despachante shell
│   ├── layout.tsx                  ← Navbar-only layout (same component as proveedor)
│   ├── dashboard/
│   │   └── page.tsx
│   └── oc/
│       └── [id]/
│           └── page.tsx            ← Read-only OC detail
│
└── api/
    ├── sign-cloudinary-params/
    │   └── route.ts                ← Signs Cloudinary upload requests
    ├── webhooks/
    │   └── clerk/
    │       └── route.ts            ← Clerk webhook (user.created → set role)
    └── pdf/
        └── [id]/
            └── route.ts            ← PDF generation endpoint (route handler, not SA)
```

### Key Caveat: Multiple Root Layouts

If you define `layout.tsx` in each route group instead of a single top-level `layout.tsx`, Next.js treats each as a **root layout** and triggers a full page reload on cross-group navigation. This is acceptable for DrivaOC because:
- Importador never navigates to proveedor routes in normal flow
- The root `app/layout.tsx` should still exist and wrap `<html><body>` with ClerkProvider and fonts; each group layout adds only the shell chrome (sidebar or navbar)

**Pattern:** Keep `app/layout.tsx` as the true root (HTML shell + ClerkProvider). Group layouts add role-specific chrome only — do not redeclare `<html><body>` in them.

```tsx
// app/layout.tsx — true root
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="font-fira-sans bg-[#FFF7ED]">{children}</body>
      </html>
    </ClerkProvider>
  );
}

// app/(importador)/layout.tsx — adds sidebar chrome only
export default function ImportadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

// app/(proveedor)/layout.tsx — adds navbar chrome only
export default function ProveedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## 2. Clerk Middleware — Role-Based Route Protection

### Architecture: Three-Layer Defense

Production-grade Clerk RBAC uses three layers that complement each other:

```
Request
  │
  ▼
┌─────────────────────────────────────────┐
│  Layer 1: middleware.ts (Edge)          │  ← Broad auth check + role redirect
│  - Is user authenticated?               │
│  - Does role match the route group?     │
│  - Redirect if mismatch                 │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│  Layer 2: layout.tsx (Server Component) │  ← Granular check per layout
│  - Re-verify role from auth()           │
│  - Redirect if wrong shell is accessed  │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│  Layer 3: Server Actions / API routes   │  ← Last-line defense
│  - Re-verify on every mutation          │
│  - Never trust client-side role claims  │
└─────────────────────────────────────────┘
```

**Confidence: HIGH** — Clerk official docs confirm this three-layer approach.

### Step 1: Expose Role in Session Token (Clerk Dashboard)

Navigate to Clerk Dashboard → Sessions → Customize session token → add:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

This makes `publicMetadata.role` available in `sessionClaims` inside middleware without a network round-trip. Without this, middleware would have to make a backend API call to fetch the user on every request.

### Step 2: middleware.ts

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isImportadorRoute = createRouteMatcher(["/dashboard(.*)", "/oc(.*)", "/perfil(.*)"]);
const isProveedorRoute  = createRouteMatcher(["/proveedor(.*)"]);
const isDespachRoute    = createRouteMatcher(["/despachante(.*)"]);
const isPublicRoute     = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Unauthenticated → sign-in
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Authenticated but no role yet → onboarding
  if (userId && !role && !req.nextUrl.pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Role-based route guard
  if (userId && role) {
    if (isImportadorRoute(req) && role !== "importador") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isProveedorRoute(req) && role !== "proveedor") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isDespachRoute(req) && role !== "despachante") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
```

### Step 3: checkRole Helper

```typescript
// lib/auth/checkRole.ts
import { auth } from "@clerk/nextjs/server";

type Role = "importador" | "proveedor" | "despachante";

export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as { role?: string })?.role === role;
}

// Usage in Server Actions and layout.tsx:
// if (!(await checkRole("importador"))) redirect("/dashboard");
```

### Onboarding Flow (Role Assignment)

On first sign-up, route the user to `/onboarding`. This page calls a Server Action that uses `clerkClient().users.updateUser(userId, { publicMetadata: { role } })` to set the role. After that, Clerk's session token is refreshed and middleware re-evaluates correctly.

---

## 3. MongoDB OC Document Schema

### Decision: Hybrid Embedded + Referenced

**Rule applied:** Embed data that is always fetched together with the OC. Reference data that has its own lifecycle or is shared across OCs.

**Confidence: HIGH** — consistent with MongoDB Atlas official schema design patterns for order management use cases.

### OC Document (Embedded Everything — Justified)

```typescript
// types/oc.types.ts

interface Producto {
  descripcion: string;
  cantidad: number;
  precioUnitarioUSD: number;
  totalUSD: number;           // calculated: cantidad * precioUnitarioUSD
}

interface GastosImportacion {
  despacho: number;           // USD
  despachante: number;        // USD
  adicionales: number;        // USD
  otros: number;              // USD
  totalUSD: number;           // sum of above
}

interface DocumentoAdjunto {
  nombre: string;
  url: string;                // Cloudinary URL
  publicId: string;           // Cloudinary public_id (for deletion)
  subidoEn: Date;
}

interface OC {
  _id: ObjectId;

  // General info (Step 1)
  numeroOC: string;           // e.g. "OC-2026-001" — auto-generated
  estado: "borrador" | "en_transito" | "en_aduana" | "entregada";
  fechaCreacion: Date;
  fechaActualizacion: Date;

  // Roles (Step 1)
  importadorId: string;       // Clerk userId
  proveedorEmail: string;     // matched at login
  despachantEmail: string;    // matched at login

  // Products (Step 1)
  productos: Producto[];
  totalFOBusd: number;        // sum of productos[].totalUSD

  // Expenses (Step 2)
  gastos: GastosImportacion;
  tipoCambio: number;         // ARS per USD, entered manually

  // Computed totals (Step 2 — saved to DB)
  totalLandedUSD: number;     // totalFOBusd + gastos.totalUSD
  totalLandedARS: number;     // totalLandedUSD * tipoCambio

  // Documents (Step 2)
  documentos: DocumentoAdjunto[];

  // Metadata
  notasInternas: string;
}
```

### Why Embed (Not Reference) for This Domain

| Data | Decision | Rationale |
|------|----------|-----------|
| `productos[]` | **Embed** | Products exist only in this OC context; queried 100% of the time with the OC; bounded array (rarely >50 items) |
| `gastos{}` | **Embed** | Single object, always read together with OC; no independent lifecycle |
| `documentos[]` | **Embed** | URLs are OC-specific; bounded (rarely >10 docs per OC); Cloudinary holds the actual file |
| `proveedorEmail` | **Embed as string** | For v1 single-tenant: email match is simpler than a join; proveedor is not a first-class entity with its own evolving data |
| `importadorId` | **Reference (string)** | Links to Clerk user; use for filtering, not for embedding user profile |

**Document size risk:** A typical OC with 30 products and 5 documents stays well under MongoDB's 16 MB BSON limit. No concern for this domain.

### Users Collection (Separate — Referenced)

```typescript
// Minimal — Clerk is the source of truth for user profile
interface User {
  _id: ObjectId;
  clerkId: string;            // Clerk userId — unique index
  email: string;              // for email matching queries
  role: "importador" | "proveedor" | "despachante";
  nombre: string;
  creadoEn: Date;
}
```

**Index strategy:**
- `oc.importadorId` — index (filter dashboard by owner)
- `oc.proveedorEmail` — index (proveedor login → find their OCs)
- `oc.despachantEmail` — index (despachante login → find their OCs)
- `oc.estado` — index (filter by status)
- `user.clerkId` — unique index

### Mongoose Connection — Singleton Pattern for Vercel Serverless

```typescript
// lib/db/mongoose.ts
import mongoose from "mongoose";

declare global {
  // Preserve connection across hot reloads in dev
  var mongoose: { conn: typeof import("mongoose") | null; promise: Promise<typeof import("mongoose")> | null };
}

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

Call `await connectDB()` at the top of every Server Action and API route. The cached connection prevents new connections per serverless invocation (Vercel reuses warm instances, but cannot share state across cold starts — pooling mitigates this at the Atlas level).

---

## 4. Server Actions vs API Routes — Decision Matrix

### Recommendation: Server Actions for CRUD, Route Handlers for Special Cases

**Confidence: HIGH** — confirmed by Next.js official guidance and Vercel's own documentation.

| Operation | Mechanism | Reason |
|-----------|-----------|--------|
| Create OC (Step 1) | Server Action | Form mutation, internal only, no external consumer |
| Update OC (Step 2) | Server Action | Same rationale |
| List OCs (dashboard) | Server Component fetch | Direct DB query in RSC, no action needed |
| Get OC detail | Server Component fetch | Same |
| Delete OC | Server Action | Mutation, internal |
| Send email (Resend) | Server Action (called from Step 2 SA) | Triggered by OC creation, internal |
| Sync to Google Sheets | Server Action | Triggered by importador button, internal |
| Sign Cloudinary params | **API Route** (`/api/sign-cloudinary-params`) | Client-side widget calls this via HTTP; not a form submission |
| Generate PDF download | **API Route** (`/api/pdf/[id]`) | Needs to stream binary response; Server Actions cannot stream binary to trigger browser download |
| Clerk webhooks | **API Route** (`/api/webhooks/clerk`) | External HTTP POST from Clerk infrastructure |

### Server Action Pattern

```typescript
// app/(importador)/oc/nueva/_actions/createOCDraft.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/mongoose";
import { OCModel } from "@/lib/db/models/oc.model";
import { redirect } from "next/navigation";
import { checkRole } from "@/lib/auth/checkRole";

export async function createOCDraft(formData: FormData) {
  // Layer 3 auth check — never trust route group alone
  if (!(await checkRole("importador"))) {
    throw new Error("Unauthorized");
  }

  const { userId } = await auth();
  await connectDB();

  const oc = await OCModel.create({
    importadorId: userId,
    estado: "borrador",
    productos: JSON.parse(formData.get("productos") as string),
    // ...
  });

  redirect(`/oc/${oc._id}/completar`);
}
```

### Vercel Serverless Constraints

| Limit | Hobby | Pro |
|-------|-------|-----|
| Default timeout | 10s | 15s |
| Max configurable timeout | 10s | 300s (5 min) |
| Max bundle size | 250 MB uncompressed | 250 MB |

**Export `maxDuration` for slow routes:**
```typescript
// app/api/pdf/[id]/route.ts
export const maxDuration = 60; // seconds — requires Pro plan for >10s
```

PDF generation and Google Sheets sync are the only routes likely to exceed 10s. Both should export `maxDuration = 30` as a safety margin.

---

## 5. Two-Step OC Wizard — State Management

### Decision: DB Draft Pattern (Not URL Params, Not Client State)

**Rationale:** The wizard spans two separate page navigations. Client state (useState, Zustand) is lost on navigation between `/nueva` and `/[id]/completar`. URL params can hold step index but not the full product table. The only reliable and crash-safe solution is saving a `"borrador"` document to MongoDB at Step 1 and completing it at Step 2.

**Confidence: HIGH** — this is the canonical pattern for multi-step wizards where data must survive page transitions.

### Data Flow

```
Step 1 Page (/oc/nueva)
  │
  ├─ Client: ProductTable (useState for product rows, ARS calculations)
  ├─ Client: Form fields (proveedor email, despachante email, numero OC)
  │
  └─ [Submit] → Server Action: createOCDraft(formData)
       │  - Validates role
       │  - Saves OC to MongoDB with estado: "borrador"
       │  - Returns new OC._id
       └─ redirect("/oc/[id]/completar")

Step 2 Page (/oc/[id]/completar)
  │
  ├─ Server Component: fetches OC draft from DB (shows Step 1 data read-only)
  ├─ Client: ExpensesForm (gastos, tipoCambio)
  ├─ Client: CloudinaryUploader (documents)
  │
  └─ [Completar] → Server Action: completeOC(id, formData)
       │  - Validates role + ownership (oc.importadorId === userId)
       │  - Updates OC: gastos, documentos, totalLandedUSD/ARS
       │  - Sets estado: "en_transito"
       │  - Calls sendNotificationEmails(oc) (Resend)
       └─ redirect("/dashboard")
```

### Why Not URL Params?

URL params work well for filter state (page number, sort direction) but not for a 20-field product table. They produce ugly URLs, have size limits, and are visible/editable by users.

### Why Not Zustand?

Zustand client state is in-memory: a hard refresh, browser tab close, or navigation away loses all data. For a business document creation flow this is unacceptable. Intermediate DB save is the correct choice.

### Step Progress Indicator

Use the OC's `estado` field and the URL to determine progress — no additional state needed:

```
/oc/nueva           → Step 1 (no draft exists yet)
/oc/[id]/completar  → Step 2 (draft exists in DB)
/oc/[id]            → Completed OC detail
```

---

## 6. Cloudinary Upload Widget — Client Component Pattern

### Decision: CldUploadWidget (Client Component) + Server Action Callback

**Confidence: HIGH** — confirmed by Cloudinary official docs and next-cloudinary package docs.

The upload widget runs entirely in the browser (JS popup). It cannot be a Server Component. The signed upload flow requires a `/api/sign-cloudinary-params` route handler.

### Architecture

```
Client: <DocumentUploader /> (Client Component)
  │
  ├─ Renders <CldUploadWidget> from "next-cloudinary"
  │   ├─ signatureEndpoint="/api/sign-cloudinary-params"
  │   └─ onSuccess={(result) => handleUploadSuccess(result)}
  │
  └─ onSuccess callback:
       ├─ Extracts { secure_url, public_id } from result.info
       └─ Calls Server Action: saveDocumentToOC(ocId, { url, publicId, nombre })
            └─ Updates oc.documentos[] in MongoDB
```

### Signing Endpoint (API Route — not Server Action)

```typescript
// app/api/sign-cloudinary-params/route.ts
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { paramsToSign } = body;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return Response.json({ signature });
}
```

**Why API Route here:** The Cloudinary widget makes an HTTP request from the browser to get a signature. Server Actions are not callable via arbitrary HTTP requests from third-party widgets — they require Next.js's internal invocation protocol.

### File Type Restriction

Cloudinary's widget supports `resourceType: "raw"` for PDFs. Set this in the widget config:

```tsx
<CldUploadWidget
  uploadPreset="driva_oc_docs"
  options={{
    resourceType: "raw",
    clientAllowedFormats: ["pdf"],
    maxFileSize: 10_000_000, // 10 MB
  }}
  signatureEndpoint="/api/sign-cloudinary-params"
  onSuccess={handleSuccess}
>
  {({ open }) => <button onClick={() => open()}>Subir PDF</button>}
</CldUploadWidget>
```

---

## 7. PDF Export — Route Handler with @react-pdf/renderer

### Decision: API Route Handler, not Server Action

**Rationale:** Downloading binary data from a Server Action is non-trivial and not officially supported as a browser download trigger. A Route Handler can return `new Response(pdfBuffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment" } })` which the browser handles natively.

**Confidence: MEDIUM** — react-pdf/renderer has known App Router compatibility issues in older Next.js versions. Fixed as of Next.js 14.1.1. Verify version is ≥14.1.1 before using.

```typescript
// app/api/pdf/[id]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { OCDocument } from "@/components/pdf/OCDocument";
import { auth } from "@clerk/nextjs/server";
import { getOCById } from "@/lib/db/queries/oc.queries";

export const maxDuration = 30;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const oc = await getOCById(params.id);
  if (!oc) return new Response("Not found", { status: 404 });

  // Verify ownership or allowed role
  const buffer = await renderToBuffer(<OCDocument oc={oc} />);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="OC-${oc.numeroOC}.pdf"`,
    },
  });
}
```

### Puppeteer Alternative (If react-pdf is Insufficient)

Use `@sparticuz/chromium-min` + `puppeteer-core` for pixel-perfect HTML→PDF if the OC layout is too complex for react-pdf's layout engine. This requires `maxDuration = 60` and works on Vercel Pro. Avoid on Hobby plan (10s limit makes Puppeteer cold-start too risky).

---

## 8. Google Sheets + Resend — Server Action Integration

### Both are pure Server Action territory (no API route needed)

```typescript
// lib/integrations/googleSheets.ts
import { google } from "googleapis";

export async function syncOCToSheets(oc: OC) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "OCs!A:Z",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [oc.numeroOC, oc.estado, oc.totalFOBusd, oc.totalLandedUSD, ...],
      ],
    },
  });
}
```

```typescript
// lib/integrations/resend.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendOCNotification(oc: OC) {
  const emails = [oc.proveedorEmail, oc.despachantEmail].filter(Boolean);
  if (emails.length === 0) return;

  await resend.emails.send({
    from: "DrivaOC <noreply@drivadev.com.ar>",
    to: emails,
    subject: `Nueva OC asignada: ${oc.numeroOC}`,
    html: `<p>Se te ha asignado la orden de compra <strong>${oc.numeroOC}</strong>. Ingresá a DrivaOC para verla.</p>`,
  });
}
```

Both functions are called from inside the `completeOC` Server Action — no API routes required. The `"use server"` directive ensures the API keys never reach the client bundle.

---

## 9. Recommended Full Folder Structure

```
drivaoc/
├── app/
│   ├── layout.tsx                        ← Root: ClerkProvider, html, body, fonts
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (importador)/
│   │   ├── layout.tsx                    ← Sidebar shell
│   │   ├── dashboard/page.tsx
│   │   ├── oc/
│   │   │   ├── nueva/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _actions/createOCDraft.ts
│   │   │   └── [id]/
│   │   │       ├── page.tsx              ← Detail view
│   │   │       └── completar/
│   │   │           ├── page.tsx
│   │   │           └── _actions/completeOC.ts
│   │   └── perfil/page.tsx
│   ├── (proveedor)/
│   │   ├── layout.tsx                    ← Navbar shell
│   │   ├── dashboard/page.tsx
│   │   └── oc/[id]/page.tsx
│   ├── (despachante)/
│   │   ├── layout.tsx                    ← Navbar shell (reuses proveedor component)
│   │   ├── dashboard/page.tsx
│   │   └── oc/[id]/page.tsx
│   └── api/
│       ├── sign-cloudinary-params/route.ts
│       ├── pdf/[id]/route.ts
│       └── webhooks/clerk/route.ts
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                   ← Importador sidebar nav
│   │   ├── Navbar.tsx                    ← Proveedor/despachante topnav
│   │   └── Footer.tsx                    ← "Desarrollado por Driva Dev"
│   ├── oc/
│   │   ├── Step1Form.tsx                 ← Client: product table, general info
│   │   ├── Step2Form.tsx                 ← Client: expenses, TC, document upload
│   │   ├── OCTable.tsx                   ← Dashboard OC list
│   │   ├── OCDetail.tsx                  ← Read-only detail view (shared)
│   │   └── OCStatusBadge.tsx
│   ├── pdf/
│   │   └── OCDocument.tsx                ← react-pdf component tree
│   └── ui/
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Input.tsx
│       └── Modal.tsx
│
├── lib/
│   ├── auth/
│   │   └── checkRole.ts
│   ├── db/
│   │   ├── mongoose.ts                   ← Singleton connection
│   │   ├── models/
│   │   │   ├── oc.model.ts
│   │   │   └── user.model.ts
│   │   └── queries/
│   │       ├── oc.queries.ts
│   │       └── user.queries.ts
│   ├── integrations/
│   │   ├── cloudinary.ts                 ← Server-side Cloudinary utils
│   │   ├── googleSheets.ts
│   │   └── resend.ts
│   └── utils/
│       ├── formatCurrency.ts
│       └── generateOCNumber.ts
│
├── types/
│   └── oc.types.ts
│
├── middleware.ts                          ← Clerk route protection
├── next.config.ts
├── tailwind.config.ts
└── .env.local
```

---

## 10. Data Flow — Complete System View

```
Browser (Client)
  │
  ├── RSC (Server Component pages)
  │     └── Direct DB queries via lib/db/queries/*.ts
  │           └── connectDB() → Mongoose → MongoDB Atlas
  │
  ├── Client Components
  │     ├── Step1Form → createOCDraft (Server Action)
  │     ├── Step2Form → completeOC (Server Action)
  │     │               ├── updateOC (MongoDB)
  │     │               ├── sendOCNotification (Resend)
  │     │               └── [optional] syncOCToSheets (Sheets API)
  │     └── CldUploadWidget
  │           ├── GET /api/sign-cloudinary-params → sign params
  │           └── POST to Cloudinary CDN (direct from browser)
  │                 └── onSuccess → saveDocumentToOC (Server Action) → MongoDB
  │
  └── Browser fetch
        ├── GET /api/pdf/[id] → renderToBuffer → PDF download
        └── Clerk widget → /sign-in, /sign-up
```

---

## 11. Build Order Recommendation

The architecture has these hard dependencies:

```
Clerk + Middleware → Route Groups + Layouts → DB + Models → Server Actions → UI Components → Integrations
```

### Recommended Phase Sequence

| Phase | What | Why First |
|-------|------|-----------|
| 1 | Next.js project init, Tailwind, fonts, Clerk setup, middleware.ts, route groups skeleton, onboarding flow | Auth gate must exist before any page; route groups define URL structure |
| 2 | MongoDB models (OC, User), Mongoose singleton, basic CRUD queries | DB layer used by all Server Actions |
| 3 | Step 1 form: product table, general info, createOCDraft Server Action, redirect to Step 2 | Core business flow — Step 2 depends on draft existing |
| 4 | Step 2 form: expenses, Cloudinary upload widget + sign endpoint, completeOC Server Action, Resend email | Completes the OC creation loop |
| 5 | Dashboard (RSC): OC list for importador; read-only detail for proveedor/despachante | Requires OC data to exist |
| 6 | PDF export route handler, Google Sheets sync Server Action | Add-ons that depend on completed OC |
| 7 | UI polish, error states, loading skeletons, SEO meta, responsive audit | Last because it requires stable page structure |

---

## 12. Critical Architecture Decisions Summary

| Decision | Choice | Alternative Considered | Rationale |
|----------|--------|----------------------|-----------|
| Role shell separation | Route groups `(importador)` `(proveedor)` `(despachante)` | Single layout with conditional rendering | Route groups give true layout isolation; conditional layout is fragile and leaks chrome |
| Clerk role storage | `publicMetadata.role` + session token claim | JWT template / Clerk Organizations | Organizations adds unnecessary complexity for a 3-role single-tenant app; publicMetadata with session claim is the official recommended pattern |
| OC schema | Embedded products, expenses, documents | Normalized separate collections | Always fetched together; bounded arrays; single atomic write per OC update |
| Multi-step state | DB draft (`estado: "borrador"`) | Zustand, URL params, cookie session | Only option that survives page navigation, tab close, hard refresh — required for a business form |
| PDF upload | Cloudinary CldUploadWidget (client) + sign endpoint | Server-side upload via Server Action | Widget must run client-side; signed upload is the secure pattern |
| PDF export | `@react-pdf/renderer` via Route Handler | Puppeteer | react-pdf has no browser dependency (works on Vercel Hobby); Puppeteer exceeds Hobby timeout |
| Mutations (CRUD) | Server Actions | API Routes | Internal mutations have no external consumers; SA reduces boilerplate and keeps logic server-side |
| External endpoints | API Routes (Cloudinary sign, PDF download, Clerk webhook) | Server Actions | Binary responses, external HTTP callers, and third-party webhooks require true HTTP endpoints |

---

## Sources

- [Next.js Route Groups — Official Docs](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — v16.2.6, verified 2026-05-19
- [Clerk RBAC with publicMetadata](https://clerk.com/docs/guides/secure/basic-rbac) — official Clerk docs
- [clerkMiddleware() reference](https://clerk.com/docs/reference/nextjs/clerk-middleware) — official Clerk SDK reference
- [Clerk Role-Based Access Control in Next.js 15](https://clerk.com/blog/nextjs-role-based-access-control) — official Clerk blog
- [CldUploadWidget — next-cloudinary](https://next.cloudinary.dev/clduploadwidget/basic-usage) — official next-cloudinary docs
- [Cloudinary Next.js App Router upload](https://cloudinary.com/blog/cloudinary-image-uploads-using-nextjs-app-router) — official Cloudinary blog
- [react-pdf Next.js App Router starter](https://github.com/react-pdf-dev/starter-rp-nextjs-app-router-js) — official react-pdf starter
- [PDF generation in Next.js — PDF4.dev](https://pdf4.dev/blog/pdf-generation-nextjs) — comprehensive guide
- [Server Actions vs API Routes](https://johnkavanagh.co.uk/articles/when-to-use-server-actions-vs-api-routes-in-nextjs/) — practical comparison
- [MongoDB embedded vs referenced — OneUptime](https://oneuptime.com/blog/post/2025-12-15-how-to-choose-between-embedding-and-referencing-in-mongodb/view) — schema design guide
- [MongoDB connection pooling serverless](https://oneuptime.com/blog/post/2026-03-31-mongodb-how-to-handle-connection-pooling-in-serverless-with-mongodb/view) — serverless patterns
- [Vercel function limits](https://vercel.com/docs/functions/limitations) — official Vercel docs
- [Vercel function duration config](https://vercel.com/docs/functions/configuring-functions/duration) — official Vercel docs
- [Resend + Next.js Server Actions](https://resend.com/nextjs) — official Resend docs
- [Google Sheets + Next.js Server Actions](https://dev.to/julimancan/use-nextjs-14-app-router-to-store-subscriber-info-in-google-sheets-for-free-4jea) — DEV Community guide
