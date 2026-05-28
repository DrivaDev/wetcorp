# Phase 4: OC Views & Demo Polish - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Crear vistas de detalle de OC (read-only + edición) para los 3 roles, expandir los datos mock con valores realistas, y pulir estados edge-case (vacío, loading, 404). Objetivo: sistema demo-ready para el cliente. No incluye persistencia real en MongoDB (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Layout del detail
- **D-01:** La vista detalle replica las mismas secciones del wizard: Datos OC → Productos → Gastos de importación → Impuestos → Documentos → Valores. Reusar `ResumenStep1`, `GastosCard`, `ValueCards`, `DocumentSlots` en modo read-only. Consistencia visual total con el wizard.
- **D-02:** Header de la página: número OC + badge de estado + breadcrumb "Dashboard > OC-XXX" + botones Editar y Eliminar (importador) o solo Editar (proveedor/despachante).
- **D-03:** Proveedor y despachante ven la misma estructura completa que el importador. La única diferencia: no tienen botón Eliminar. Sí tienen botón Editar que abre el wizard pre-poblado.

### Datos mock completos
- **D-04:** Expandir `mock-ocs.ts` con una interface `OCDetalle` que incluye: productos (con cantidad, valorUSD), gastos de despacho/despachante/adicionales, impuestos, tipoCambio, documentos slots. Al menos 2-3 OCs tendrán datos ricos con números realistas para que ValueCards muestre valores calculados con decimal.js. Las demás muestran estado vacío en sus secciones financieras.
- **D-05:** Los datos mock deben ser realistas: tipo de cambio ~1200 ARS/USD, productos con cantidad y valor coherentes, gastos ARS con valores típicos de importación. El objetivo es que la demo se vea convincente.

### Modo edición
- **D-06:** Editar una OC abre `/importador/oc/[id]/editar` (o `/proveedor/oc/[id]/editar`, `/despachante/oc/[id]/editar`) que monta el mismo wizard de 2 pasos (`Step1Form` + `Step2Form`) con los datos de la OC pre-cargados en sessionStorage como `oc-step1-draft`. Reusar los componentes del wizard sin modificarlos.
- **D-07:** Al "Guardar OC" en modo edición, en Phase 4 se simula la actualización (mismo comportamiento mock que el wizard de creación: toast + redirect al dashboard). Phase 5 implementará el Server Action real.
- **D-08:** Proveedor y despachante pueden editar todo el contenido de la OC. No pueden eliminarla. Sus rutas de edición son análogas: `/proveedor/oc/[id]/editar`, `/despachante/oc/[id]/editar`.

### Estados vacíos y loading
- **D-09:** Loading: skeleton bars con `animate-pulse bg-acento/30`. Replicar el layout real con barras grises de alto similar al contenido. No usar spinner.
- **D-10:** Estado vacío del dashboard (lista sin OCs): ícono o SVG simple + mensaje "Todavía no hay OCs. ¡Creá tu primera orden de compra!" + botón principal `bg-principal` que navega a `/importador/oc/nueva`.
- **D-11:** ID inexistente en `/importador/oc/[id]` o análogos: página 404 custom con mensaje "OC no encontrada" + botón "Volver al dashboard". Mismos estilos del proyecto (Fira Sans, colores Driva Dev). No usar la página 404 default de Next.js.

### Claude's Discretion
- Breadcrumb: implementar como componente simple de texto con `/` como separador. No usar librería externa.
- Skeletons: el planner decide cuántos bloques y alturas según las secciones reales de cada página.
- Cuántas OCs mock tendrán datos ricos vs. vacíos: mínimo 2 con datos completos (ej: OC-003 en_transito y OC-004 en_aduana que son las más interesantes para demo).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tipos y cálculos del wizard (Phase 3)
- `src/lib/wizard-types.ts` — Interfaces InfoGeneralState, ProductRow, GastosDespacho, GastosDespachante, GastosAdicionales, Impuestos, OtroGastoRow, Step1Data. OCDetalle debe ser compatible con estos tipos.
- `src/lib/wizard-calculations.ts` — Funciones de cálculo con decimal.js. Usar para calcular ValueCards en el detalle.

