# Phase 3: OC Wizard UI - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Wizard de creación de OC de 2 pasos — solo importador puede crear. Estado completamente local (sessionStorage), sin persistencia real en backend. Phase 5 conecta el backend real.

Step 1: info general + tabla de productos dinámica + FOB calculado con decimal.js.
Step 2: resumen read-only de Step 1 + 4 secciones de gastos (fijos + dinámica) + slots de documentos (UI vacía, sin upload real) + 3 value cards finales.

Proveedor y despachante ven slots de documentos como read-only (Phase 4 construye las vistas completas de detalle).

</domain>

<decisions>
## Implementation Decisions

### Wizard Navigation
- **D-01:** Sin indicador de progreso visible — solo el título del paso actual. Sin barra de steps ni tabs.
- **D-02:** Botón "Continuar a Step 2" activo solo cuando el formulario es válido (mínimo 1 producto + campos requeridos completos). Deshabilitado si falta algo.
- **D-03:** Step 2 tiene botón "Volver" que regresa a Step 1 con todos los datos intactos (recuperados desde sessionStorage).
- **D-04:** Al hacer click en "Guardar OC" (fin de Step 2): toast de éxito + redirect al dashboard (`/importador/dashboard`). No hay llamada real al backend en Phase 3.

### State Management Between Steps
- **D-05:** Datos de Step 1 se serializan a JSON y se guardan en `sessionStorage` al navegar a Step 2.
- **D-06:** Si el usuario recarga la página estando en Step 2 (`?step=2`): redirigir a `?step=1` y recuperar datos desde sessionStorage para pre-poblar el formulario.
- **D-07:** URL del wizard usa query params: `/importador/oc/nueva?step=1` y `/importador/oc/nueva?step=2`. Una sola `page.tsx` renderiza el step correspondiente según `searchParams.step`.

### Productos Table UX
- **D-08:** Botón "+ Agregar producto" debajo de la tabla (izquierda o centrado). Botón eliminar (Trash2) deshabilitado visualmente cuando queda solo 1 row — mínimo 1 producto obligatorio.
- **D-09:** Totales calculados en tiempo real con cada keystroke. Total por fila = Cantidad × Valor unitario (decimal.js). FOB total = suma de todos los totales. Ambos se actualizan sin perder el foco.
- **D-10:** Campos requeridos por fila: Producto (nombre) + Cantidad + Valor unitario (USD). Descripción es opcional.

### Gastos Layout (Step 2)
- **D-11:** 4 secciones de gastos, cada una en su propia card con borde `border-acento` y título bold:
  - **Despacho:** SIM (ARS), Derechos (ARS), Otros (ARS)
  - **Despachante:** Terminal (ARS), Flete internacional (USD), Flete interno (ARS), SENASA (ARS), Despachante (ARS)
  - **Gastos adicionales:** Depósito fiscal (ARS), Digitalización (ARS), Estancia de camión (ARS), IIBB (ARS)
  - **Otros gastos (dinámica):** lista agregar/eliminar — cada ítem: Descripción + Monto + Divisa (ARS/USD)
- **D-12:** Subtotal visible en cada card de sección (tiempo real). Total global de gastos también en tiempo real. Todos los cálculos con decimal.js.

### Value Cards & Document Slots
- **D-13:** 3 value cards inline al final de Step 2, en fila horizontal (stack en mobile). Cada card: label bold, valor USD grande, subtítulo ARS pequeño. Posición: al final de la página (no sticky/fijo).
  - Card 1: Valor FOB (en USD + ARS)
  - Card 2: Gastos de importación (total en USD + ARS)
  - Card 3: Costo Landed Total = FOB + Gastos (en USD + ARS)
- **D-14:** 5 slots de documentos con UI de estado vacío: `border-dashed border-acento`, ícono Upload (lucide-react), nombre del documento como label. Sin funcionalidad de upload en Phase 3 — solo UI estática. Slots: Factura proveedor, Factura despachante, Conocimiento de embarque, Certificado de Origen, Otro.

