# Roadmap: DrivaOC

## Overview

DrivaOC se construye en seis fases que siguen la cadena de dependencias dura del sistema: primero la fundación de auth y layout (sin la cual ninguna ruta existe), luego el dashboard, luego el wizard de OC de dos pasos con cálculos financieros, luego los uploads de documentos a Cloudinary, luego las tres integraciones externas (email, PDF export, Google Sheets), y finalmente el pulido SEO y de performance. Cada fase entrega una capacidad completa y verificable antes de que comience la siguiente.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Auth** - Next.js scaffolding, Clerk auth con roles, route groups por rol, sidebar/navbar/footer, identidad visual Driva Dev
- [ ] **Phase 2: Dashboard** - Stats cards y lista de OCs filtrable (con seed data) para los tres roles
- [ ] **Phase 3: OC Wizard** - Wizard completo de 2 pasos: productos + gastos de importación, cálculos con decimal.js, persistencia draft → activo
- [ ] **Phase 4: Document Uploads** - 5 slots de PDF a Cloudinary con signed upload, URLs en MongoDB, lectura para proveedor/despachante
- [ ] **Phase 5: Integrations** - Email Resend al asignar OC, export PDF con react-pdf, sync a Google Sheets
- [ ] **Phase 6: SEO & Polish** - Meta tags, OG, sitemap, robots.txt, Next.js Image, audit de performance

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Cualquier usuario puede registrarse eligiendo su rol, iniciar sesión y ser redirigido a la ruta protegida correcta según su rol, dentro de una UI que respeta la identidad visual de Driva Dev
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, SEO-04, SEO-05
**Success Criteria** (what must be TRUE):
  1. Usuario puede registrarse con email/contraseña eligiendo rol (importador / proveedor / despachante) y el rol queda guardado en publicMetadata de Clerk y sincronizado a MongoDB via webhook
  2. Al iniciar sesión, el middleware redirige automáticamente a `/importador`, `/proveedor` o `/despachante` según el rol, y una sesión activa persiste al recargar la página
  3. Usuario puede cerrar sesión desde cualquier página y es redirigido al login
  4. Importador ve sidebar colapsable con logo DrivaOC, botones Dashboard y Nueva OC, e info de usuario; proveedor y despachante ven solo navbar
  5. Todas las páginas muestran footer "Desarrollado por Driva Dev", usan Fira Sans, colores Driva Dev (#EA580C, #9A3412, etc.) y son responsive
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 01-01: Next.js project init, TypeScript strict, Tailwind, Fira Sans, env vars, MongoDB singleton, Atlas Network Access
- [ ] 01-02: Clerk setup — registro con rol, webhook user.created → MongoDB, middleware con catch-all matcher, route groups (importador)(proveedor)(despachante)
- [ ] 01-03: Layout components — sidebar importador (colapsable), navbar proveedor/despachante, footer, identidad visual completa

### Phase 2: Dashboard
**Goal**: Cada rol puede ver su dashboard con stats de OCs y una lista filtrable de las OCs que le corresponden
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. Importador ve 4 stat cards (OC Totales, En tránsito, En Aduana, Entregadas) calculadas desde sus OCs reales en MongoDB
  2. La lista de OCs muestra todas las OCs del importador; proveedor y despachante ven solo las OCs donde su email está en el campo correspondiente
  3. Cada OC en la lista tiene botones Visualizar, Editar (solo importador) y Eliminar (solo importador) que funcionan correctamente
  4. La lista se puede filtrar por texto de proveedor y por estado (select) simultáneamente
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 02-01: OC model Mongoose + seed data, Server Actions para queries scoped por rol
- [ ] 02-02: Dashboard UI — stat cards, lista de OCs con badges de estado, filtros, acciones por rol
- [ ] 02-03: OC detail view read-only (todos los roles pueden ver), skeleton loading states, empty state con CTA

### Phase 3: OC Wizard
**Goal**: El importador puede crear una OC completa en dos pasos, con cálculos financieros precisos usando decimal.js, persistencia como borrador en Step 1 y activación en Step 2
**Depends on**: Phase 2
**Requirements**: OC1-01, OC1-02, OC1-03, OC1-04, OC1-05, OC2-01, OC2-02, OC2-03, OC2-04, OC2-05, OC2-06, OC2-08, OC2-09, CALC-01, CALC-02, CALC-03
**Success Criteria** (what must be TRUE):
  1. Importador puede completar Step 1 (info general + tabla de productos dinámica), ver el FOB total calculado automáticamente en USD y ARS, y guardar — la OC aparece en MongoDB como borrador y el usuario es redirigido a Step 2 con el ID en la URL
  2. Step 2 muestra un resumen read-only del Step 1 y permite ingresar todos los gastos de importación (Despacho, Despachante, Adicionales, Otros dinámicos); los totales se recalculan en tiempo real
  3. Las cards finales (Valor FOB, Gastos de importación, Costo Landed Total) muestran valores correctos en USD con subtítulo en ARS usando el tipo de cambio ingresado
  4. Al completar Step 2, el estado de la OC cambia de "borrador" al estado seleccionado y la OC es visible en el dashboard
  5. Toda matemática financiera usa decimal.js y los valores se guardan en MongoDB como enteros (centavos), sin errores de punto flotante
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: OC model extensión para gastos + valores finales, Server Actions create/update OC, decimal.js utils
- [ ] 03-02: Step 1 form — info general, tabla de productos dinámica, cálculo FOB live, guardado como borrador
- [ ] 03-03: Step 2 form — resumen read-only Step 1, secciones de gastos, gastos otros dinámicos, cards finales landed cost, activación OC

### Phase 4: Document Uploads
**Goal**: El importador puede subir PDFs a los 5 slots de documentos de una OC vía Cloudinary, y proveedor/despachante pueden ver y descargar esos documentos
**Depends on**: Phase 3
**Requirements**: OC2-07, DOC-01, DOC-02, DOC-03
**Success Criteria** (what must be TRUE):
  1. Importador puede subir un PDF a cualquiera de los 5 slots nombrados (Factura proveedor, Factura despachante, Conocimiento de embarque, Certificado de Origen, Otro) y la URL queda guardada en MongoDB
  2. El upload usa signed upload via endpoint API Route — ningún secret aparece en el bundle del cliente
  3. Proveedor y despachante pueden ver y descargar (no subir ni eliminar) los documentos de las OCs que les corresponden
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: Cloudinary signed upload endpoint (/api/sign-cloudinary-params), resource_type raw, integración con OC model
- [ ] 04-02: Document slots UI — 5 slots con upload/preview/delete para importador, vista read-only para proveedor/despachante

### Phase 5: Integrations
**Goal**: Al asignar proveedor/despachante en una OC el sistema envía emails de notificación; el importador puede exportar la OC a PDF y sincronizarla a Google Sheets
**Depends on**: Phase 4
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, EXPORT-01, EXPORT-02, EXPORT-03, SHEETS-01, SHEETS-02, SHEETS-03
**Success Criteria** (what must be TRUE):
  1. Al guardar una OC con mail de proveedor o despachante, Resend envía un email con template React Email (identidad visual Driva Dev) invitando al destinatario a ver la OC
  2. Importador puede hacer clic en "Exportar PDF" y el navegador descarga automáticamente un PDF generado server-side con react-pdf que incluye info general, productos, gastos, links de documentos y branding Driva Dev
  3. Importador puede hacer clic en "Sincronizar a Sheets" y la OC queda registrada como fila en la Google Sheet configurada en .env — la operación no bloquea la UI y reporta éxito o error
**Plans**: TBD

Plans:
- [ ] 05-01: Resend + React Email — templates con identidad Driva Dev, envío al guardar OC con proveedor/despachante asignado
- [ ] 05-02: PDF export — Route Handler con react-pdf, serverExternalPackages config, layout completo de OC, auto-download
- [ ] 05-03: Google Sheets sync — service account JWT, fire-and-forget Server Action, newline fix para private key, fila por OC

### Phase 6: SEO & Polish
**Goal**: Todas las páginas públicas tienen meta tags correctos, sitemap y robots.txt; las imágenes están optimizadas y el sitio pasa el audit de performance
**Depends on**: Phase 5
**Requirements**: SEO-01, SEO-02, SEO-03
**Success Criteria** (what must be TRUE):
  1. Cada página tiene title, description y OG tags correctos generados via Next.js Metadata API
  2. `/sitemap.xml` y `/robots.txt` son accesibles y contienen las rutas correctas
  3. Todas las imágenes del sitio usan `next/image` con lazy loading y no hay imágenes sin dimensiones explícitas
**Plans**: TBD

Plans:
- [ ] 06-01: Meta tags y OG con Next.js Metadata API en todas las páginas, sitemap.xml dinámico, robots.txt
- [ ] 06-02: Next.js Image en todos los assets, lazy loading audit, Vercel Analytics review, correcciones de performance

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 0/3 | Not started | - |
| 2. Dashboard | 0/3 | Not started | - |
| 3. OC Wizard | 0/3 | Not started | - |
| 4. Document Uploads | 0/2 | Not started | - |
| 5. Integrations | 0/3 | Not started | - |
| 6. SEO & Polish | 0/2 | Not started | - |