### Componentes reutilizables del wizard
- `src/components/wizard/ResumenStep1.tsx` — Muestra datos OC + productos en read-only. Reusar en detalle.
- `src/components/wizard/GastosCard.tsx` — Card de sección de gastos con subtotal. Reusar en detalle (modo read-only sin onChange).
- `src/components/wizard/ValueCards.tsx` — 4 value cards FOB/Gastos/Landed/Impuestos. Reusar directo.
- `src/components/wizard/DocumentSlots.tsx` — Slots de documentos. Reusar en detalle.
- `src/components/wizard/OtrosGastosSection.tsx` — Sección de otros gastos. Reusar en detalle.

### Datos mock actuales
- `src/lib/mock-ocs.ts` — Interface OC actual (thin: sin productos ni gastos). Expandir con OCDetalle en Phase 4.

### Wizard (flujo de creación/edición)
- `src/components/wizard/WizardPage.tsx` — Root del wizard que se reutiliza en modo edición.
- `src/components/wizard/Step1Form.tsx` — Lee sessionStorage['oc-step1-draft'] al montar. Modo edición pre-carga este key antes de navegar.
- `src/components/wizard/Step2Form.tsx` — Idem Step1Form.

### Patrones del proyecto
- `src/components/dashboard/OCTable.tsx` — Patrón de tabla con overflow-x-auto, thead, badge de estado. Reusar badge de estado en detalle header.
- `src/components/dashboard/StatCard.tsx` — Patrón de card con border-acento. Referencia para skeletons.
- `CLAUDE.md` — Reglas: TypeScript strict, no any, Server Actions para CRUD, `export const runtime = 'nodejs'` en routes con Mongoose.

### Identidad visual
- Brand: `#EA580C` (principal), `#9A3412` (titulares), `#FED7AA` (acento), `#FFF7ED` (fondo), `#1C1917` (texto). Fira Sans. Footer "Desarrollado por Driva Dev".

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ResumenStep1`: ya muestra Datos OC + Productos en read-only — es la base del detalle
- `GastosCard`: recibe `onChange` — en detalle pasarlo como `() => {}` (noop) para read-only
- `ValueCards`: recibe Decimal props — calcular en la página del detalle igual que en Step2Form
- `DocumentSlots`: ya tiene lista + Otros dinámico — reusar directo en detalle
- Badge de estado en `OCTable.tsx` — extraer como componente `EstadoBadge` reutilizable
- `inputClass` y `selectClass` de `Step1Form.tsx` — patrones de inputs ya establecidos
- `formatDateInput()` y `migrateDate()` en Step1Form — reusar para mostrar fechas en DD/MM/AAAA

### Established Patterns
- Todos los route groups usan Server Components para la page.tsx + Client Components para interacción
- `searchParams` en Next.js 16 se lee como `Promise` con `await`
- Rutas dinámicas: `src/app/(importador)/importador/oc/[id]/page.tsx` — patrón estándar Next.js App Router
- sessionStorage key: `'oc-step1-draft'` — usar la misma key para pre-cargar en modo edición

### Integration Points
- Dashboard (`OCTable.tsx`) → link a `/importador/oc/[id]` — los links ya existen o se agregan en esta fase
- Wizard de creación → sin cambios. Modo edición: nueva page en `/[id]/editar` que pre-carga sessionStorage y monta WizardPage
- Middleware de Phase 1 ya protege `/importador/*`, `/proveedor/*`, `/despachante/*` — sin cambios necesarios

</code_context>

<specifics>
## Specific Ideas

- Al menos OC-003 ("Comercial Andina SRL", en_transito) y OC-004 ("Distribuidora Norte", en_aduana) deben tener datos ricos completos para la demo — son los estados más interesantes visualmente
- El estado vacío del dashboard debe tener un CTA claro: botón naranja principal "Crear OC" — no texto gris perdido
- Los skeleton bars deben tener alturas plausibles que imiten el layout real de cada página (no barras genéricas de 4px)

</specifics>

<deferred>
## Deferred Ideas

- Cambio de estado de OC desde la vista detalle → Phase 5 (requiere Server Action)
- Eliminación real de OC → Phase 5 (Server Action deleteOC)
- Permisos granulares por rol (qué campos puede editar cada rol) → Phase 5 o posterior si se necesita
- Notificaciones push cuando cambia el estado → fuera de scope v1

</deferred>

---

*Phase: 4-OC Views & Demo Polish*
*Context gathered: 2026-05-28*
