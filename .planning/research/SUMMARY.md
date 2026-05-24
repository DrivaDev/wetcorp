# Project Research Summary

**Project:** DrivaOC - Import Purchase Order Management
**Domain:** Multi-role B2B procurement document management (Argentina import context)
**Researched:** 2026-05-24
**Confidence:** HIGH

---

## Executive Summary

DrivaOC is a multi-role B2B SaaS for managing Argentine import purchase orders, with three fixed roles: importador (owner), proveedor (read-only supplier), and despachante (customs agent with document upload). The recommended approach uses Next.js App Router with route groups per role, Clerk publicMetadata for RBAC (not Organizations), MongoDB Atlas with a fully-embedded OC document, and @react-pdf/renderer for server-side PDF generation. Every architectural decision prioritizes Vercel serverless constraints: no Puppeteer (100 MB bundle), no per-request Mongoose connections (Atlas exhaustion), no Edge runtime for DB routes (Mongoose requires Node.js).

The core product flow is a two-step OC creation wizard where Step 1 creates a borrador draft in MongoDB (products + general info), and Step 2 completes it (import costs, document uploads, tipo de cambio). This DB-draft pattern is mandatory - client state does not survive cross-page navigation. Financial calculations must use decimal.js from day one; retrofitting integer-based arithmetic after data exists in MongoDB requires a migration. The OC document embeds all sub-data (products, expenses, documents) because it is always fetched as a unit and arrays are bounded.

The top risks are: floating-point calculation errors in financial tables (use decimal.js + integer storage immediately), MongoDB connection pool exhaustion on Vercel (use global singleton with maxPoolSize: 5), Clerk middleware matcher gaps allowing silent auth bypass (use broad catch-all matcher + re-verify in every Server Action), and Google Sheets private key newline corruption in Vercel env vars. Resend domain verification must be done before Phase 1 is complete - DNS propagation takes 24-48 hours and cannot be deferred to the end.

---

## Key Findings

### 1. Confirmed Stack

All major technology choices are settled. See .planning/research/STACK.md for full code samples.

| Package | Version | Purpose | Key Decision |
|---------|---------|---------|--------------|
| @clerk/nextjs | ^6.x | Auth + RBAC | Use publicMetadata.role, NOT Organizations |
| mongoose | ^8.x (8.19.x) | MongoDB ODM | Global singleton with maxPoolSize: 5 |
| @react-pdf/renderer | ^4.x (4.1.0+) | PDF generation | NOT Puppeteer - Chromium exceeds Vercel 50 MB limit |
| cloudinary | ^2.x | PDF storage | resource_type: raw is mandatory for PDFs |
| googleapis | latest | Sheets sync | JWT auth with service account, NOT OAuth flow |
| resend + @react-email/components | latest | Email notifications | Paired for React-based templates |
| decimal.js | latest | Financial math | Required - IEEE 754 errors break reconciliation |
| next-cloudinary | latest | Upload widget | Client-side upload; signing endpoint is API Route |

**What NOT to use:**
- Clerk Organizations (B2B multi-tenant overkill for 3 static roles)
- Puppeteer for PDF (bundle too large for Vercel)
- react-pdf viewer package (different package from @react-pdf/renderer)
- resource_type: auto in Cloudinary (unpredictable for PDFs - use raw explicitly)
- google-spreadsheet wrapper (use googleapis directly for full control)
- nodemailer (Resend is simpler with better deliverability)
- NEXT_PUBLIC_ prefix on any secret (leaks to browser bundle)
- type=number inputs for currency (use type=text with input mask)

**Required next.config.ts addition:**
```ts
serverExternalPackages: ['@react-pdf/renderer']
```

**Required on all DB/PDF routes:**
```ts
export const runtime = 'nodejs'
```

---

### 2. Critical Decisions Made (Non-Negotiable)

These are settled by research and must not be re-litigated during planning:

