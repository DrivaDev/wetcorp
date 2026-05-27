# Roadmap: DrivaOC

## Overview

**Estrategia: Frontend First**

Las primeras 4 fases construyen toda la UI con datos mock y estado local — suficiente para demos al cliente. Las últimas 3 fases conectan el backend real, las integraciones y el SEO.

Esta división permite:
- **Demo temprana** (tras Phase 2): mostrar dashboards y navegación por rol
- **Demo completa** (tras Phase 4): wizard de OC completo, vistas, cálculos
- **Producción** (tras Phase 7): datos reales, emails, exports, SEO

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### Frontend Phases

- [x] **Phase 1: Foundation & Auth** — Next.js scaffolding, Clerk auth con roles, route groups, sidebar/navbar/footer, identidad visual Driva Dev ✓ 2026-05-25
- [x] **Phase 2: Dashboard UI** — Stats cards y lista de OCs filtrable con datos mock, vistas por rol ✓ 2026-05-26
- [ ] **Phase 3: OC Wizard UI** — Wizard 2 pasos completo con estado local: productos, gastos, cálculos decimal.js, slots de documentos, value cards
- [ ] **Phase 4: OC Views & Demo Polish** — Vista detalle de OC (todos los roles), modo edición, estados vacíos/error/loading pulidos

### Backend Phases

- [ ] **Phase 5: Backend Core** — MongoDB Atlas, Mongoose models, Clerk webhook, Server Actions, replace mock data con queries reales
- [ ] **Phase 6: Files & Integrations** — Cloudinary signed upload, email Resend, export PDF con react-pdf, sync Google Sheets
- [ ] **Phase 7: SEO & Polish** — Meta tags, OG, sitemap, robots.txt, Next.js Image, audit performance

## Phase Details

---

### Phase 1: Foundation & Auth
**Goal**: Cualquier usuario puede registrarse eligiendo su rol y ser redirigido a la ruta protegida correcta, dentro de una UI con identidad Driva Dev completa
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-03, AUTH-04, AUTH-05, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, SEO-04, SEO-05
**Note**: AUTH-02 (webhook MongoDB) → Phase 5. Clerk guarda el rol en publicMetadata — funcional sin MongoDB.
**Success Criteria**:
  1. Usuario puede registrarse eligiendo rol (importador / proveedor / despachante); rol queda en Clerk publicMetadata y el middleware redirige correctamente
  2. Al iniciar sesión, middleware redirige a `/importador`, `/proveedor` o `/despachante` según rol; sesión persiste al recargar
  3. Usuario puede cerrar sesión desde cualquier página
  4. Importador ve sidebar colapsable con logo DrivaOC, botones Dashboard y Nueva OC, info de usuario; proveedor/despachante ven solo navbar
  5. Todas las páginas: footer "Desarrollado por Driva Dev", Fira Sans, colores Driva Dev, responsive en mobile/desktop
**UI hint**: yes

Plans:
- [x] 01-01: Next.js init — TypeScript strict, Tailwind + colores Driva Dev, Fira Sans, estructura de carpetas, `.env.example`, logos SVG a `public/` ✓ 2026-05-25
- [x] 01-02: Clerk setup — signup con campo de rol, publicMetadata, middleware con catch-all matcher, route groups `(importador)` `(proveedor)` `(despachante)` ✓ 2026-05-25 [HUMAN CHECKPOINT PENDING]
- [x] 01-03: Layout components — sidebar importador colapsable, navbar compartida, footer, wiring de layouts por route group ✓ 2026-05-25

---

### Phase 2: Dashboard UI
**Goal**: Cada rol puede ver su dashboard con stats y lista de OCs filtrable (datos mock para demo)
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Note**: Datos mock hardcodeados — queries reales conectan en Phase 5.
**Success Criteria**:
  1. Dashboard muestra 4 stat cards (OC Totales, En tránsito, En Aduana, Entregadas) con valores mock
  2. Lista de OCs renderiza mock data con badges de estado coloridos; importador ve todas, proveedor/despachante ven subset según rol
  3. Botones Visualizar y Editar visibles para todos los roles; Eliminar (Trash2) solo para importador — per D-08
  4. Filtros por proveedor (text input) y estado (select) filtran la lista en el cliente
**UI hint**: yes

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — Mock data layer: `src/lib/mock-ocs.ts` con tipos TypeScript OC y array de 10 OCs ficticias que cubren los 6 estados ✓ 2026-05-25

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02-PLAN.md — Dashboard UI components: StatCard, OCTable con badges y skeleton loading, DeleteModal, EmptyState ✓ 2026-05-25

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 02-03-PLAN.md — Filtros + wireo de páginas: FilterBar, dashboards de importador/proveedor/despachante con datos filtrados por rol ✓ 2026-05-26

