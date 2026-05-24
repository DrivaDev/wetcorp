# Feature Landscape — DrivaOC

**Domain:** Import purchase order management (B2B, multi-role)
**Researched:** 2026-05-24
**Scope:** 7 UX dimensions for OC creation, financial tables, documents, roles, export

---

## Table Stakes

Features users expect from any serious OC management tool. Missing = product feels broken or amateur.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| OC list view with status badges | Entry point to every workflow; users need orientation at a glance | Low | Color-coded status chips: Borrador, Enviada, En Tránsito, Recibida, Cerrada |
| Sticky column headers on OC table | Tables scroll vertically; headers must stay visible | Low | Also pin the first column (OC number) and last column (actions) |
| Status filter + search on OC list | Users manage tens of OCs; navigation without filter is unusable | Low | Combine: text search (supplier name, OC#) + status chip filter + date range |
| Two-step OC creation wizard | Core product flow — Step 1: general + products; Step 2: import costs + docs | Medium | Must match described flow exactly; progress bar with step labels |
| Product line table in Step 1 | FOB calculation is the central artifact; must support add/remove/reorder rows | Medium | Inline editing for quantity + unit price; FOB = qty × price auto-computed per row |
| Import cost breakdown table in Step 2 | Landed cost is the key financial output; structured by cost category | Medium | Categories: SIM, derechos, flete, SENASA, etc.; each row has amount + currency |
| Auto-calculated totals (FOB, landed cost) | Users expect live recalculation as they type — no manual "Calculate" button | Medium | Debounced (300ms) recalc on every keystroke; totals row always visible |
| Tipo de cambio field (ARS/USD) | All imports in Argentina are dual-currency; every cost needs a conversion rate | Low | Single editable field at OC level; all ARS ↔ USD conversions derive from it |
| Document upload slots per OC | Import OCs generate fixed document sets (factura, packing list, BL, DUA, etc.) | Medium | Named slots, not generic upload; PDF-only; slot label shows expected document |
| PDF export of full OC | Primary deliverable shared with despachante and proveedor | Medium | "Exportar PDF" button → loading state → auto-download trigger |
| Role-based access: importador / proveedor / despachante | Multi-stakeholder collaboration is core; each role sees a different slice | High | See role matrix below |
| OC detail view (read mode) | External users (proveedor, despachante) need read-only access to OC data | Low | Same layout as edit view; all inputs disabled; no action buttons |
| Empty state for new account | First session has no OCs; empty state guides to creation | Low | Illustration + "Crear primera OC" CTA; do not show a blank table |
| Responsive layout for admin | Importadores work from desktops; full-width tables require desktop-first design | Low | Mobile responsiveness is a nice-to-have for OC detail views |

---

## Differentiators

Features that separate DrivaOC from "generic procurement tool" or "spreadsheet." Not expected, but create loyalty.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Live landed cost breakdown (% of FOB per line item) | Importers obsess over cost structure; seeing "flete = 12% FOB" is high-value insight | Medium | Each cost line computes its % of total FOB automatically |
| Google Sheets sync | Importadores already use Sheets for reporting to owners/accountants; sync removes re-entry | High | One-direction push (OC → Sheet) is sufficient for v1; two-way sync is complex |
| Proveedor portal (read-only, link-based) | Suppliers need to confirm OC details; email attachments are lossy | Medium | Shareable link per OC; no login required or separate auth flow |
| Despachante document workspace | Customs agents need to upload their documents (DUA, SIMI) back to the OC | High | Bidirectional doc flow: importer uploads commercial docs; despachante uploads customs docs |
| OC status timeline / audit trail | Importadores lose track of when things changed; timeline creates accountability | Medium | Immutable event log: "Enviada a proveedor — 2024-03-15 por Juan" |
| Tipo de cambio history on OC | Exchange rate used at OC creation must be locked; changes in rate should not alter closed OCs | Low | Store TC at creation time; show "TC al momento: $1,401" in read mode |
| Duplicate OC (clone) | Repeat orders from same supplier are common; re-entering everything is friction | Low | One click: clone all fields except dates; reset status to Borrador |
| OC summary card (totals at a glance) | Dashboard context without opening the OC | Low | FOB total + landed cost + TC + status chip in list row expansion |
| Notification to proveedor on OC send | Manual email step is error-prone; notify automatically on status change | Medium | Configurable email template; no full notification system needed yet |
| Column visibility toggles on OC list | Power users have different relevant columns; one-size table is suboptimal | Low | Show/hide columns; persist preference in localStorage |

---

## Anti-Features

Features to explicitly NOT build in v1. Each one is a trap.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time ARS/USD exchange rate API | Argentina has multiple exchange rates (oficial, blue, MEP); no single "correct" source; legal ambiguity | Manual tipo de cambio field; user enters the rate they negotiated or use |
| Full approval workflow (multi-approver) | Adds role/permission complexity; importadores are owners, not enterprises with procurement departments | Status field with manual transitions is sufficient |
| Inventory management / stock deduction | Out of scope; OC is a procurement document, not a warehouse system | Link to external inventory via export |
| Accounting integration (Contabilium, Tango, Xubio) | Each integration is a project; accounting systems have complex ledger rules | Google Sheets sync is the accounting bridge for v1 |
| Two-way Google Sheets sync | Changes in Sheets flowing back to OC create data integrity risks | One-way push only: OC is the source of truth |
| Bulk OC creation from CSV import | Import data is heterogeneous; mapping logic is expensive to build correctly | Manual OC creation; clone feature covers repeat orders |
| Mobile-first table design | Wide financial tables do not translate to mobile; importer workflow is desktop | Responsive OC detail view; table is desktop-only |
| Chat / messaging inside OC | Scope creep; email + document comments cover communication needs | Comments field per document slot is the safe alternative |
| AI cost prediction / budget alerts | Insufficient data in v1 to train; overpromises capability | Historical cost comparison after 6+ months of data |
| Multi-currency per line item | Adds complexity to calculations; in practice all costs are in USD or ARS on a single OC | Single TC field at OC level covers the conversion need |

---

## Feature Dependencies

```
OC List View
  └── OC Detail View (read mode)
        └── Role-Based Access (proveedor, despachante can only reach detail)
              └── Proveedor Portal (shareable link → OC detail, no login)

OC Creation Wizard (Step 1)
  └── Product Table with inline FOB calc
        └── Total FOB row (sum of all product lines)
              └── OC Creation Wizard (Step 2)
                    └── Import Cost Breakdown Table
                          └── Tipo de Cambio field (ARS↔USD conversion per cost line)
                                └── Landed Cost Total (auto-computed)
                                      └── PDF Export (consumes computed totals)
                                      └── Google Sheets Sync (consumes computed totals)

Document Upload Slots
  └── PDF-only validation
        └── Preview panel (iframe or thumbnail)
              └── Despachante Upload (same slot mechanism, different permissions)

OC Status Field
  └── Status Timeline / Audit Trail
        └── Notification to Proveedor (triggered on status → "Enviada")

Duplicate OC
  └── Depends on: OC Detail View, OC Creation Wizard (pre-fill)
```

---

## MVP Recommendation

**Prioritize (must ship for v1 to be usable):**

1. OC list with status badges, search, and status filter
2. Two-step OC creation wizard (with progress bar + step validation)
3. Product line table with inline editing and live FOB totals
4. Import cost breakdown table with tipo de cambio and live landed cost
5. Named document upload slots (PDF-only, no preview required in v1)
6. PDF export (server-side generation, loading state, auto-download)
7. Role-based access: importador full edit, proveedor and despachante read-only
8. Empty state with guided first-OC creation CTA

**Defer to v2:**

- Google Sheets sync (High complexity, not blocking core workflow)
- Despachante document upload (Medium complexity; requires permission model extension)
- OC status timeline (Medium; valuable but not blocking)
- Proveedor portal via shareable link (Medium; email PDF covers v1)
- Notification emails to proveedor (Medium; manual step is acceptable early on)
- Duplicate OC / clone (Low complexity; acceptable defer if schedule is tight)

**Never build (anti-features above apply to all versions):**

- Real-time exchange rate API
- Multi-approver workflows
- Inventory management

---

## UX Pattern Specifics by Dimension

### 1. OC Table Layout and Status Workflows

**Table columns (recommended order):**
`# OC | Proveedor | Fecha creación | FOB total | Landed cost | Estado | Acciones`

- Estado column uses colored chips: gray (Borrador), yellow (Enviada), blue (En Tránsito), green (Recibida), purple (Cerrada)
- Acciones column: inline "Ver" button always visible; "Editar" and "Eliminar" only for importador role
- Sticky first column (OC number) + sticky last column (acciones) for horizontal scroll
- Sort by: Fecha (default desc), FOB, Estado
- Filter: status chip multiselect + text search + date range picker
- Pagination: 20 rows per page; or virtual scroll if >200 OCs (unlikely in v1)
- Row click → OC detail view (same as "Ver" button)
- Expandable row on mobile: collapse all but OC#, Proveedor, Estado

**Status transitions (importador triggers manually):**
```
Borrador → Enviada → En Tránsito → Recibida → Cerrada
                                              ↓
                                         (locked, no edits)
```
- Only importador can advance status
- Despachante can advance from En Tránsito → Recibida (optional, v2)
- Closed OCs become fully read-only

**Confidence:** HIGH — verified across multiple procurement system references

---

### 2. Financial Table UX

**Currency display rules:**
- Always show currency code next to amount: `USD 12,450.00` not `$12,450`
- Argentina context: use period as thousands separator, comma as decimal (local convention): `$1.234.567,89`
- USD amounts: use comma as thousands separator, period as decimal: `USD 12,450.00`
- Right-align all numeric columns; left-align text columns
- Totals row: bold, visually separated (heavier top border or background tint)
- Subtotals per category in cost breakdown table (e.g., "Gastos de origen" subtotal)

**Live calculation behavior:**
- Recalculate on every `input` event with 300ms debounce
- Show spinner icon in totals cell during recalc if calculation takes >100ms (server-side)
- For client-side-only calc (pure arithmetic): no spinner needed, instant update
- Color-code delta: if user edits a cost and total increases, flash total briefly in amber
- FOB total = Σ(qty × unit_price) across all product rows
- Landed cost = FOB + Σ(import costs in USD equivalent)
- ARS costs converted: ARS_amount / tipo_de_cambio = USD equivalent

**Input formatting:**
- Currency inputs: format as user types (add thousands separators on blur)
- Accept both `.` and `,` as decimal separator; normalize on blur to locale convention
- Do NOT use `type="number"` — use `type="text"` with input mask to avoid browser inconsistencies
- Tipo de cambio field: prominent placement above cost table; changes trigger full recalc

**Confidence:** HIGH for layout patterns; MEDIUM for Argentina-specific locale formatting (common convention, not officially standardized)

---

### 3. Multi-Step Form Patterns

**Progress indicator:**
- Linear step indicator at top: `1 Información general → 2 Costos e importación`
- Show step labels, not just numbers
- Completed steps show checkmark; current step highlighted; future steps grayed
- Do NOT use a percentage progress bar — it's misleading when steps have unequal weight

**Navigation rules:**
- "Siguiente" button disabled until required fields in current step are valid
- "Volver" always enabled — never trap user in a step
- Back navigation preserves all entered data
- Keyboard: Tab between fields; Enter in last field of step advances to next

**Validation timing:**
- Inline real-time validation: only after first blur on a field (not on every keystroke)
- On "Siguiente" click: validate all fields in current step; scroll to first error
- Error messages: below the field, red text, specific ("Ingresá un valor mayor a 0", not "Campo inválido")
- Required field indicator: asterisk (*) in label; explained in form header

**Save-and-resume:**
- Auto-save to server on every step advance (not every keystroke)
- Borrador status is the save state — OC exists in DB from first "Siguiente" click
- If user closes browser, returning to OC list shows the incomplete OC in Borrador
- On resume: restore to the last completed step; show "Continuar donde dejaste" banner

**Confidence:** HIGH — multiple authoritative UX sources converge on these patterns

---

### 4. Document Upload UX

**Slot-based model (recommended over generic upload):**
- Define fixed document slots per OC: Factura Comercial, Packing List, Bill of Lading, Certificado de Origen, DUA, SENASA, SIMI, Otros
- Each slot shows: slot name, upload button, filename (if uploaded), preview icon, delete button
- Slots that require a document show a red indicator; optional slots are neutral
- "Otros" slot: multiple files allowed (catch-all for non-standard documents)

**Upload interaction:**
- Click-to-upload (file dialog); drag-and-drop on slot card as enhancement
- PDF-only validation: reject non-PDF files with inline error message ("Solo se aceptan archivos PDF")
- Max file size: 10MB per file; show error if exceeded
- Upload feedback: progress bar within slot card during upload; replace with filename on success
- Preview: clicking filename opens PDF in new browser tab (not inline preview — avoids iframe complexity)

**State indicators per slot:**
```
[Vacío]      → gray border, "Subir PDF" button
[Subiendo]   → progress bar replacing button
[Cargado]    → green checkmark + filename + "Ver" + "Eliminar" buttons
[Error]      → red border + error message + retry button
```

**Role-based doc visibility:**
- Importador: upload + delete on all slots (commercial docs + customs docs)
- Proveedor: view only (no upload, no delete)
- Despachante: upload + delete only on their assigned slots (DUA, SENASA, SIMI)

**Confidence:** HIGH for general patterns; MEDIUM for slot assignment by role (derived from domain logic, not a widely documented pattern)

---

### 5. Dashboard Stat Cards

**Recommended metrics for importador dashboard:**

| Metric | Card Label | Why It Matters |
|--------|-----------|----------------|
| OCs en curso | "Órdenes activas" | Operational awareness; how many balls in the air |
| Valor FOB total del mes | "FOB este mes (USD)" | Spend tracking |
| Costo desembarcado promedio | "Landed cost promedio" | Efficiency benchmark |
| OCs pendientes de documentos | "Docs faltantes" | Actionable alert; prevents customs delays |
| OCs atrasadas (sin movimiento >30d) | "Sin actividad" | Risk flag |
| Próximas llegadas | "Llegadas esta semana" | Planning signal |

**Stat card UX rules:**
- Maximum 5–6 cards on dashboard; more = cognitive overload
- Each card: big number + trend indicator (↑↓ vs last month) + card label
- Color coding: green (on track), amber (attention), red (action required)
- Cards are clickable → filtered OC list (e.g., clicking "Docs faltantes" shows those OCs)
- Do NOT auto-refresh cards — importers check dashboard intentionally; WebSocket for live updates is over-engineering for v1

**Confidence:** MEDIUM — metrics derived from logistics KPI research; specific relevance to Argentine importers is inferred, not verified with user research

---

### 6. Role-Based Visibility Patterns

**Role matrix:**

| Capability | Importador | Proveedor | Despachante |
|-----------|-----------|----------|------------|
| Create OC | Yes | No | No |
| Edit OC (Step 1 + Step 2) | Yes | No | No |
| View OC detail | Yes | Yes | Yes |
| Advance OC status | Yes | No | Partial (v2) |
| Upload commercial docs | Yes | No | No |
| Upload customs docs (DUA, etc.) | Yes | No | Yes |
| Delete documents | Yes | No | Yes (own docs) |
| Export PDF | Yes | Yes | Yes |
| Google Sheets sync | Yes | No | No |
| View cost breakdown | Yes | No | Yes |
| View product table | Yes | Yes | Yes |
| Dashboard | Yes | No | Limited (v2) |

**UX implementation rules:**
- Importador sees all controls — full edit mode
- Proveedor and Despachante see the same OC layout but all inputs are disabled; action buttons hidden
- Do NOT show disabled buttons to external roles — remove them entirely (hiding > disabling for non-owners)
- External roles arrive via invitation email link; they get a scoped token (cannot browse other OCs)
- Role badge displayed in app header so user always knows their context: "Viendo como Proveedor"
- If external user tries a restricted URL: 403 page with "No tenés acceso a esta sección" (not generic 404)

**Access model recommendation:**
- Importador: full account with email/password login
- Proveedor + Despachante: invitation-based; magic link or token per OC (avoids password friction for external collaborators)
- Token scoped to single OC; expires after 30 days of inactivity

**Confidence:** HIGH for RBAC patterns; MEDIUM for magic-link approach (common in B2B tools like Notion guests, Figma share links — pattern is well-established)

---

### 7. PDF Export UX

**Trigger and loading state:**
- "Exportar PDF" button in OC detail header (visible to all roles)
- On click: button enters loading state immediately ("Generando PDF..." + spinner icon)
- Disable button during generation to prevent double-trigger
- Generation time estimate: 1–3 seconds for server-side PDF; show inline spinner, not full-page overlay
- On success: browser auto-download trigger (`Content-Disposition: attachment`); button resets to normal
- On failure: button resets; toast notification "Error al generar el PDF. Intentá de nuevo."

**PDF content recommendation:**
- Header: DrivaOC logo + OC number + fecha + estado
- Section 1: Información general (proveedor, país origen, incoterm, etc.)
- Section 2: Tabla de productos (qty, descripción, precio unit, FOB subtotal)
- Section 3: FOB Total
- Section 4: Costos de importación desglosados por categoría
- Section 5: Tipo de cambio usado + Landed cost total en USD y ARS
- Section 6: Documentos adjuntos (list of uploaded doc names; not embedded files)
- Footer: Generado por DrivaOC + fecha y hora de exportación

**Technical note:** Server-side PDF generation (Puppeteer/wkhtmltopdf/Playwright) produces more consistent output than client-side (jsPDF) for complex financial tables. Plan for server-side from the start.

**Google Sheets sync UX:**
- "Sincronizar con Sheets" button in OC detail or dashboard
- Loading state same as PDF export
- On success: toast "Hoja de cálculo actualizada" + link to Sheet
- One-way only: OC data → Sheet; Sheet changes do not affect OC
- Sheet structure: one row per OC, columns matching OC fields; one tab per month recommended

**Confidence:** HIGH for PDF export UX patterns; MEDIUM for Sheets sync UX (pattern is straightforward but specific implementation details depend on Google Sheets API behavior)

---

## Feature Dependencies Summary

```
MUST EXIST FIRST           → ENABLES
─────────────────────────────────────────────────────────
Auth + Role assignment     → All role-gated features
OC Creation (Step 1)       → Product table, FOB calc
OC Creation (Step 2)       → Cost table, TC field, landed cost
Landed cost computed       → PDF export (Section 4+5)
Landed cost computed       → Google Sheets sync
Document upload slots      → Despachante upload permissions
OC status field            → Status filter on list
OC status field            → Notification emails (v2)
OC detail view             → Proveedor/Despachante read-only access
Proveedor access model     → Shareable link / magic link (v2)
```

---

## Sources

- [UX for Operational Accuracy: Designing Order Management Systems — UITOP](https://uitop.design/blog/designing-order-management-and-inventory-systems/)
- [Enterprise Order Management UX — Fluent Commerce](https://fluentcommerce.com/resources/blog/enterprise-order-management-ux-4-points-to-consider/)
- [The UX of Currency Display — Workday Design (Medium)](https://medium.com/workday-design/the-ux-of-currency-display-whats-in-a-sign-6447cbc4fb88)
- [Currency Input Pattern — UX Patterns for Developers](https://uxpatterns.dev/patterns/forms/currency-input)
- [Table Design UX Guide — Eleken](https://www.eleken.co/blog-posts/table-design-ux)
- [Data Table Design UX Patterns — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)
- [Bulk Action UX — Eleken](https://www.eleken.co/blog-posts/bulk-actions-ux)
- [Pragmatic B2B SaaS Design: The Listing Page — DonUX](https://donux.com/blog/pragmatic-b2b-saas-design-listing)
- [Creating an Effective Multistep Form — Smashing Magazine](https://www.smashingmagazine.com/2024/12/creating-effective-multistep-form-better-user-experience/)
- [Multi-Step Workflow — Clarity Design System](https://clarity.design/documentation/multi-step-workflow)
- [File Upload UX Best Practices — Uploadcare](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [Multiple File Upload Design Guidelines — PatternFly](https://www.patternfly.org/components/file-upload/multiple-file-upload/design-guidelines/)
- [Shipping Logistics KPIs: The Importers Business Guide — Ship4WD](https://ship4wd.com/logistics-shipping/shipping-logistics-kpi)
- [10 Freight Forwarding KPIs — Freightify](https://freightify.com/blog/10-metrics-kpis-freight-forwarding-business)
- [Procurement Dashboard Guide — UseDataBrain](https://www.usedatabrain.com/blog/procurement-dashboards)
- [Role-Based Access Control for Customer Portals — SupportBench](https://www.supportbench.com/role-based-access-control-rbac-customer-portals-explained/)
- [B2B SaaS User Management — WorkOS](https://workos.com/blog/user-management-for-b2b-saas)
- [Export Pattern — IBM Carbon Design System](https://carbondesignsystem.com/community/patterns/export-pattern/)
- [UX Design Patterns for Loading — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback)
- [Inline Editing in Tables — UX Design World](https://uxdworld.com/inline-editing-in-tables-design/)
- [Landed Cost Guide — Finale Inventory](https://www.finaleinventory.com/accounting-and-inventory-software/landed-cost)
- [Landed Cost Module — Microsoft Dynamics 365 Docs](https://learn.microsoft.com/en-us/dynamics365/supply-chain/landed-cost/landed-cost-overview)
- [Purchase Order Status — Bellwether](https://www.bellwethercorp.com/blog/understanding-the-different-purchase-order-statuses/)
- [Supplier Portal UX — Agility Portal](https://agilityportal.io/blog/partner-supplier-portal-collaboration-platform)
- [Import-Export UI/UX Design Tips — Design Delulu](https://www.designdelulu.com/blog/ui-ux-design-tips-for-import-export-companies-deliver-faster-projects)
- [Empty State UX — Eleken](https://www.eleken.co/blog-posts/empty-state-ux)
- [Choosing Modals vs Inline Actions — Medium](https://rakibulism.medium.com/choosing-modals-over-inline-actions-a-ux-case-study-on-table-complexity-2552ee168b5c)
