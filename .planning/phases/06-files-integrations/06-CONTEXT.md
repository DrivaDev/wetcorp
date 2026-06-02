# Phase 6: Files & Integrations - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Upload de PDFs a Cloudinary (todos los roles), emails automáticos con Resend a todos los miembros de la OC excepto al editor, export de PDF descargable con react-pdf, y sincronización automática a Google Sheets al guardar. Al finalizar la fase, el sistema tiene persistencia de documentos real, notificaciones por email, exportación profesional y registro en hoja de cálculo.

No incluye: SEO, meta tags, performance audit (Phase 7). No incluye configuración de múltiples hojas de Sheets ni multi-tenancy.

</domain>

<decisions>
## Implementation Decisions

### Upload de PDFs a Cloudinary

- **D-01:** El upload ocurre **en ambos lugares**: en Step 2 del wizard (DocumentSlots dentro del formulario) y en la página de detalle de la OC. Ambas rutas permiten subir/reemplazar documentos.
- **D-02:** Si el slot ya tiene un PDF, mostrar **modal de confirmación** antes de reemplazar el archivo existente.
- **D-03:** **Todos los roles** (importador, proveedor, despachante) pueden subir documentos a los slots. No hay restricción de rol para el upload.
- **D-04:** Implementar `/api/sign-cloudinary-params` como Route Handler firmado (secret nunca en cliente). `resource_type: 'raw'` para PDFs en Cloudinary.
- **D-05:** Al subir, guardar la URL de Cloudinary en MongoDB (campo correspondiente en `documentos` de la OC). Si el slot ya tenía URL, reemplazarla.

### Emails con Resend

- **D-06:** Email disparado **al crear o actualizar la OC**, siempre que `estado !== 'borrador'`. Borradores no generan notificaciones.
- **D-07:** Email va a **todos los miembros de la OC excepto al editor**. Lógica:
  - Si importador edita → email a `emailsProveedor` + `emailsDespachante`
  - Si proveedor edita → email a email del importador + `emailsDespachante` + otros emails en `emailsProveedor`
  - Si despachante edita → email a email del importador + `emailsProveedor` + otros emails en `emailsDespachante`
  - Subir un documento también dispara este email (misma lógica)
- **D-08:** El cuerpo del email incluye: referencia OC, proveedor, estado, fecha OC, campo **notas** de la OC, y botón/link para ver la OC en el sistema.
- **D-09:** Template React Email con identidad visual del sistema (colores `#0061a6`, `#62b446`, logo).
- **D-10:** Envío fire-and-forget — no bloquea la respuesta al usuario. Si falla el email, la operación principal (guardar OC / subir documento) igual tiene éxito.

### Export PDF con react-pdf

- **D-11:** Botón "Exportar PDF" en `OCDetailHeader`, disponible para **todos los roles**.
- **D-12:** PDF incluye: datos generales (Step 1), tabla de productos + FOB, todos los gastos (despacho, despachante, adicionales, impuestos, otros), y valores finales (FOB, Total Gastos, Landed Cost). Layout a criterio del planner/executor.
- **D-13:** PDF tiene **branding**: header con logo horizontal (`/public/logo-horizontal.svg`), colores `#0061a6` / `#62b446`.
- **D-14:** Implementar como Route Handler `/api/oc/[id]/pdf` con `export const runtime = 'nodejs'`. El botón hace GET a esa ruta → descarga el archivo.

### Google Sheets Sync

- **D-15:** Sync **automático al guardar** la OC (fire-and-forget, nunca `await` en el ciclo de request). No bloquea UI.
- **D-16:** Sistema **single-tenant** — una sola hoja configurada en env vars (`GOOGLE_SHEETS_SPREADSHEET_ID`). Todos los datos van a esa hoja.
- **D-17:** **Una fila por OC**. Al sincronizar: buscar fila existente por `referenciaOC`. Si existe, actualizar. Si no, agregar fila nueva.
- **D-18:** Columnas de la fila: Referencia OC, Proveedor, Estado, Fecha OC, País de Origen, FOB USD, Total Gastos USD, Landed Cost USD.
- **D-19:** La hoja ya existe — no crear headers automáticos. Asumir que el cliente ya tiene la estructura.
- **D-20:** Service account JWT para autenticación con Google Sheets API v4. `GOOGLE_PRIVATE_KEY` con `.replace(/\\n/g, '\n')` al leer de env var (mandatorio por CLAUDE.md).