1. **@react-pdf/renderer not Puppeteer** - Puppeteer Chromium (~100 MB) exceeds Vercel 50 MB function limit. react-pdf runs in Node.js with no browser dependency, PDFs generated in <500ms.

2. **Server Actions for CRUD, API Routes for 3 special cases only** - CRUD mutations use Server Actions. Three cases require API Routes: Cloudinary signing endpoint (widget makes raw HTTP request), PDF download (binary streaming), and Clerk webhooks (external HTTP POST from Clerk infrastructure).

3. **DB draft pattern for two-step wizard** - OC is saved to MongoDB as estado: borrador at Step 1 submit. Step 2 loads the draft and completes it. No URL params, no Zustand-only state, no cookie session. Only DB survives page navigation, tab close, and hard refresh.

4. **Embed all sub-data in OC document** - Products, expenses, and document metadata are embedded arrays. No separate collections. Always fetched with the OC. MongoDB 16 MB BSON limit is not a concern (typical OC stays under 50 KB).

5. **Clerk publicMetadata.role as single source of truth** - MongoDB does NOT independently store role. The Clerk JWT carries the role via session token customization in the Clerk Dashboard (Dashboard > Sessions > Customize session token).

6. **Google Sheets sync is fire-and-forget** - Never await the Sheets API call in the request cycle. Save OC to MongoDB, return success to client, trigger Sheets sync non-blocking.

7. **All financial math via decimal.js; store as integers** - ARS and USD amounts stored in centavos/cents (integers) in MongoDB. Converted to display format at render time only. Enforced from Phase 2 first calculation - there is no migration path after data exists.

8. **Route groups per role** - (importador), (proveedor), (despachante) as separate route groups with separate layout.tsx files. Single root app/layout.tsx wraps ClerkProvider and html/body.

---

### 3. Must-Do Before Phase 1 (Easy to Miss, Blocks Everything)

1. **Clerk session token customization** - In Clerk Dashboard > Sessions > Customize session token, add the metadata claim to embed publicMetadata in the JWT. Without this, sessionClaims.metadata.role returns undefined in middleware on every request, requiring an extra backend round-trip per request.

2. **MongoDB singleton before first DB route** - Implement lib/db/mongoose.ts global singleton with maxPoolSize: 5 and bufferCommands: false. Cannot be added later without refactoring all DB calls.

3. **Resend domain verification** - Add SPF, DKIM, and DMARC DNS records and verify the sending domain in the Resend dashboard during Phase 1. DNS propagation takes 24-48 hours. If deferred to Phase 4, email notifications are blocked until propagation completes after a production deploy.

4. **Google Sheets private key newline fix** - When reading GOOGLE_PRIVATE_KEY from environment, always apply the newline replacement (replace the two-character sequence backslash-n with an actual newline). Vercel stores literal backslash-n in env vars; googleapis fails with OpenSSL PEM errors otherwise.

5. **Cloudinary resource_type: raw** - All PDF uploads (server-side via upload_stream and client-side via CldUploadWidget) must specify resource_type: raw. Using image or auto silently fails or corrupts the file.

6. **next.config.ts serverExternalPackages** - Add @react-pdf/renderer to serverExternalPackages before importing react-pdf anywhere. Next.js 15 throws ESM import errors without this.

7. **Atlas Network Access: 0.0.0.0/0** - Vercel uses dynamic egress IPs. Without this, Vercel serverless containers cannot connect to MongoDB Atlas.

---

### 4. Feature Scope Confirmed

See .planning/research/FEATURES.md for full UX specifications per dimension.

