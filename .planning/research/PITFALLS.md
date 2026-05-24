# Domain Pitfalls — DrivaOC

**Domain:** Purchase order management SaaS (importers/suppliers/customs agents)
**Stack:** Next.js App Router + TypeScript + MongoDB Atlas + Clerk + Cloudinary + Resend + Google Sheets API
**Researched:** 2026-05-24

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or security breaches.

---

### Pitfall 1: Clerk Middleware Matcher Misses Routes — Silent Auth Bypass

**What goes wrong:**
`clerkMiddleware()` only runs on requests that match the middleware `matcher` pattern. If any app route (API route handler, page, or route group) falls outside the matcher, `auth()` called inside that route throws "auth() was called but Clerk can't detect usage of clerkMiddleware()". Worse: without this error, the route simply runs unauthenticated — no error thrown, no redirect, just open access.

The Next.js CVE-2025-29927 (CVSS 9.1) showed that middleware-only auth can be bypassed by injecting the `x-middleware-subrequest` header. Any project on Next.js < 15.2.3 / 14.2.25 is vulnerable.

**Warning signs:**
- 404 or unhandled runtime errors on new routes added after initial setup
- API routes returning data without a session being present during manual testing
- `auth()` throws in a Server Component that was believed to be protected
- Layout re-renders not triggering auth re-checks on client-side navigation within a route group

**Prevention strategy:**
1. Use a broad matcher that catches everything except static assets:
   ```ts
   // middleware.ts
   export const config = {
     matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
   };
   ```
2. Never rely solely on middleware for data authorization. Add `auth()` checks at every Server Action and API Route Handler that touches data (Data Access Layer pattern).
3. Pin Next.js to >= 15.2.3 and enable Dependabot alerts for Next.js security patches.
4. Layouts in App Router **do not re-render on sibling navigation** — never put the only auth check inside a layout.

**Build phase:** Foundation (Phase 1) — get the middleware config right before building any protected routes. Retrofitting this is painful.

---

### Pitfall 2: MongoDB Connection Pool Exhaustion on Vercel

**What goes wrong:**
Vercel runs each serverless function invocation in an isolated container. Without a global connection singleton, every invocation opens a new Mongoose/MongoClient connection. At scale (or during cold-start storms), Atlas hits its connection limit and returns "MongoServerError: Too Many Connections" or Mongoose throws "Operation buffering timed out after 10000ms". With default `maxPoolSize: 100`, 50 concurrent Vercel containers attempt 5,000 connections.

An additional trap: `bufferCommands: true` (Mongoose default) silently queues operations if the connection is not yet ready. When the cold start takes longer than expected, queries pile up and the first response is very slow — which looks like a Mongoose bug but is actually a connection issue.

**Warning signs:**
- Atlas "Connections" chart spikes and stays high after deploys
- Random 500 errors in production that disappear when functions "warm up"
- Response times intermittently jump from 200ms to 4–8 seconds
- Atlas free tier (512 connections max) hits limit with fewer than 20 concurrent users

**Prevention strategy:**
```ts
// lib/mongodb.ts — singleton pattern
import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null };
}

const MONGODB_URI = process.env.MONGODB_URI!;
let cached = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,           // low — one serverless container serves one request
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 270000,    // close idle connections after 4.5 min
      bufferCommands: false,    // fail fast instead of queuing silently
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```
Atlas Network Access: add `0.0.0.0/0` — Vercel uses dynamic egress IPs.

**Build phase:** Foundation (Phase 1) — the singleton must exist before any route touches the DB. Do not add it "later".

---

### Pitfall 3: Financial Calculation Floating-Point Errors (FOB, TC, Landed Cost)

**What goes wrong:**
JavaScript `Number` uses IEEE 754 double-precision floating point. `0.1 + 0.2 === 0.30000000000000004`. For OC calculations involving USD→ARS conversion (tipo de cambio), FOB totals across line items, and landed cost accumulation, rounding errors compound across multiplications. A 10-item OC can show a discrepancy of $0.01–$0.10 ARS that breaks importers' reconciliation against bank statements and customs declarations.

