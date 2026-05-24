# Requirements: DrivaOC

**Defined:** 2026-05-24
**Core Value:** Un importador puede crear una OC, ver el costo total de importación (FOB + gastos) y compartir el estado con su proveedor y despachante — todo desde una sola plataforma.

## v1 Requirements

### Authentication & Roles

- [ ] **AUTH-01**: Usuario puede registrarse con email y contraseña eligiendo su rol (importador / proveedor / despachante)
- [ ] **AUTH-02**: Rol se guarda en `publicMetadata` de Clerk y se sincroniza a MongoDB via webhook `user.created`
- [ ] **AUTH-03**: Middleware de Next.js protege rutas por rol — importador en `/importador/*`, proveedor en `/proveedor/*`, despachante en `/despachante/*`
- [ ] **AUTH-04**: Sesión persiste entre recargas de página (Clerk session token incluye rol en JWT)
- [ ] **AUTH-05**: Usuario puede cerrar sesión desde cualquier página

### Layout & Navigation

- [ ] **LAYOUT-01**: Importador tiene sidebar desplegable con logo, nombre del software (DrivaOC), rol como subtítulo, botones "Dashboard" y "Nueva OC", e info de usuario + cerrar sesión en bottom
- [ ] **LAYOUT-02**: Sidebar colapsado muestra navbar con logo, info de usuario y cerrar sesión
- [ ] **LAYOUT-03**: Proveedor y despachante tienen solo navbar (sin sidebar) con info de usuario y cerrar sesión
- [ ] **LAYOUT-04**: Footer en todas las páginas: "Desarrollado por Driva Dev" con link a `drivadev.com.ar`
- [ ] **LAYOUT-05**: UI completa usa identidad visual Driva Dev (Fira Sans, #EA580C, colores definidos, responsive)

### Dashboard

- [ ] **DASH-01**: Dashboard muestra 4 stat cards inline: OC Totales, En tránsito, En Aduana, Entregadas
- [ ] **DASH-02**: Debajo de stats: lista de todas las OCs del usuario (importador ve todas las suyas; proveedor/despachante solo las donde su email está asignado)
- [ ] **DASH-03**: Cada OC en la lista tiene acciones: visualizar, editar (solo importador), eliminar (solo importador)
- [ ] **DASH-04**: Lista filtrable por proveedor (texto) y por estado (select)

### OC — Step 1: Información General y Productos

- [ ] **OC1-01**: Importador puede iniciar nueva OC — formulario con: Referencia OC, Estado (Pendiente / En tránsito / En aduana / Entregado), Proveedor, Mail proveedor, Mail despachante, País de origen, Fecha OC (date picker mm/dd/yyyy), Llegada estimada (date picker mm/dd/yyyy), Tipo de cambio (número) + divisa (ARS/USD o ARS/EUR), Notas
- [ ] **OC1-02**: Sección Productos: tabla dinámica con agregar/eliminar filas — campos por producto: Producto, Descripción, Cantidad, Valor unitario (USD), Total (USD). Total se calcula automáticamente (Cantidad × Valor unitario). Mínimo 1 producto.
- [ ] **OC1-03**: Valor FOB total = suma de todos los totales de productos. Mostrar en USD y debajo en ARS (calculado con tipo de cambio ingresado)
- [ ] **OC1-04**: Al guardar Step 1, OC se persiste en MongoDB con `estado: "borrador"` y el usuario es redirigido a Step 2 con el ID en la URL
- [ ] **OC1-05**: Todos los cálculos financieros usan `decimal.js`; valores guardados en MongoDB como enteros (centavos)

### OC — Step 2: Gastos, Documentos y Valores Finales

- [ ] **OC2-01**: Step 2 muestra resumen read-only del Step 1 (Proveedor, País, Fecha OC, Llegada estimada, Tipo de cambio, Notas) y lista de productos read-only
- [ ] **OC2-02**: Gastos de importación — Despacho: SIM (ARS), Derechos (ARS), Otros (ARS)
- [ ] **OC2-03**: Gastos de importación — Despachante: Terminal (ARS), Flete internacional (USD), Flete interno (ARS), SENASA (ARS), Despachante (ARS)
- [ ] **OC2-04**: Gastos de importación — Gastos adicionales: Depósito fiscal (ARS), Digitalización (ARS), Estancia de camión (ARS), IIBB (ARS)
- [ ] **OC2-05**: Gastos de importación — Otros gastos: lista dinámica con agregar/eliminar — cada ítem: Descripción (texto), Monto (número), Divisa (ARS / USD)
- [ ] **OC2-06**: Total gastos importación: sumatoria automática de todos los gastos. Mostrar en USD y subtítulo en ARS
- [ ] **OC2-07**: Sección Documentos: 5 slots fijos (Factura proveedor, Factura despachante, Conocimiento de embarque, Certificado de Origen, Otro) — solo PDF, subir a Cloudinary (`resource_type: 'raw'`), guardar URL en MongoDB
- [ ] **OC2-08**: Cards finales inline (en USD con subtítulo en ARS): Valor FOB, Gastos de importación, Costo Landed Total (FOB + gastos)
- [ ] **OC2-09**: Al completar Step 2, estado OC cambia de "borrador" a primer estado real ("Pendiente" u otro seleccionado)

### Cálculos Financieros

- [ ] **CALC-01**: Toda matemática financiera usa `decimal.js` — sin float nativo para evitar errores de precisión
- [ ] **CALC-02**: Conversión ARS/USD usa el tipo de cambio ingresado por el importador en Step 1
- [ ] **CALC-03**: Valores en ARS se muestran en UI como subtítulo/referencia — los valores primarios se guardan en la divisa nativa de cada campo

### Documentos

- [ ] **DOC-01**: Upload de PDFs a Cloudinary usando servidor-firmado (signed upload) — never `NEXT_PUBLIC_` para secrets
- [ ] **DOC-02**: URL de cada documento guardada en el campo correspondiente del documento OC en MongoDB
- [ ] **DOC-03**: Documentos solo visibles y descargables (no editables) para proveedor y despachante

### Notificaciones por Email

- [ ] **NOTIF-01**: Al crear/guardar una OC con mail de proveedor, Resend envía email al proveedor invitándolo a registrarse y ver la OC
- [ ] **NOTIF-02**: Al crear/guardar una OC con mail de despachante, Resend envía email al despachante invitándolo a registrarse y ver la OC
- [ ] **NOTIF-03**: Emails usan templates de `@react-email/components` con identidad visual Driva Dev

### Exportación — PDF

- [ ] **EXPORT-01**: Importador puede exportar OC completa a PDF (acción solo disponible para importador)
- [ ] **EXPORT-02**: PDF generado server-side con `@react-pdf/renderer` via Route Handler — no puppeteer
- [ ] **EXPORT-03**: PDF incluye todos los datos de la OC: info general, productos, gastos, documentos (links), valores finales, branding Driva Dev

### Exportación — Google Sheets

- [ ] **SHEETS-01**: Importador puede sincronizar datos de la OC a una Google Sheet (URL fija en `.env.local`)
- [ ] **SHEETS-02**: Sync usa Google Sheets API v4 con service account JWT — operación asíncrona (no bloquea el guardado de la OC)
- [ ] **SHEETS-03**: Cada OC ocupa una fila en la Sheet con: referencia, estado, proveedor, FOB USD, gastos USD, landed cost USD, fecha OC, fecha llegada estimada

### SEO & Performance

- [ ] **SEO-01**: Meta tags correctos en todas las páginas (title, description, OG tags)
- [ ] **SEO-02**: Sitemap y robots.txt generados
- [ ] **SEO-03**: Next.js Image para imágenes optimizadas; lazy loading donde corresponde
- [ ] **SEO-04**: TypeScript strict mode — sin `any`, sin `as any`
- [ ] **SEO-05**: Variables de entorno en `.env.local` — ninguna clave sensible en código

## v2 Requirements

### Notifications

- **NOTIF-V2-01**: Notificaciones in-app cuando cambia el estado de una OC
- **NOTIF-V2-02**: Email al importador cuando proveedor/despachante acceden por primera vez a una OC

### OC Advanced

- **OC-V2-01**: Historial de cambios por OC (audit log)
- **OC-V2-02**: Comentarios/notas por OC entre roles
- **OC-V2-03**: Duplicar OC existente como template

### Dashboard Advanced

- **DASH-V2-01**: Gráficos de evolución de OCs por período
- **DASH-V2-02**: Exportar lista de OCs a Excel/CSV

### Google Sheets Advanced

- **SHEETS-V2-01**: Sync bidireccional (detectar cambios en Sheet y reflejar en app)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sistema de pedidos / e-commerce | DrivaOC es gestión interna, no punto de venta |
| OAuth login (Google, GitHub) | Email/password con Clerk es suficiente para v1 |
| Notificaciones en tiempo real (WebSockets) | Email es suficiente para el ciclo de importación |
| App móvil nativa | Web responsive cubre el caso de uso |
| Multi-idioma | Solo español v1 |
| Pagos | Fuera del scope — es gestión documental |
| Analytics de métricas de uso | No requerido por el cliente |
| Tipo de cambio automático (BCRA/blue) | Imputación manual — el importador elige el TC a usar |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| LAYOUT-01 | Phase 1 | Pending |
| LAYOUT-02 | Phase 1 | Pending |
| LAYOUT-03 | Phase 1 | Pending |
| LAYOUT-04 | Phase 1 | Pending |
| LAYOUT-05 | Phase 1 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| OC1-01 | Phase 3 | Pending |
| OC1-02 | Phase 3 | Pending |
| OC1-03 | Phase 3 | Pending |
| OC1-04 | Phase 3 | Pending |
| OC1-05 | Phase 3 | Pending |
| OC2-01 | Phase 3 | Pending |
| OC2-02 | Phase 3 | Pending |
| OC2-03 | Phase 3 | Pending |
| OC2-04 | Phase 3 | Pending |
| OC2-05 | Phase 3 | Pending |
| OC2-06 | Phase 3 | Pending |
| OC2-07 | Phase 4 | Pending |
| OC2-08 | Phase 3 | Pending |
| OC2-09 | Phase 3 | Pending |
| CALC-01 | Phase 3 | Pending |
| CALC-02 | Phase 3 | Pending |
| CALC-03 | Phase 3 | Pending |
| DOC-01 | Phase 4 | Pending |
| DOC-02 | Phase 4 | Pending |
| DOC-03 | Phase 4 | Pending |
| NOTIF-01 | Phase 5 | Pending |
| NOTIF-02 | Phase 5 | Pending |
| NOTIF-03 | Phase 5 | Pending |
| EXPORT-01 | Phase 5 | Pending |
| EXPORT-02 | Phase 5 | Pending |
| EXPORT-03 | Phase 5 | Pending |
| SHEETS-01 | Phase 5 | Pending |
| SHEETS-02 | Phase 5 | Pending |
| SHEETS-03 | Phase 5 | Pending |
| SEO-01 | Phase 6 | Pending |
| SEO-02 | Phase 6 | Pending |
| SEO-03 | Phase 6 | Pending |
| SEO-04 | Phase 1 | Pending |
| SEO-05 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after initial definition*