**Table stakes (must ship for v1 to be usable):**
- OC list with status badges (Borrador/Enviada/En Transito/Recibida/Cerrada), search, and status filter
- Two-step OC creation wizard with progress indicator and step validation
- Product line table with inline editing, live FOB totals (300ms debounce), ARS/USD display
- Import cost breakdown table with tipo de cambio field and live landed cost
- Named document upload slots (PDF-only, slot-based not generic, 10 MB limit)
- PDF export - server-side, loading state, auto-download trigger
- Role-based access: importador full edit, proveedor and despachante read-only
- Empty state with guided first-OC creation CTA
- Sticky column headers + sticky first/last columns on OC table
- OC detail view (read mode) - all inputs disabled, action buttons hidden for external roles

**Should-have differentiators (schedule permitting in v1):**
- Live landed cost percentage breakdown per cost line (percentage of total FOB)
- OC status timeline / audit trail (immutable event log)
- Duplicate OC / clone (resets status to Borrador, clears dates)
- Dashboard stat cards for importador (active OCs, FOB this month, missing docs)
- Notification email to proveedor on status change to Enviada

**Defer to v2:**
- Google Sheets sync (high complexity, not blocking core workflow)
- Despachante document upload permissions (requires permission model extension)
- Proveedor portal via shareable/magic link
- Duplicate OC clone (low complexity but acceptable defer if schedule is tight)

**Never build:**
- Real-time ARS/USD exchange rate API (Argentina multi-rate legal ambiguity)
- Multi-approver workflow (overkill for owner-operated importers)
- Two-way Google Sheets sync (OC is source of truth)
- Bulk OC creation from CSV import
- Mobile-first financial tables (desktop-only workflow)

**Currency formatting rules (Argentina context):**
- ARS: period as thousands separator, comma as decimal - example: $1.234.567,89
- USD: comma as thousands separator, period as decimal - example: USD 12,450.00
- Always show currency code next to amount; never use bare dollar symbol
- Right-align all numeric columns

---

### 5. Top Pitfalls Watch List

| # | Pitfall | One-Line Prevention |
|---|---------|-------------------|
| 1 | Floating-point financial errors (FOB, TC, landed cost) | decimal.js for all math; store as integers (centavos) from Phase 2 day one - no migration path |
| 2 | MongoDB connection pool exhaustion on Vercel | Global singleton with maxPoolSize: 5, bufferCommands: false; Atlas Network Access 0.0.0.0/0 |
| 3 | Clerk middleware matcher gap (silent auth bypass, CVE-2025-29927) | Broad catch-all matcher + re-verify role via checkRole() in every Server Action and API Route |
| 4 | Google Sheets private key newline corruption in Vercel env vars | Apply newline replacement when reading GOOGLE_PRIVATE_KEY; test on Vercel preview before declaring done |
| 5 | Cloudinary API secret exposure via unsigned upload preset | Signed uploads via /api/sign-cloudinary-params; never NEXT_PUBLIC_ on secrets; resource_type: raw |
| 6 | Resend unverified domain kills email deliverability | Verify domain (SPF + DKIM + DMARC) on day 1 of Phase 1; DNS takes 24-48h |

**Additional watch items:**
- Clerk publicMetadata cookie overflow: keep metadata to { role: string } only - browser cookies max at 4 KB, Clerk uses ~2.8 KB already
- @react-pdf/renderer must be in serverExternalPackages or Next.js 15 throws ESM import errors
- Mongoose and react-pdf routes must declare export const runtime = 'nodejs'
- Role sync drift: call clerk.users.revokeSession() after admin changes a user role (JWT is stale up to ~1h otherwise)
- Wizard data loss: Zustand + sessionStorage persist (not localStorage) for within-session recovery

---

### 6. Open Questions for Product Owner

1. **OC numbering scheme** - Is OC-2026-001 the format? Auto-incremented per importador or global? Resets annually?

2. **Despachante document upload scope** - v1 or v2? Research classified as v2. If v1, document slot permission model must be designed in Phase 2.

3. **Proveedor access model** - Invitation magic link (token scoped to single OC, no password) or full Clerk accounts?

4. **Tipo de cambio immutability** - Is TC locked at OC creation (immutable), or can importador edit it after sending?