Concrete example: `1234.56 * 192.75` in JS = `238022.34000000003` instead of `238022.34`.

**Warning signs:**
- Financial totals shown in UI don't match the same totals calculated by the importer's accountant in Excel
- PDF export and Google Sheets export show different trailing decimals for the same OC
- Unit tests with `expect(result).toBe(238022.34)` pass locally but fail due to floating-point drift

**Prevention strategy:**
Use integer-based arithmetic throughout. Store all monetary values in the database as integers (centavos for ARS, cents for USD). Convert to display format only at render time.

```ts
// lib/money.ts
import { Decimal } from 'decimal.js';

// All internal math uses Decimal
export function calcLandedCost(fobUSD: number, tc: number, gastosARS: number): number {
  const fob = new Decimal(fobUSD);
  const landedUSD = fob.times(new Decimal(tc));
  const total = landedUSD.plus(new Decimal(gastosARS));
  return total.toDecimalPlaces(2).toNumber();
}
```

Store as: `fobCents: number` (integer) in MongoDB. Never store `1234.56`; store `123456`.

**Build phase:** Phase 2 (OC Wizard) — enforce this before writing the first financial calculation. Retrofitting requires a DB migration.

---

### Pitfall 4: Role Sync Desynchronization Between Clerk Metadata and MongoDB

**What goes wrong:**
DrivaOC has roles in two places: Clerk `publicMetadata.role` and MongoDB `users.role`. They can drift. An importador changes role assignment in the admin panel → MongoDB is updated → Clerk metadata is not (or the webhook fails silently) → user's session token still carries the old role → route protection allows/denies based on stale data for up to the JWT expiry window (default: 1 hour in Clerk).

A second trap: `publicMetadata` is baked into the JWT and cached in the browser cookie. Even after updating Clerk metadata via the backend API, the client won't see the change until the session token is refreshed (user signs out and back in, or you force a token rotation).

Clerk session cookie size limit: ~1.2 KB of custom claims after Clerk's own claims. Storing verbose role objects or permissions arrays in metadata overflows this and silently breaks auth — the cookie is simply not set.

**Warning signs:**
- A user changes roles but continues to see the old role's UI and data for up to an hour
- Console error: "Cookie too large" or auth fails with no explanation after adding metadata fields
- Webhook delivery failures in Clerk dashboard (webhook endpoint returning non-2xx)

**Prevention strategy:**
1. **Single source of truth:** Clerk `publicMetadata.role` is authoritative. MongoDB stores a `clerkId` reference but does NOT separately store `role`. Look up role from Clerk session token always.
2. If you must store role in MongoDB (for DB-side queries), treat it as a read-through cache. Sync via Clerk webhook (`user.updated` event) with idempotent upsert. Add webhook signature verification.
3. Keep metadata lean — only store `{ role: 'importador' }`, nothing else.
4. On role change by admin, call Clerk Backend API to update `publicMetadata` AND force session invalidation (`clerk.users.revokeSession`) so the new role takes effect immediately.

**Build phase:** Phase 1 (Auth scaffold) and Phase 2 (Admin role assignment). Define the canonical data flow before any route checks a role.

---

### Pitfall 5: Role-Based Data Leakage — Proveedor Sees Other Importador's OCs

**What goes wrong:**
MongoDB queries that filter only by `status` or `proveedorId` without also scoping to the authenticated user's organization/ownership can return OCs belonging to other importadores. A GET `/api/ocs?status=pending` without `importadorId: currentUser.id` in the query returns every pending OC in the system.

In Next.js App Router, Server Components can accidentally expose data through props drilled down to Client Components, or through URL params that aren't re-validated server-side (e.g., `/ocs/[id]` — if the user manually changes the ID in the URL, does the server re-check ownership?).

**Warning signs:**
- Any MongoDB query that doesn't include the authenticated user's ID as a filter condition
- API routes that accept an `id` param and query by that ID without verifying ownership
- Client components receiving full DB documents instead of projected safe fields