**Cross-cutting constraints:**
- Tokens brand system en todos los componentes: `text-principal`, `bg-acento`, `border-acento`, `text-titulares`, `text-texto`
- `'use client'` solo donde hay `useState` (OCTable, FilterBar, DeleteModal, páginas dashboard)
- Touch targets `min-h-[44px] min-w-[44px]` en todos los botones de icono

---

### Phase 3: OC Wizard UI
**Goal**: El importador puede completar el wizard de OC de 2 pasos con todos los campos, cálculos financieros precisos y slots de documentos (estado local, sin persistencia real)
**Depends on**: Phase 2
**Requirements**: OC1-01, OC1-02, OC1-03, OC1-05, OC2-01, OC2-02, OC2-03, OC2-04, OC2-05, OC2-06, OC2-07, OC2-08, CALC-01, CALC-02, CALC-03, DOC-03
**Note**: OC1-04 (persistir en MongoDB) + OC2-09 (cambio de estado) → Phase 5. Navegación entre steps via URL params + sessionStorage temporal. DOC-03 incluida aquí como vista read-only de slots (sin upload real aún).
**Success Criteria**:
  1. Step 1: todos los campos de info general + tabla de productos dinámica (agregar/eliminar filas) con FOB auto-calculado en USD y ARS usando `decimal.js`
  2. Navegación Step 1 → Step 2 preserva los datos del wizard (sessionStorage o URL params); Step 2 muestra resumen read-only de Step 1
  3. Step 2: todas las secciones de gastos (Despacho, Despachante, Adicionales, Otros dinámicos) con total de gastos recalculado en tiempo real
  4. Cards finales (Valor FOB, Gastos, Costo Landed Total) muestran valores correctos en USD y ARS
  5. 5 slots de documentos visibles con estado "vacío" UI — proveedor/despachante ven slots read-only
**UI hint**: yes
**Plans:** 3 plans

Plans:
**Wave 1**
- [ ] 03-01-PLAN.md — Tipos + cálculos + page.tsx + Step1Form + ProductosTable: decimal.js instalado, wizard-types.ts, wizard-calculations.ts, page.tsx Server Component async, formulario Step 1 con info general y tabla de productos dinámica con FOB en tiempo real

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 03-02-PLAN.md — Step2Form completo: ResumenStep1 read-only, GastosCard (Despacho/Despachante/Adicionales), OtrosGastosSection dinámica, total global de gastos live, botones Volver/Guardar OC con toast + redirect
- [ ] 03-03-PLAN.md — Cierre del wizard: ValueCards (FOB/Gastos/Landed Total en USD+ARS), DocumentSlots (5 slots estáticos dashed), WizardPage root + integración en Step2Form

---

### Phase 4: OC Views & Demo Polish
**Goal**: El sistema es demo-ready: OC detail view completa, modo edición funcional, estados vacíos/error/loading pulidos
**Depends on**: Phase 3
**Requirements**: (no nuevos REQ-IDs — polish de todos los anteriores)
**Note**: Esta fase refina la UX para que las demos al cliente sean convincentes. Crea las páginas que faltan (detail, edit) y pule estados edge case. Proveedor y despachante tienen vistas de edición per D-08 (decidido en Phase 2).
**Success Criteria**:
  1. Existe página `/importador/oc/[id]` con vista completa read-only de la OC (info general, productos, gastos, documentos, valores)
  2. Existe página `/importador/oc/[id]/editar` con el wizard pre-poblado con datos de la OC mock
  3. Proveedor ve `/proveedor/oc/[id]` con vista read-only sin botón de eliminación; tiene botón Editar que lleva a `/proveedor/oc/[id]/editar`
  4. Despachante ve `/despachante/oc/[id]` análogo con vista read-only y botón Editar
  5. Todos los estados edge-case tienen UI: lista vacía, formulario con errores de validación, loading skeleton en cada página
**UI hint**: yes

Plans:
- [ ] 04-01: OC detail page (importador) — layout full con todas las secciones, botones Editar/Eliminar, breadcrumb
- [ ] 04-02: OC detail pages (proveedor + despachante) — vistas read-only con botón Editar, branding Driva Dev, sin botón Eliminar
- [ ] 04-03: Polish general — validación de formularios (react-hook-form + zod), error boundaries, 404 page, loading skeletons consistentes

---