5. **Argentina import cost categories** - Research assumed: SIM, derechos, flete, SENASA, despachante fee, otros. Correct? Fixed or user-configurable?

6. **Multi-importador tenancy** - Single importador or multi-tenant (multiple importing companies with isolated OC sets)? Architecture assumes single for v1.

7. **PDF branding** - DrivaOC logo or importador company logo in PDF header?

8. **Status transitions** - Can despachante advance En Transito to Recibida in v1, or confirmed v2 only?

---

## Implications for Roadmap

Based on the hard dependency chain discovered in research (auth gate -> DB layer -> core wizard -> integrations), the recommended phase structure:

### Phase 1: Foundation + Auth
**Rationale:** Auth gate cannot be retrofitted. Route groups define URL structure for all future phases. Resend DNS has 24-48h delay - start now. MongoDB singleton must precede any DB route.
**Delivers:** Working Clerk auth, role assignment via onboarding flow, route group skeletons for all 3 roles, middleware with broad catch-all matcher, MongoDB singleton, all env vars configured, Resend domain verified, Atlas Network Access set.
**Avoids:** Middleware matcher gap (Pitfall 3), MongoDB exhaustion (Pitfall 2), Resend deliverability (Pitfall 6), Clerk cookie overflow.
**Research flag:** Standard patterns - skip phase research. Clerk + Next.js middleware is extremely well-documented with official examples.

### Phase 2: OC Core Wizard
**Rationale:** The two-step wizard is the entire core product. PDF export, Sheets sync, and role-specific views all depend on OC data existing. Financial math must be correct from the first calculation written.
**Delivers:** Two-step OC creation (Step 1: products + general info with draft save; Step 2: import costs + tipo de cambio + document upload slots), OC list with status badges/filter/search, OC detail view read-only for all roles, ownership-scoped DB queries, decimal.js financial math.
**Avoids:** Floating-point errors (Pitfall 1 - decimal.js from day one), Cloudinary secret exposure (Pitfall 5), data leakage (ownership filter on every query), wizard state loss (Zustand sessionStorage).
**Research flag:** Standard patterns for wizard and DB draft. If despachante upload is confirmed in v1 scope, flag for deeper research on document slot permission model.

### Phase 3: PDF Export
**Rationale:** Depends on completed OC data with all computed totals. Must be tested on Vercel preview deploy - not local - to catch bundle size and timeout issues early.
**Delivers:** Exportar PDF button on OC detail with loading state and error handling, server-side react-pdf generation, auto-download via Content-Disposition: attachment.
**Avoids:** Puppeteer bundle size (confirmed: react-pdf is the choice), Next.js 15 ESM errors (serverExternalPackages), Vercel timeout (export maxDuration = 30).
**Research flag:** Standard patterns. Test on Vercel preview before declaring Phase 3 done.

### Phase 4: Google Sheets Sync + Email Notifications
**Rationale:** Both integrations are triggered on OC completion events and neither blocks the core workflow. Grouped together.
**Delivers:** Google Sheets one-way sync button (fire-and-forget), email notifications to proveedor and despachante on OC status changes, importador dashboard stat cards.
**Avoids:** Sheets private key newline (Pitfall 4), Sheets blocking request cycle (fire-and-forget pattern), Sheets quota under load (async + exponential backoff).
**Research flag:** Deeper research recommended for Sheets quota management and error handling under load. Test private key handling on Vercel preview before declaring integration done.

### Phase 5: Polish + v2 Features
**Rationale:** Stable page structure required before UI polish. v2 features depend on Phase 2 document model being finalized.
**Delivers:** OC status timeline/audit trail, duplicate OC clone, column visibility toggles, responsive audit, error states, loading skeletons, SEO meta.
**Research flag:** Standard patterns. Proveedor magic link (if in scope) needs its own research spike into token-based auth outside Clerk.