**Prevention strategy:**
1. **Every MongoDB query must include a scope filter**:
   ```ts
   // Never:
   await OC.findById(params.id)
   // Always:
   await OC.findOne({ _id: params.id, importadorId: session.userId })
   ```
2. Create a `getOCWithOwnership(ocId, userId)` data access function used everywhere — no raw DB queries in route handlers.
3. For proveedores: scope queries to `proveedorId: session.userId`, and project only fields they are allowed to see (exclude financial details if not applicable).
4. Add an integration test that logs in as proveedorA, creates an OC, then logs in as proveedorB and attempts to fetch it by ID — assert 403.

**Build phase:** Phase 2 (OC CRUD). Define the data access layer with ownership scoping before building any listing or detail endpoint.

---

## Moderate Pitfalls

---

### Pitfall 6: Cloudinary PDF Upload — Unsigned Preset Abuse and Client-Side API Secret Exposure

**What goes wrong:**
If the PDF upload goes directly from the browser to Cloudinary using an unsigned upload preset, the cloud name and preset name are exposed in the client bundle. Anyone can use these to upload arbitrary files to your Cloudinary account (filling storage quota, uploading malware). 

Signed uploads require the `CLOUDINARY_API_SECRET` server-side. A common mistake is putting the signing logic inside a Next.js Client Component or exposing it via a `NEXT_PUBLIC_` env var — which sends the secret to the browser.

A second issue: Cloudinary's default upload size limit is 10 MB per file. Large scanned PDF invoices (high-DPI multi-page) routinely exceed this. The upload silently fails with an HTTP 400 and a non-obvious error message.

**Warning signs:**
- `NEXT_PUBLIC_CLOUDINARY_API_SECRET` in `.env.local` (any `NEXT_PUBLIC_` prefix on a secret is wrong)
- Upload widget initialized entirely client-side with no server signing endpoint
- Users reporting "upload failed" on large PDFs with no error detail in the UI

**Prevention strategy:**
1. Use server-side signed uploads: create a Next.js API route `/api/cloudinary/sign` that generates a signature using `cloudinary.utils.api_sign_request()` and returns it to the client. Never expose `CLOUDINARY_API_SECRET` to the frontend.
2. In the Cloudinary dashboard, disable the unsigned upload preset after dev is done, or restrict it to specific file types and max size.
3. Set `max_bytes` in the server-side signing params:
   ```ts
   cloudinary.utils.api_sign_request({
     timestamp,
     folder: 'driva-oc/pdfs',
     allowed_formats: 'pdf',
     max_bytes: 20971520, // 20 MB
   }, process.env.CLOUDINARY_API_SECRET!)
   ```
4. Cloudinary resource type for PDFs must be `raw`, not `image` — wrong resource type causes silent upload failure or broken file retrieval.

**Build phase:** Phase 3 (Document upload). Test with a 15 MB PDF before declaring upload done.

---

### Pitfall 7: Google Sheets API Service Account — Private Key Newline Corruption in Vercel

**What goes wrong:**
The service account JSON file contains a `private_key` field with literal `\n` newlines. When pasted into Vercel's environment variable UI, the newlines are stored as the two-character string `\\n`, not actual newlines. `googleapis` authentication then fails silently or throws "error:0906D06C:PEM routines:PEM_read_bio:no start line" — an OpenSSL error that looks like a certificate problem but is actually a string formatting issue.

Secondary issue: Google Sheets API quota is 300 read requests/minute per project and 60 write requests/minute. On Vercel, if 10 concurrent function invocations each sync to Sheets on OC save, you hit quota in seconds and get `429 Too Many Requests`.

**Warning signs:**
- PEM/certificate-related errors in Vercel function logs when calling Sheets API
- Sheets API calls work in local dev but fail in Vercel preview/prod deployments
- 429 errors from Sheets API under load or during batch OC operations

**Prevention strategy:**
1. Store private key with explicit newline escaping:
   ```ts
   const auth = new google.auth.GoogleAuth({
     credentials: {
       client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
       private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
     },
     scopes: ['https://www.googleapis.com/auth/spreadsheets'],
   });
   ```
