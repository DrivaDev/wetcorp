# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-24)

**Core value:** Un importador puede crear una OC, ver el costo total de importación (FOB + gastos) y compartir el estado con su proveedor y despachante — todo desde una sola plataforma.
**Current focus:** Phase 2 — Dashboard UI

## Current Position

Phase: 3 of 6 (OC Wizard UI)
Plan: 0 of 3 in current phase
Status: Ready to execute
Last activity: 2026-05-26 — Phase 2 complete ✓ (3/3 plans: 02-01, 02-02, 02-03)

Progress: [████░░░░░░] 40% (6/17 plans complete across all phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: ~15 min
- Total execution time: 0.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 - Foundation & Auth | 3/3 | ~50 min | ~17 min |
| 2 - Dashboard UI | 3/3 | ~30 min | ~10 min |

**Recent Trend:**
- Last 5 plans: 01-01 (15 min), 01-02 (20 min)
- Trend: Baseline established

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Clerk publicMetadata.role — NOT Organizations. Single source of truth for RBAC.
- Phase 1: MongoDB global singleton (maxPoolSize: 5, bufferCommands: false) — mandatory before any DB route.
- Phase 1: Resend domain verification MUST start in Phase 1 (DNS: 24-48h delay). Cannot defer.
- Phase 3: decimal.js + integer storage (centavos) from first calculation — no migration path after data exists.
- Phase 4: Cloudinary resource_type: raw mandatory for PDFs; signed upload via /api/sign-cloudinary-params.
- Phase 5: @react-pdf/renderer (NOT Puppeteer — Chromium exceeds Vercel 50 MB limit). Add to serverExternalPackages.
- Phase 5: Google Sheets sync is fire-and-forget — never await in request cycle. Apply newline fix for GOOGLE_PRIVATE_KEY.
- Phase 1: Clerk v7 removed afterSignOutUrl from UserButton — configured on ClerkProvider as hardcoded string literal "/sign-in".
- Phase 2: Dashboard pages use 'use client' + useState for filters (not Server Components) — necesario para filtrado client-side en tiempo real sin roundtrip al servidor.
- Phase 2: OCTable tiene columnas dinámicas por rol — importador ve Proveedor + Despachante; proveedor ve solo Despachante; despachante ve solo Proveedor.
- Phase 2: Stats calculadas desde subset base del rol (sin aplicar filtros activos) para conteos estables mientras el usuario filtra.
- Phase 2: FilterBar es rol-aware — importador ve filtros de proveedor + despachante + estado; proveedor/despachante ven solo filtro de estado.

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 1] Clerk session token must be customized in Clerk Dashboard (Sessions > Customize session token) to embed publicMetadata in JWT — without this, sessionClaims.metadata.role is undefined in middleware.
- [Pre-Phase 1] Atlas Network Access must be set to 0.0.0.0/0 — Vercel uses dynamic egress IPs.
- [Open] OC numbering scheme not defined — use nanoid/UUID as fallback until product owner decides format.
- [Open] Multi-importador tenancy assumption: single importador for v1. Architecture must be revisited if multiple companies share the system.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Auth | Despachante document upload permissions | v2 | Research 2026-05-24 |
| Auth | Proveedor magic link (token-based, no password) | v2 | Research 2026-05-24 |
| OC | Historial de cambios / audit log | v2 | Requirements |
| OC | Duplicate OC clone | v2 | Requirements |
| Dashboard | Gráficos evolución OCs | v2 | Requirements |
| Sheets | Sync bidireccional | v2 | Requirements |

## Session Continuity

Last session: 2026-05-26
Stopped at: Phase 2 complete — 02-03 (FilterBar + wireo dashboards + post-checkpoint fixes) aprobado por usuario.
Resume file: .planning/phases/03-oc-wizard-ui/03-01-PLAN.md