### Phase 5: Backend Core
**Goal**: Todos los datos son reales — MongoDB persiste OCs, Clerk sincroniza roles, Server Actions reemplazan los datos mock
**Depends on**: Phase 4
**Requirements**: AUTH-02, OC1-04, OC2-09, DOC-01, DOC-02
**Success Criteria**:
  1. Clerk webhook `user.created` sincroniza usuario y rol a MongoDB; role check en middleware usa JWT claim
  2. Step 1 guarda OC como `borrador` en MongoDB y redirige a Step 2 con ID real en URL
  3. Step 2 actualiza OC en MongoDB; al completar, estado cambia de "borrador" al estado seleccionado y OC aparece en dashboard real
  4. Stats del dashboard se calculan desde MongoDB con queries reales scoped por rol
  5. Eliminar OC borra el documento de MongoDB; filtros usan queries de MongoDB

Plans:
- [ ] 05-01: MongoDB setup — singleton `lib/mongodb.ts` (maxPoolSize 5), modelos Mongoose (User, OC con embedded products/expenses/docs), Clerk webhook `/api/webhooks/clerk`
- [ ] 05-02: Server Actions CRUD — createOC, updateOC, deleteOC, getOCs (scoped por rol), getOCById; replace mock data en dashboard y detail pages
- [ ] 05-03: Wizard wiring real — Step 1 crea borrador en DB, Step 2 updates y activa, stat cards calculadas desde MongoDB

---

### Phase 6: Files & Integrations
**Goal**: Upload de PDFs funcional, emails de notificación automáticos, export a PDF descargable, sync a Google Sheets
**Depends on**: Phase 5
**Requirements**: DOC-01, DOC-02, DOC-03, NOTIF-01, NOTIF-02, NOTIF-03, EXPORT-01, EXPORT-02, EXPORT-03, SHEETS-01, SHEETS-02, SHEETS-03
**Success Criteria**:
  1. Importador puede subir PDF a cualquiera de los 5 slots — upload via signed endpoint → Cloudinary (`resource_type: raw`) → URL guardada en MongoDB
  2. Al guardar OC con proveedor/despachante asignado, Resend envía email con template React Email (identidad Driva Dev)
  3. "Exportar PDF" descarga PDF generado con `@react-pdf/renderer` en Route Handler con `export const runtime = 'nodejs'`
  4. "Sincronizar a Sheets" agrega fila en Google Sheet configurada — operación fire-and-forget, no bloquea UI

Plans:
- [ ] 06-01: Cloudinary PDF upload — `/api/sign-cloudinary-params` firmado, CldUploadWidget o upload directo, actualización de URL en MongoDB
- [ ] 06-02: Resend + React Email — templates con identidad Driva Dev, envío automático al crear/actualizar OC con proveedor/despachante
- [ ] 06-03: PDF export + Google Sheets — Route Handler react-pdf, layout completo de OC, Server Action Sheets con service account JWT (`.replace(/\\n/g, '\n')`)

---

### Phase 7: SEO & Polish
**Goal**: El sitio es production-ready: meta tags, sitemap, performance y responsive completamente auditados
**Depends on**: Phase 6
**Requirements**: SEO-01, SEO-02, SEO-03
**Success Criteria**:
  1. Cada página tiene title, description y OG tags generados via Next.js Metadata API
  2. `/sitemap.xml` y `/robots.txt` accesibles con rutas correctas
  3. Todas las imágenes usan `next/image` con lazy loading; no hay renders sin dimensiones

Plans:
- [ ] 07-01: Meta tags y OG con Next.js Metadata API en todas las páginas, sitemap.xml dinámico, robots.txt
- [ ] 07-02: Next.js Image audit, lazy loading, Vercel deploy review, correcciones finales de responsive

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

**Demo milestones:**
- After Phase 2: Demo de navegación + dashboard por rol
- After Phase 4: Demo completa de todo el flujo de OC
- After Phase 7: Producción

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 3/3 | Complete ✓ | 01-01 ✓, 01-02 ✓, 01-03 ✓ 2026-05-25 |
| 2. Dashboard UI | 3/3 | Complete ✓ | 02-01 ✓, 02-02 ✓, 02-03 ✓ 2026-05-26 |
| 3. OC Wizard UI | 0/3 | Planned | 03-01, 03-02, 03-03 — ready to execute |
| 4. OC Views & Demo Polish | 0/3 | Not started | - |
| 5. Backend Core | 0/3 | Not started | - |
| 6. Files & Integrations | 0/3 | Not started | - |
| 7. SEO & Polish | 0/2 | Not started | - |
