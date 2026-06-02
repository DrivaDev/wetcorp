# Phase 5: Backend Core - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Reemplazar toda la capa mock por persistencia real: MongoDB Atlas almacena OCs y usuarios, Clerk webhook sincroniza roles, Server Actions reemplazan los datos hardcodeados. Al finalizar la fase, el sistema persiste OCs reales, las queries están scopeadas por rol, y el dashboard muestra datos de MongoDB.

No incluye: upload de archivos a Cloudinary, emails Resend, export PDF, sync Google Sheets (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Numeración de OC
- **D-01:** El campo `referenciaOC` del Step 1 ES el identificador visible de la OC — el importador lo define libremente (ej: OC-2025-001, ANDINA-05, etc.). MongoDB usa `_id` (ObjectId) como clave interna. No hay auto-numeración del sistema.
- **D-02:** La `referenciaOC` debe ser única por importador. El Server Action `createOC` valida unicidad antes de guardar; si existe, retorna error y Step 1 muestra mensaje inline "Ya existe una OC con esta referencia".

### Flujo wizard → base de datos
- **D-03:** Al completar Step 1 ("Continuar a Paso 2"), el Server Action `createOC` guarda la OC como borrador en MongoDB y retorna el `_id`. El router redirige a `/importador/oc/[id]?step=2` con el ID real. Step 2 fetchea la OC de MongoDB por ID — no usa sessionStorage.
- **D-04:** Al guardar en Step 2 ("Guardar OC"), el Server Action `updateOC` actualiza todos los campos de gastos, impuestos, documentos y el estado. El estado final es el que el importador eligió en Step 1 (sin override automático).
- **D-05:** Flujo de edición: `EditWizardLoader` fetchea la OC completa de MongoDB por ID (en lugar de leer sessionStorage). Al "Guardar OC", `updateOC` actualiza MongoDB directamente. sessionStorage se elimina del flujo de edición en esta fase.

### Acceso y scoping por rol
- **D-06:** Proveedor y despachante se identifican por el email principal de Clerk (`user.emailAddresses[0].emailAddress`). Las queries de MongoDB filtran OCs donde el email está en `emailsProveedor` (para proveedor) o `emailsDespachante` (para despachante).
- **D-07:** La comparación de email es case-insensitive. Implementar con índice de collation o normalizando a minúsculas en el guardado. Al crear/actualizar una OC, normalizar todos los emails a lowercase en el Server Action antes de guardar.

### Borradores
- **D-08:** Las OCs con `estado: 'borrador'` aparecen en el dashboard del importador con badge "Borrador". Son recuperables — el importador puede hacer clic en "Editar" para retomar desde Step 1. No hay TTL; persisten hasta que el importador las elimine o complete.
- **D-09:** Las OCs borrador NO son visibles para proveedor/despachante (aunque tengan el email en la lista). Solo el importador ve sus propios borradores.

### Claude's Discretion
- Estructura del Mongoose model: el planner decide si embebe arrays de productos/gastos directamente en el documento OC o usa subdocumentos separados (embed es lo correcto para este caso de uso).
- Manejo de errores en Server Actions: toast de error inline + no redirect (el usuario puede corregir sin perder el formulario).
- Clerk webhook: implementar con `svix` para validar la firma del webhook antes de procesar.
- Stats del dashboard: calcular en el Server Action `getOCs` mediante MongoDB aggregation, no en el cliente.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Patrones críticos del proyecto
- `CLAUDE.md` — Singleton MongoDB (`global.mongooseCache`, maxPoolSize: 5, bufferCommands: false), Clerk role check (`sessionClaims?.metadata?.role`), valores monetarios en centavos, `export const runtime = 'nodejs'` en routes con Mongoose, Server Actions para CRUD.

### Tipos del wizard (schema del modelo OC)
- `src/lib/wizard-types.ts` — Interfaces `InfoGeneralState`, `ProductRow`, `GastosDespacho`, `GastosDespachante`, `GastosAdicionales`, `Impuestos`, `OtroGastoRow`, `Step1Data`. El Mongoose model OC debe ser compatible con estos tipos.
- `src/lib/mock-ocs.ts` — Interface `OCDetalle` (extiende `OC`): contiene la estructura completa de una OC incluyendo `gastosDespacho`, `gastosDespachante`, `gastosAdicionales`, `impuestos`, `otrosGastos`, `documentos`, `tipoCambio`, `divisa`. Usar como referencia para el modelo Mongoose.

### Cálculos (para verificación en backend si se necesita)
- `src/lib/wizard-calculations.ts` — Funciones con decimal.js. Los valores calculados (totales) NO se guardan en MongoDB — se recalculan en el cliente/servidor según se necesite.

### Flujo actual del wizard (para reemplazar sessionStorage)
- `src/components/wizard/Step1Form.tsx` — Lee/escribe `sessionStorage['oc-step1-draft']`. En Phase 5 esto se reemplaza por fetch de MongoDB.
- `src/components/wizard/Step2Form.tsx` — Ídem. Lee de sessionStorage al montar.
- `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` — Actualmente escribe sessionStorage antes de montar WizardPage. En Phase 5 fetchea de DB.

### Autenticación
- Phase 1 middleware: `src/middleware.ts` — Ya protege las rutas por route group. Clerk JWT tiene `sessionClaims.metadata.role`.

### Dashboard (consumidor de getOCs)
- `src/app/(importador)/importador/dashboard/page.tsx` — Consumirá `getOCs` Server Action.
- `src/components/dashboard/OCTable.tsx` — Espera array de OCs con interfaz `OC` de `mock-ocs.ts`.
- `src/components/dashboard/StatCard.tsx` — Espera props numéricas de stats.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/wizard-types.ts` — Tipos listos para el schema Mongoose. GastosDespacho, GastosDespachante, etc. mapean directamente a subdocumentos embebidos.
- `src/lib/mock-ocs.ts` → `OCDetalle` — referencia completa de todos los campos que la OC debe persistir en MongoDB.
- `src/components/dashboard/OCTable.tsx` — Acepta `OC[]` prop. Con backend real, la page.tsx del dashboard llama `getOCs` y pasa el resultado directamente.

### Established Patterns
- `export const runtime = 'nodejs'` — OBLIGATORIO en cualquier route o Server Action que importe Mongoose.
- Server Actions pattern: `'use server'` en archivo separado o inline. Retornar `{ data }` en éxito o `{ error: string }` en fallo.
- Monetary values: guardar en **centavos** (integer). Los `string` del wizard se convierten con `Math.round(parseFloat(val) * 100)` antes de guardar.

### Integration Points
- Step 1 (`handleContinuar`) → llamar Server Action `createOC` → obtener `_id` → `router.push('/importador/oc/[id]?step=2')`
- Step 2 (`handleGuardar`) → llamar Server Action `updateOC` con el ID de la URL → redirect al dashboard
- Dashboard page.tsx → llamar Server Action `getOCs` → pasar a OCTable + calcular stats
- `/api/webhooks/clerk` → API Route (no Server Action) para recibir webhook de Clerk

</code_context>

<specifics>
## Specific Ideas

- Los emails de proveedor/despachante deben normalizarse a lowercase en el Server Action al guardar — así la query case-insensitive es más simple (comparación exacta tras normalización).
- El borrador creado en Step 1 debe tener suficiente información para mostrarse en el dashboard: al menos `referenciaOC`, `proveedor`, `estado: 'borrador'`, `fecha`.

</specifics>

<deferred>
## Deferred Ideas

- Upload de documentos a Cloudinary → Phase 6
- Emails Resend al asignar proveedor/despachante → Phase 6
- Eliminar Cloudinary asset al borrar OC → Phase 6
- Historial de cambios / audit log → fuera de scope v1
- Clonación de OC → fuera de scope v1

</deferred>

---

*Phase: 5-Backend Core*
*Context gathered: 2026-06-02*