2. Never commit the service account JSON file. Add it to `.gitignore` immediately at project creation.
3. For quota: make Sheets sync asynchronous and non-blocking. Queue sync operations and execute them outside the request/response cycle (e.g., a separate background route triggered after OC save, or a cron job). Do not make the user wait for Sheets sync.
4. Add exponential backoff with jitter for all Sheets API calls.

**Build phase:** Phase 4 (Google Sheets integration). Test the private key handling on Vercel preview before declaring integration done.

---

### Pitfall 8: Vercel Serverless Timeout and Bundle Size for PDF Export

**What goes wrong:**
Puppeteer requires a full Chromium binary (~100 MB) and cannot run on Vercel because the function bundle limit is 50 MB and the filesystem is read-only. Teams reach for Puppeteer first (familiar), hit the 50 MB limit at deploy time, then scramble for alternatives.

`@react-pdf/renderer` v7+ can also cause bundle size issues — one reported Vercel build failure from it exceeding 50 MB.

Vercel Hobby plan has a 10-second function timeout. PDF generation for a multi-page OC with embedded logo/signatures can take 8–15 seconds with some approaches.

**Warning signs:**
- "Serverless Function has exceeded the unzipped maximum size of 250 MB" at deploy
- PDF generation works in local dev but times out in production
- Bundle analysis showing Chromium-related packages in the server bundle