### Claude's Discretion
- Estructura del template de React Email: el planner/executor elige el layout concreto mientras respete colores y logo de la marca.
- Lógica de búsqueda de fila en Sheets: usar `spreadsheets.values.get` + búsqueda por referenciaOC en columna A, luego `values.update` o `values.append`.
- Manejo del email del importador para notificaciones: obtenerlo de Clerk (`clerkClient().users.getUser(importadorId)`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Patrones críticos del proyecto
- `CLAUDE.md` — Cloudinary `resource_type: 'raw'`, signed upload via API Route (nunca `NEXT_PUBLIC_` para secrets), `@react-pdf/renderer` en serverExternalPackages, Google Sheets `GOOGLE_PRIVATE_KEY` con `.replace(/\\n/g, '\n')`, Google Sheets sync fire-and-forget.

### Modelos y Server Actions existentes
- `src/lib/models/OC.ts` — Schema Mongoose con campo `documentos` (facturaProveedor, facturaDespachante, conocimientoEmbarque, certificadoOrigen, certificadoAnalisis, otro). El upload actualiza estos campos.
- `src/actions/oc.ts` — `updateOC`, `updateOCInfo`, `getOCById`. El upload de documentos necesita un nuevo Server Action `updateOCDocumento(id, slot, url)` o extender `updateOC`.

### Componentes UI existentes
- `src/components/wizard/DocumentSlots.tsx` — Componente `'use client'` con slots fijos. Actualmente maneja upload local (sin Cloudinary). Phase 6 reemplaza el input file por upload real a Cloudinary.
- `src/components/oc-detail/OCDetailHeader.tsx` — Agregar botón "Exportar PDF" aquí.
- `src/components/oc-detail/OCDetailActions.tsx` — Verificar si el botón de export va aquí o en Header.

### Cálculos para el PDF
- `src/lib/wizard-calculations.ts` — Funciones `calcFOBTotal`, `calcTotalGastos`, etc. Usar para calcular los valores que van en el PDF exportado.

### Tipos
- `src/lib/mock-ocs.ts` — `OCDetalle.documentos` con todos los campos de slots.
- `src/lib/wizard-types.ts` — `InfoGeneralState`, `ProductRow`, tipos de gastos para armar el PDF.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DocumentSlots` (`src/components/wizard/DocumentSlots.tsx`): componente 'use client' con 6 slots fijos. Phase 6 agrega lógica de upload real (reemplaza el `<input type="file">` local por upload a Cloudinary). El modal de confirmación es nuevo.
- `OCDetailHeader` (`src/components/oc-detail/OCDetailHeader.tsx`): ya tiene botón "Editar". Agregar botón "Exportar PDF" con misma estructura de estilos.
- `GastosCard`, `ResumenStep1`, `ValueCards`: componentes de display ya construidos. El PDF los replica en formato react-pdf.

### Established Patterns
- API Routes con `export const runtime = 'nodejs'` para todo lo que use Mongoose o react-pdf (ver `src/app/api/webhooks/clerk/route.ts`).
- Server Actions `'use server'` para mutaciones. Upload de documentos puede ir en un Server Action nuevo o en una API Route (Cloudinary signing requiere API Route).
- Fire-and-forget: no usar `await` para Resend ni Google Sheets en el path crítico.
- IDOR guard en toda mutación: verificar acceso antes de modificar.

### Integration Points
- `updateOC` / `updateOCInfo` en `src/actions/oc.ts`: al guardar OC, disparar email fire-and-forget al final del Server Action (después de retornar `{ data: { id } }`).
- `DocumentSlots`: al confirmar upload exitoso, llamar Server Action que actualiza `documentos[slot]` en MongoDB con la URL de Cloudinary, luego disparar email.
- Route Handler `/api/oc/[id]/pdf`: usa `getOCById` para fetchear datos, los pasa a `@react-pdf/renderer`, retorna `application/pdf`.

</code_context>

<specifics>
## Specific Ideas

- El email incluye el campo **notas** de la OC — importante para comunicar instrucciones especiales a proveedor/despachante.
- Sistema single-tenant: solo hay un importador en el sistema. La lógica de "email al importador" puede hardcodear la búsqueda del único usuario con `rol: 'importador'` en MongoDB, o usar el `importadorId` de la OC para buscar en Clerk.
- Google Sheets: la hoja ya existe, no crear ni inicializar. Solo append/update.

</specifics>

<deferred>
## Deferred Ideas

- Notificación al importador cuando proveedor/despachante suben documentos (posible mejora Phase 7 o posterior).
- Configuración per-importador de Google Sheets (requiere multi-tenancy).
- Preview del PDF antes de descargar.

</deferred>

---

*Phase: 6-files-integrations*
*Context gathered: 2026-06-02*