### Claude's Discretion
- Layout exacto de los campos de info general en Step 1 (grid de 2 columnas, o columna única en mobile).
- Icono lucide-react específico por stat type en UI de slots.
- Estilos de error/validación (color del borde, texto de error debajo del campo).
- Texto exacto del toast de éxito al guardar.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 3 — goal, success criteria, requirements list (OC1-01 a OC1-03, OC1-05, OC2-01 a OC2-08, CALC-01 a CALC-03, DOC-03)
- `.planning/REQUIREMENTS.md` §OC — Step 1, §OC — Step 2, §Cálculos Financieros, §Documentos — campo por campo de cada sección

### Brand & Constraints
- `CLAUDE.md` §Brand Identity — tokens Tailwind, tipografía
- `.planning/phases/02-dashboard-ui/02-CONTEXT.md` — decisiones de badge/estado (D-04, D-05), patrones de componentes, tokens establecidos

### Existing Code Patterns
- `src/lib/mock-ocs.ts` — interface `OC` con todos los campos actuales; el wizard debe ser compatible con este modelo para Phase 5
- `src/components/layout/Sidebar.tsx` — `cn()` usage, lucide-react import pattern
- `src/lib/utils.ts` — `cn()` para conditional classes

### Financial Calculations
- `CLAUDE.md` §Critical Patterns — `decimal.js` obligatorio, valores monetarios como enteros (centavos) cuando llegue Phase 5

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/utils.ts` — `cn()` para merging condicional de clases. Usar en todos los nuevos componentes.
- `lucide-react` — instalado. Usar para icono Upload (slots), Trash2 (eliminar fila/gasto), Plus (agregar).
- `decimal.js` — **pendiente instalar** (no está en el proyecto aún). Instalar en plan 03-01.
- Tailwind tokens: `text-principal`, `bg-acento`, `text-titulares`, `text-texto`, `border-acento` — todos los componentes del wizard los usan.

### Established Patterns
- `'use client'` obligatorio en componentes con `useState` — el wizard completo lo necesita.
- Touch targets: `min-h-[44px] min-w-[44px]` en botones de icono (add/remove rows).
- Colores de badge de estado establecidos en Phase 2 — no cambiar.
- `border-acento` para bordes de cards, `bg-fondo` para fondos de sección.

### Integration Points
- Wizard vive en `/importador/oc/nueva` → nueva `page.tsx` bajo `src/app/(importador)/importador/oc/nueva/page.tsx`
- "Nueva OC" en Sidebar ya linkea a `/importador/oc/nueva` (sin cambios necesarios en Sidebar)
- Al hacer mock save → redirect a `/importador/dashboard` (ruta existente)
- La interface `OC` en `src/lib/mock-ocs.ts` es el modelo de referencia — los campos del wizard deben mapear a esa estructura

</code_context>

<specifics>
## Specific Ideas

- Conversión ARS = monto_USD × tipo_de_cambio ingresado en Step 1. El tipo de cambio viaja en sessionStorage junto con el resto de los datos de Step 1.
- Flete internacional (USD) en la sección Despachante se convierte a ARS para el subtotal usando el tipo de cambio — no se suma directo en USD.
- "Otros gastos" dinámicos (OC2-05): cada ítem tiene su propia divisa (ARS o USD). Al calcular el total global, los USD se convierten a ARS usando el tipo de cambio para sumar todo en una sola divisa.

</specifics>

<deferred>
## Deferred Ideas

- **Upload real de PDFs** — slots solo tienen UI en Phase 3. Cloudinary upload va en Phase 6.
- **Persistencia en MongoDB** — OC1-04 (guardar borrador) y OC2-09 (cambio de estado) van en Phase 5.
- **Vista detalle de OC** — Phase 4 construye las páginas `/importador/oc/[id]` y las vistas de proveedor/despachante.

</deferred>

---

*Phase: 3-OC Wizard UI*
*Context gathered: 2026-05-27*
