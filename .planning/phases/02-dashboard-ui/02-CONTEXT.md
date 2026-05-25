# Phase 2: Dashboard UI - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Each role sees its dashboard: 4 stat cards + filterable OC list table, all powered by mock data. No backend, no real persistence — Phase 5 connects real queries.

Importador sees all OCs. Proveedor/despachante see only OCs where their email matches.
</domain>

<decisions>
## Implementation Decisions

### OC List Layout
- **D-01:** Tabla responsive — no cards, no híbrido. Scroll horizontal en mobile.
- **D-02:** Columnas: Nº OC | Proveedor | Estado | Fecha | Acciones.
- **D-03:** Botones de acción como iconos lucide-react inline en columna Acciones. Importador: Eye + Pencil + Trash2. Proveedor/despachante: Eye + Pencil (sin Trash).

### Estado Set & Badges
- **D-04:** 6 estados posibles: `borrador`, `en_proceso`, `en_transito`, `en_aduana`, `entregada`, `cancelada`.
- **D-05:** Colores de badges solo del brand system (variaciones orange/amber). No colores semánticos externos (verde/rojo estándar). Agente elige la variación exacta por estado.

### Stat Card Style
- **D-06:** Icono lucide-react + número grande + label descriptivo. Fondo blanco, borde `acento`. Sin colores de acento distintos por card.

### Dashboard Proveedor/Despachante
- **D-07:** Proveedor y despachante ven las mismas 4 stat cards (OC Totales, En tránsito, En Aduana, Entregadas), filtradas a sus OCs asignadas.
- **D-08:** Proveedor y despachante pueden visualizar Y editar OCs (Eye + Pencil). Solo importador puede eliminar (Trash2). **Nota:** esto cambia el roadmap original donde "Editar = solo importador" — el planner debe actualizar Phase 2 Success Criteria #3 y Phase 4 scope para las vistas de edición de roles secundarios.

### Claude's Discretion
- Iconos lucide-react específicos por stat card (ej. FileText, Truck, Package, CheckCircle2 — agente elige).
- Color de badge exacto por estado dentro del brand system.
- Skeleton loading design.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 2 — goal, success criteria, plan breakdown. **Note:** Success Criteria #3 needs updating per D-08 (proveedor/despachante now have Edit button).

### Brand & Constraints
- `.planning/PROJECT.md` §Brand Identity — Tailwind tokens, typography scale, button/badge/focus rules.

### Existing Code Patterns
- `src/components/layout/Sidebar.tsx` — cn() usage, Tailwind token patterns, lucide-react imports, active link styling (`border-l-2 border-principal text-principal bg-acento/50`).

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/utils.ts` — exports `cn()` for conditional class merging. Use throughout new components.
- lucide-react — already installed. Used in Sidebar for LayoutDashboard, PlusCircle, ChevronLeft, etc.

### Established Patterns
- Tailwind custom tokens: `text-principal`, `text-titulares`, `bg-acento`, `text-texto`, `border-acento` — use these, not raw hex.
- Active link: `border-l-2 border-principal text-principal bg-acento/50`. Badge baseline: `bg-acento text-titulares`.
- Components are `'use client'` when they need state (useState, useEffect). Server components for static layout.
- Dashboard pages exist as stubs: `src/app/(importador)/importador/dashboard/page.tsx`, same for proveedor and despachante.

### Integration Points
- New components slot into existing layout: `(importador)` route group has Sidebar wired, `(proveedor)` and `(despachante)` have Navbar.
- Mock data lives in `lib/mock-ocs.ts` (plan 02-01 creates it). Dashboard page imports from there.
- `'Nueva OC'` button in Sidebar links to `/importador/oc/nueva` — empty state CTA should match this route.

</code_context>

<specifics>
## Specific Ideas

No specific visual references beyond the brand system. Standard professional dashboard look.

</specifics>

<deferred>
## Deferred Ideas

- **Gráficos de evolución OCs** — ya diferido a v2 en STATE.md. No aplica a Phase 2.
- **Filtro por fecha range** — no mencionado en roadmap. Deferido si surge.

</deferred>

---

*Phase: 2-Dashboard UI*
*Context gathered: 2026-05-25*