### Phase Ordering Rationale

- Phase 1 must come first: auth cannot be retrofitted; Resend DNS delay forces early setup
- Phase 2 before Phase 3: PDF requires completed OC totals to render
- Phase 3 before Phase 4: establishes OC-complete state that triggers downstream integrations
- Financial math (decimal.js + integer storage) enforced in Phase 2: no migration path after data exists in MongoDB
- Cloudinary signing endpoint builds alongside document upload slots in Phase 2 (same feature, different concerns)
- Sheets sync is fire-and-forget and does not block OC save, but integration complexity warrants its own phase

### Research Flags

**Needs deeper research during planning:**
- Phase 4 (Google Sheets): quota management, retry/backoff strategy, error UX when sync fails silently
- Phase 5 (Proveedor magic link): if confirmed in v1 scope, token-based auth scoped to single OC needs a research spike

**Standard patterns (skip research phase):**
- Phase 1: Clerk + Next.js middleware
- Phase 2: DB draft pattern for multi-step wizards; react-hook-form + Zustand patterns
- Phase 3: react-pdf on Vercel (official starter repo exists)
- Phase 5: UI polish patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified against official docs via Context7; Puppeteer vs react-pdf decision is production-validated |
| Features | HIGH (layout/RBAC) / MEDIUM (ARS locale) | UX patterns verified from enterprise procurement references; ARS formatting is common convention |
| Architecture | HIGH | Next.js official docs v16.2.6 (2026-05-19); Clerk and MongoDB Atlas official docs |
| Pitfalls | HIGH (critical) / MEDIUM (moderate) | Critical pitfalls sourced from CVEs, official error docs, community post-mortems |

**Overall confidence: HIGH**

### Gaps to Address

- **OC number generation** - auto-increment requires atomic counter or sequence collection; not researched in detail. Use nanoid or UUID as fallback if sequential numbering is not required by product owner.
- **react-pdf v4 edge cases in Next.js 15** - active GitHub issues for v4.1-4.5; pin to a specific version and test thoroughly. v3.x is stable on Vercel as fallback.
- **Zustand hydration with App Router** - Can cause hydration mismatches if store is accessed during SSR. Use useEffect + useState to read store state only after mount.
- **Multi-tenant data isolation** - Architecture assumes single importador. If multiple importadores share the system, all query scope filters and indexing strategy need review before Phase 2.
- **Clerk session token refresh after role change** - JWT is stale up to ~1h after role update. Call clerk.users.revokeSession() after admin changes a user role.

---

## Sources

### Primary (HIGH confidence - official docs)
- Clerk RBAC guide + clerkMiddleware reference - RBAC patterns, session token customization, publicMetadata
- Mongoose official Next.js connection docs - connection singleton, connection pooling
- Next.js official docs v16.2.6 - route groups, Server Actions vs API Routes, serverExternalPackages
- react-pdf official docs + Next.js 15 starter repo - renderToBuffer, serverExternalPackages config
- Cloudinary official Node.js SDK + PDF upload guide - resource_type: raw, upload_stream
- Resend official docs - React Email integration, Next.js Server Actions pattern
- Google Sheets API Node.js quickstart (official) - JWT auth, service account setup
- Vercel function limits and duration config (official) - bundle size, timeout, maxDuration

### Secondary (MEDIUM confidence - community consensus)
- Vercel + MongoDB connection pooling post-mortems
- PDF generation comparison: Puppeteer vs react-pdf (production case study)
- Enterprise procurement UX patterns (Fluent Commerce, UITOP, Eleken, Carbon Design System)

### Tertiary (inferred - needs product owner validation)
- Argentina import cost category names (SIM, SENASA, derechos, etc.) - domain inference
- Proveedor magic link approach - inferred from B2B SaaS patterns (Notion guests, Figma share links)

---
*Research completed: 2026-05-24*
*Ready for roadmap: yes*
