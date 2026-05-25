# Phase 2: Dashboard UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 2-Dashboard UI
**Areas discussed:** OC list layout, Estado set & badges, Stat card style, Dashboard proveedor/despachante

---

## OC List Layout

### Layout type

| Option | Description | Selected |
|--------|-------------|----------|
| Tabla responsive | Filas con columnas fijas, scroll horizontal en mobile | ✓ |
| Cards por fila | Cada OC es una card con info clave | |
| Híbrido tabla/card | Tabla ≥md, cards <md | |

**User's choice:** Tabla responsive

### Columnas

| Option | Description | Selected |
|--------|-------------|----------|
| Nº OC + Proveedor + Estado + Fecha + Acciones | Las 4 columnas más relevantes | ✓ |
| Agregar total FOB/Landed | Nº OC + Proveedor + Estado + Fecha + Total USD + Acciones | |
| Sin proveedor | Nº OC + Estado + Fecha + Acciones | |

**User's choice:** Nº OC + Proveedor + Estado + Fecha + Acciones

### Botones de acción

| Option | Description | Selected |
|--------|-------------|----------|
| Iconos inline | Eye + Pencil + Trash2 lucide-react, tooltips hover | ✓ |
| Dropdown menu | Un botón ⋮ abre un dropdown | |
| Botones con texto | 'Ver' 'Editar' 'Eliminar' como botones pequeños | |

**User's choice:** Iconos inline en la columna Acciones

---

## Estado Set & Badges

### Estados posibles

| Option | Description | Selected |
|--------|-------------|----------|
| Borrador, En proceso, En tránsito, En aduana, Entregada, Cancelada | Ciclo completo | ✓ |
| Pendiente, En tránsito, En aduana, Entregada, Cancelada | Sin Borrador/En proceso | |
| Solo los 4 del roadmap + uno más | Mínimo para demo | |

**User's choice:** Borrador, En proceso, En tránsito, En aduana, Entregada, Cancelada

### Colores de badges

| Option | Description | Selected |
|--------|-------------|----------|
| Solo brand colors | Variaciones orange/amber del sistema de diseño | ✓ |
| Colores semánticos estándar | Verde/Amarillo/Rojo/Gris | |
| Tú decides | Delegar al agente | |

**User's choice:** Solo brand colors

---

## Stat Card Style

### Estilo visual

| Option | Description | Selected |
|--------|-------------|----------|
| Icono + número grande + label | lucide-react icon, número prominente, fondo blanco borde acento | ✓ |
| Solo número + label | Ultra-minimal, sin iconos | |
| Color de acento distinto por card | Cada stat con su propio color de fondo/borde | |

**User's choice:** Icono + número grande + label

### Iconos por card

| Option | Description | Selected |
|--------|-------------|----------|
| Tú decides | Delegar al agente la elección de iconos lógicos | ✓ |
| Definir ahora | FileText, Truck, Package, CheckCircle2 | |

**User's choice:** Tú decides (Claude's discretion)

---

## Dashboard Proveedor/Despachante

### Stat cards para roles secundarios

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, las 4 cards filtradas a sus OCs | UX consistente | ✓ |
| No, solo lista de OCs | Dashboard más simple | |

**User's choice:** Sí, las mismas 4 cards filtradas a sus OCs

### Botones de acción para roles secundarios

| Option | Description | Selected |
|--------|-------------|----------|
| Solo Visualizar | Eye solo para roles secundarios | |
| Visualizar + Editar, sin Eliminar | Eye + Pencil | ✓ (user chose this via freeform) |

**User's choice:** Proveedor y despachante pueden visualizar y editar. No eliminar.

**Notes:** Esto contradice el roadmap original donde "Editar = solo importador". Usuario confirmó explícitamente que quiere cambiar el roadmap. El planner debe actualizar Phase 2 Success Criteria #3 y considerar el impacto en Phase 4 (vistas de edición para roles secundarios).

---

## Claude's Discretion

- Iconos lucide-react específicos por stat card
- Color de badge exacto por estado dentro del brand system
- Skeleton loading design

## Deferred Ideas

- Gráficos de evolución OCs — ya diferido a v2 en STATE.md
- Filtro por fecha range — no mencionado en roadmap, deferido si surge