**Prevention strategy:**
1. Use `@react-pdf/renderer` (not Puppeteer). It runs in Node.js without a browser, bundle stays under 2 MB, and generation is typically < 500ms.
2. Verify the version — import `@react-pdf/renderer` only in Server Components/API routes, never in Client Components (it's server-only).
3. If `@react-pdf/renderer` v7 causes bundle issues, pin to v3.x which is stable on Vercel.
4. Generate PDF server-side in an API Route, stream the response with `Content-Disposition: attachment`, and use `renderToBuffer()` instead of `renderToStream()` for simpler Vercel compatibility.
5. Be on Vercel Pro (60-second timeout) before shipping PDF generation to production users.

**Build phase:** Phase 3 (PDF export). Do a Vercel preview deploy test with a realistic OC before implementing the full UI — discover timeout/size issues early.

---

### Pitfall 9: Resend — Sending From Unverified Domain Kills Deliverability

**What goes wrong:**
Resend provides `onboarding@resend.dev` for testing. Teams ship to production still using `onboarding@resend.dev` or a domain that has SPF/DKIM but not DMARC configured. Major email providers (Gmail, Outlook) increasingly reject or spam-bin messages failing DMARC. If DrivaOC sends OC notifications from an unverified domain, importadores miss critical shipment updates.

A secondary mistake: using `noreply@` as the from address. Major inbox providers treat `noreply` senders as low-trust bulk senders, reducing deliverability. Resend explicitly recommends against it.

**Warning signs:**
- Emails sent successfully (Resend returns 200) but importadores report never receiving them
- Resend deliverability dashboard shows high soft bounce or spam placement rate
- DNS propagation not waited for before testing (DKIM can take 24–48 hours to propagate)

**Prevention strategy:**
1. Verify the sending domain in Resend before Phase 1 is complete. Add SPF, DKIM, and DMARC DNS records. Wait 24 hours for propagation. Test with [mail-tester.com](https://www.mail-tester.com).
2. Use a transactional-focused from address: `notificaciones@driva.com.ar` not `noreply@`.
3. Disable click tracking for transactional OC notifications — click-tracking link rewriting can trigger spam filters and breaks trust with B2B recipients.
4. Use `react-email` components for HTML email templates — Resend is designed to work with it and it provides predictable HTML rendering across clients.
5. Set `Reply-To` header to a real monitored inbox so importadores can reply to notifications.

**Build phase:** Phase 1 (Foundation) — set up domain verification early. Do not leave it for the end.

---

## Minor Pitfalls

---

### Pitfall 10: Two-Step OC Wizard Data Loss on Browser Navigation

**What goes wrong:**
User fills Step 1 of the OC wizard (supplier, product line, quantities), clicks "Next", then hits browser Back or accidentally closes the tab. All Step 1 data is lost. React state does not persist across navigation. This is especially painful for OCs with 10+ line items.

A subtler issue: if Step 1 state lives in React `useState` and the user navigates to a different route and returns via React Router, the state is gone. If it lives in a URL query param, the URL becomes unwieldy and the user can bookmark a partially-filled form.

**Warning signs:**
- No persistence mechanism for form state between wizard steps
- Relying on `useState` alone without a store or URL serialization
- Step 2 renders before Step 1 data is validated, leading to partial saves

**Prevention strategy:**
1. Use Zustand with `persist` middleware (backed by `sessionStorage`, not `localStorage` — avoids stale data from previous sessions):
   ```ts
   const useOCWizardStore = create(
     persist(
       (set) => ({ step1Data: null, step2Data: null, ... }),
       { name: 'oc-wizard', storage: createJSONStorage(() => sessionStorage) }
     )
   );
   ```
2. Clear the store on successful OC submission and on explicit "Cancel" action.
3. Show a `beforeunload` warning if the user attempts to close the tab mid-wizard.
4. On step navigation, validate Step 1 before rendering Step 2 — never allow Step 2 to render with null Step 1 data.
5. Hydration gotcha: Zustand + Next.js App Router can cause hydration mismatches if the store is accessed during SSR. Use `useEffect` + `useState` to read from the store only after mount.

**Build phase:** Phase 2 (OC Wizard). Implement persistence from the first wizard commit — adding it later requires refactoring all form state handling.

---

### Pitfall 11: Clerk `publicMetadata` vs `privateMetadata` — Cookie Size Overflow

**What goes wrong:**
Browser cookies max at 4 KB. Clerk's session JWT already uses ~2.8 KB of that. Custom claims stored via `publicMetadata` or `sessionClaims` eat into the remaining ~1.2 KB. Adding role objects, permissions arrays, or MongoDB IDs together can silently overflow this limit, causing the cookie not to be set at all — which manifests as the user being perpetually logged out or `auth()` returning null.

**Warning signs:**
- Users randomly signed out after a role update
- `auth()` returns `null` but user shows as signed in on Clerk dashboard
- Works in dev but breaks in prod where more metadata is set

**Prevention strategy:**
1. Store only `{ role: 'importador' | 'proveedor' | 'despachante' }` in `publicMetadata` — nothing else.
2. Store MongoDB `_id` reference in `privateMetadata` (not exposed to client JWT, fetched server-side only when needed).
3. Monitor cookie size during development: log `document.cookie.length` in a dev utility and alert if > 3500 bytes.

**Build phase:** Phase 1 (Auth scaffold). Define the metadata schema before any code writes to it.

---

### Pitfall 12: Google Sheets Sync Blocking the Request Cycle

**What goes wrong:**
If the Sheets API call is `await`ed inside the OC save API route, the user's form submission blocks until Sheets responds (typically 1–3 seconds in good conditions, up to 30 seconds if quota is being hit or the Sheets API is slow). This creates terrible UX and can push the route into Vercel timeout territory.

**Warning signs:**
- OC save API route takes > 2 seconds in production
- Users report "form submitting slowly"
- Timeout errors correlate with Sheets API response times in logs

**Prevention strategy:**
Fire-and-forget the Sheets sync. Save the OC to MongoDB, return success to the client immediately, then trigger the Sheets sync in the background:
```ts
// In the API route — do NOT await sheetsSync
await saveOCToMongoDB(ocData);
// Non-blocking background trigger
sheetsSync(ocData).catch(err => console.error('[sheets-sync]', err));
return NextResponse.json({ ok: true, ocId: newOC._id });
```
Accept that Sheets may be a few seconds behind MongoDB. If exact consistency is required, use a webhook/cron approach.

**Build phase:** Phase 4 (Google Sheets integration).

---

## Phase-Specific Warning Matrix

| Build Phase | Pitfall | Mitigation |
|-------------|---------|------------|
| Phase 1: Foundation | Clerk middleware matcher too narrow | Use catch-all matcher, test all route groups immediately |
| Phase 1: Foundation | MongoDB connection no singleton | Implement global singleton before first DB query |
| Phase 1: Foundation | Resend domain not verified | Set up DNS records day 1, don't defer |
| Phase 1: Auth scaffold | Clerk metadata cookie overflow | Keep `publicMetadata` to `{ role }` only |
| Phase 1: Auth scaffold | Role source of truth ambiguity | Document canonical role source (Clerk) before any role check |
| Phase 2: OC Wizard | Floating-point financial errors | Enforce Decimal.js + integer storage from first calculation |
| Phase 2: OC Wizard | Data leakage missing ownership scope | All DB queries must include `importadorId` filter |
| Phase 2: OC Wizard | Wizard state loss on navigation | Zustand + sessionStorage from first wizard commit |
| Phase 2: Role assignment | Clerk/MongoDB role sync drift | Webhook + session revocation on role change |
| Phase 3: Documents | Cloudinary unsigned preset abuse | Signed uploads via server route, resource_type: raw |
| Phase 3: PDF export | Puppeteer bundle too large | Use @react-pdf/renderer, test on Vercel preview first |
| Phase 4: Integrations | Sheets private key newline corruption | `.replace(/\\n/g, '\n')`, test on preview env |
| Phase 4: Integrations | Sheets API quota under load | Async non-blocking sync, exponential backoff |
| Phase 4: Integrations | Sheets sync blocking request | Fire-and-forget pattern, return OC save immediately |

---

## Sources

- [Clerk: auth() was called but Clerk can't detect middleware](https://clerk.com/docs/reference/nextjs/errors/auth-was-called)
- [Clerk RBAC with publicMetadata](https://clerk.com/docs/guides/secure/basic-rbac)
- [Next.js CVE-2025-29927 middleware bypass](https://github.com/clerk/javascript/issues/2736)
- [MongoDB connection pool exhaustion — oneuptime.com](https://oneuptime.com/blog/post/2026-03-31-mongodb-how-to-handle-connection-pooling-in-serverless-with-mongodb/view)
- [MongoDB connection storming — thisdot.co](https://www.thisdot.co/blog/next-js-mongodb-connection-storming)
- [MongoDB Atlas large connections with Mongoose + Vercel — MongoDB Community](https://www.mongodb.com/community/forums/t/large-number-of-connections-with-mongoose-and-vercel/204917)
- [Financial precision in JavaScript — DEV Community](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
- [Dinero.js — LogRocket](https://blog.logrocket.com/store-retrieve-precise-monetary-values-javascript-dinero-js/)
- [Cloudinary signed uploads with Next.js](https://cloudinary.com/blog/guest_post/signed-uploads-in-cloudinary-with-next-js)
- [Cloudinary CORS policy resolution](https://support.cloudinary.com/hc/en-us/articles/23687796548626-Resolving-CORS-Policy-Error-calling-the-API)
- [Google Sheets API quota limits](https://developers.google.com/workspace/sheets/api/limits)
- [Google service account credentials on Vercel](https://github.com/vercel/next.js/discussions/38430)
- [Resend top 10 deliverability tips](https://resend.com/blog/top-10-email-deliverability-tips)
- [PDF generation on Vercel — Puppeteer vs react-pdf](https://dev.to/iurii_rogulia/pdf-generation-on-the-server-puppeteer-vs-react-pdfrenderer-a-production-comparison-44cg)
- [Vercel function 50MB size limit](https://vercel.com/kb/guide/troubleshooting-function-250mb-limit)
- [react-pdf v7 Vercel size issue](https://github.com/wojtekmaj/react-pdf/issues/1504)
- [Zustand multi-step form — React Hook Form discussion](https://github.com/orgs/react-hook-form/discussions/6382)
- [Clerk metadata sync to MongoDB](https://clerk.com/articles/how-to-sync-clerk-user-data-to-your-database)
