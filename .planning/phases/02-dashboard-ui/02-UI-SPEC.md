---
phase: 2
slug: dashboard-ui
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-25
---

# Phase 2 — UI Design Contract: Dashboard UI

> Contrato visual e interactivo para Phase 2. Generado por gsd-ui-researcher, verificado por gsd-ui-checker.

---

## Design System

| Propiedad | Valor |
|-----------|-------|
| Tool | none (plain Tailwind v4 con @theme tokens) |
| Preset | no aplica |
| Component library | none — componentes custom |
| Icon library | lucide-react (ya instalado) |
| Font | Fira Sans (Google Fonts) vía `--font-fira-sans` CSS variable |

**Tokens declarados en `src/app/globals.css`:**

| Token Tailwind | Hex | Nombre |
|----------------|-----|--------|
| `text-principal` / `bg-principal` / `border-principal` | `#EA580C` | Naranja principal |
| `text-titulares` / `bg-titulares` | `#9A3412` | Marrón titulares |
| `bg-acento` / `border-acento` / `text-acento` | `#FED7AA` | Naranja suave acento |
| `bg-fondo` | `#FFF7ED` | Fondo cálido |
| `text-texto` | `#1C1917` | Texto base |

No hay shadcn. No hay registros de componentes externos. Sin componentes de terceros.

---

## Spacing Scale

Escala basada en múltiplos de 4px usando clases Tailwind estándar:

| Token | Clase Tailwind | Valor | Uso |
|-------|----------------|-------|-----|
| xs | `gap-1` / `p-1` | 4px | Gaps entre iconos y texto inline |
| sm | `gap-2` / `p-2` | 8px | Padding interno de badges, gaps compactos |
| md | `gap-4` / `p-4` | 16px | Padding de cards, celdas de tabla, inputs |
| lg | `gap-6` / `p-6` | 24px | Padding de secciones, header de tabla |
| xl | `gap-8` / `p-8` | 32px | Separación entre secciones (stats → tabla) |
| 2xl | `py-12` | 48px | Padding vertical del empty state |
| 3xl | `py-16` | 64px | No usado en Phase 2 |

**Excepción:** Touch targets de botones de acción en tabla — mínimo `min-w-[44px] min-h-[44px]` para cumplir WCAG 2.5.5. Patrón existente en `Sidebar.tsx`.

---

## Typography

Fira Sans — 4 pesos definidos, 4 roles:

| Rol | Clase Tailwind size | Clase Tailwind weight | Line Height | Uso |
|-----|--------------------|-----------------------|-------------|-----|
| Display | `text-4xl` | `font-bold` (700) | `leading-tight` (1.25) | Número grande en stat card |
| Heading | `text-xl` | `font-bold` (700) | `leading-snug` (1.375) | Título de sección (ej. "Órdenes de Compra") |
| Body | `text-base` | `font-normal` (400) | `leading-relaxed` (1.625) | Texto de tabla, labels de inputs |
| Caption | `text-sm` | `font-light` (300) | `leading-normal` (1.5) | Label de stat card, texto secundario, badges |

**Nota:** `text-xs` se reserva únicamente para el subtítulo de rol en Sidebar (patrón existente `text-xs font-light text-titulares`). No se usa en componentes de Phase 2.

---

## Color

Distribución 60/30/10 del brand system:

| Rol | Token | Hex | Uso |
|-----|-------|-----|-----|
| Dominante (60%) | `bg-fondo` | `#FFF7ED` | Background de página, fondo del dashboard |
| Secundario (30%) | `bg-white` + `border-acento` | `#FFFFFF` + `#FED7AA` | Cards de stats, contenedor de tabla, inputs |
| Acento (10%) | `bg-acento` / `bg-acento/50` | `#FED7AA` | Solo para: active row hover en tabla, badge `en_transito`, borde de stat cards, borde de filter bar |
| Destructivo | `text-red-600` / `hover:text-red-700` | — | Solo el ícono Trash2 (eliminar OC) — sin fondos rojos |

**Acento reservado para:**
1. Borde de stat cards (`border border-acento`)
2. Badge de estado `en_transito` (`bg-acento text-titulares`)
3. Fondo de badge `en_proceso` (`bg-acento/50 text-titulares`)
4. Row hover en tabla (`hover:bg-acento/20`)
5. Fondo del active link en sidebar (`bg-acento/50`) — patrón existente, no tocar

**Color destructivo:** `text-red-600 hover:text-red-700` únicamente para el ícono `Trash2`. Sin `bg-red-*` ni `border-red-*` en Phase 2.

---

## Badge Specs: Estados de OC

6 estados — todos usando exclusivamente el brand system orange/amber:

| Estado | Clases Tailwind | Hex de resultado visual |
|--------|-----------------|------------------------|
| `borrador` | `bg-fondo text-titulares border border-acento text-sm font-light px-2 py-0.5 rounded-full` | Fondo crema, borde suave — indica estado inicial/incompleto |
| `en_proceso` | `bg-acento/50 text-titulares text-sm font-light px-2 py-0.5 rounded-full` | Naranja muy suave — en curso |
| `en_transito` | `bg-acento text-titulares text-sm font-normal px-2 py-0.5 rounded-full` | Naranja acento sólido — activo/en movimiento |
| `en_aduana` | `bg-principal/20 text-titulares text-sm font-normal px-2 py-0.5 rounded-full` | Naranja medio — atención requerida |
| `entregada` | `bg-principal/10 text-principal text-sm font-normal px-2 py-0.5 rounded-full` | Naranja claro — completado positivo |
| `cancelada` | `bg-texto/10 text-texto text-sm font-light px-2 py-0.5 rounded-full line-through` | Gris cálido + tachado — inactivo/cancelado |

**Labels en español para cada estado** (texto del badge):

| Estado key | Label visible |
|------------|---------------|
| `borrador` | Borrador |
| `en_proceso` | En proceso |
| `en_transito` | En tránsito |
| `en_aduana` | En aduana |
| `entregada` | Entregada |
| `cancelada` | Cancelada |

---

## Stat Card Spec

4 stat cards inline en grid. Decisión D-06 aplicada.

**Layout:** `grid grid-cols-2 lg:grid-cols-4 gap-4`

**Estructura de cada card:**

```
bg-white border border-acento rounded-xl p-6
  ┌─ icono lucide (text-principal, size 24) ─────────────────┐
  │  número grande (text-4xl font-bold text-texto)           │
  │  label descriptivo (text-sm font-light text-titulares)   │
  └──────────────────────────────────────────────────────────┘
```

**Clases completas del card container:**
`bg-white border border-acento rounded-xl p-6 flex flex-col gap-3`

**Iconos lucide asignados por card (discreción del agente, D-06):**

| Card | Icono lucide | Prop |
|------|-------------|------|
| OC Totales | `FileText` | `size={24} className="text-principal"` |
| En tránsito | `Truck` | `size={24} className="text-principal"` |
| En Aduana | `Package` | `size={24} className="text-principal"` |
| Entregadas | `CheckCircle2` | `size={24} className="text-principal"` |

**Número:** `<p className="text-4xl font-bold text-texto">{count}</p>`
**Label:** `<p className="text-sm font-light text-titulares">{label}</p>`

---

## Table Spec

Decisiones D-01, D-02 aplicadas.

**Wrapper para scroll horizontal en mobile:**
```html
<div class="w-full overflow-x-auto rounded-xl border border-acento bg-white">
  <table class="w-full min-w-[640px] text-base">
```

**Thead:**
`<thead class="bg-fondo border-b border-acento">`
Celdas: `<th class="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap">`

**Tbody rows:**
`<tr class="border-b border-acento/50 hover:bg-acento/20 transition-colors duration-150">`
Celdas: `<td class="px-4 py-3 text-base text-texto">`

**Columnas en orden (D-02):**

| Columna | Contenido | Ancho sugerido |
|---------|-----------|----------------|
| Nº OC | ID corto (ej. `OC-001`) — `font-medium text-titulares` | `w-[100px]` |
| Proveedor | Nombre del proveedor | auto |
| Estado | Badge de estado (ver Badge Specs) | `w-[140px]` |
| Fecha | Fecha OC formateada `dd/mm/yyyy` | `w-[110px]` |
| Acciones | Botones de icono (ver Action Buttons) | `w-[100px]` |

**Separador de filas:** `border-b border-acento/50` — sin separador en última fila.

---

## Action Buttons Spec

Decisiones D-03 y D-08 aplicadas.

**Contenedor de acciones:** `<div class="flex items-center gap-1">`

**Cada botón de icono:**
```
<button class="min-h-[44px] min-w-[44px] flex items-center justify-center
               rounded-lg text-texto hover:text-principal hover:bg-acento/30
               transition-colors duration-150"
        aria-label="{acción}">
  <Icon size={18} />
</button>
```

**Botones por rol:**

| Rol | Botón 1 | Botón 2 | Botón 3 |
|-----|---------|---------|---------|
| Importador | `Eye` (Visualizar) | `Pencil` (Editar) | `Trash2` (Eliminar) |
| Proveedor | `Eye` (Visualizar) | `Pencil` (Editar) | — |
| Despachante | `Eye` (Visualizar) | `Pencil` (Editar) | — |

**Excepción destructiva — Trash2:**
Color: `text-red-600 hover:text-red-700 hover:bg-red-50` (único uso de rojo en Phase 2).
Requiere confirmación modal antes de ejecutar (ver Copywriting Contract).

**Rutas de navegación:**

| Botón | Ruta |
|-------|------|
| Eye (importador) | `/importador/oc/[id]` |
| Pencil (importador) | `/importador/oc/[id]/editar` |
| Eye (proveedor) | `/proveedor/oc/[id]` |
| Pencil (proveedor) | `/proveedor/oc/[id]/editar` |
| Eye (despachante) | `/despachante/oc/[id]` |
| Pencil (despachante) | `/despachante/oc/[id]/editar` |

**Nota:** Las rutas de detalle/edición son stubs en Phase 2 — el botón navega pero la página no existe aún hasta Phase 4.

---

## Filter Bar Spec

Requisito DASH-04. Posición: entre stat cards y la tabla.

**Layout:** `flex flex-col sm:flex-row gap-3 mb-4`

**Input de texto (filtrar por proveedor):**
```
<input
  type="text"
  placeholder="Buscar por proveedor..."
  class="w-full sm:w-64 px-4 py-2 rounded-lg border border-acento
         bg-white text-base text-texto placeholder:text-texto/50
         focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal
         transition-colors duration-150"
/>
```

**Select de estado:**
```
<select
  class="w-full sm:w-48 px-4 py-2 rounded-lg border border-acento
         bg-white text-base text-texto
         focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal
         transition-colors duration-150 cursor-pointer"
>
  <option value="">Todos los estados</option>
  <option value="borrador">Borrador</option>
  <option value="en_proceso">En proceso</option>
  <option value="en_transito">En tránsito</option>
  <option value="en_aduana">En aduana</option>
  <option value="entregada">Entregada</option>
  <option value="cancelada">Cancelada</option>
</select>
```

**Filtrado:** cliente-side, `onChange` filtra el array mock en tiempo real. Sin debounce para Phase 2.

---

## Empty State Spec

Aplica cuando la lista de OCs está vacía (sin datos mock, o sin resultados de filtro).

**Contenedor:**
`<div class="flex flex-col items-center justify-center py-16 gap-4 text-center">`

**Icono:** `<FileText size={48} className="text-acento" />`

**Heading:** `<p class="text-xl font-bold text-titulares">No hay órdenes de compra</p>`

**Body:** `<p class="text-base font-normal text-texto/70 max-w-sm">Todavía no creaste ninguna OC. Comenzá creando tu primera orden de compra.</p>`

**CTA (solo visible para importador):**
```
<a href="/importador/oc/nueva"
   class="inline-flex items-center gap-2 px-6 py-3 rounded-lg
          bg-principal text-white font-medium
          hover:bg-titulares transition-colors duration-150 min-h-[44px]">
  <PlusCircle size={18} />
  Nueva OC
</a>
```

**Estado vacío por filtros** (cuando hay OCs pero ninguna coincide con el filtro):
- Heading: `No hay resultados para tu búsqueda`
- Body: `Probá cambiando el filtro de estado o el nombre del proveedor.`
- Sin CTA.

---

## Skeleton Loading Spec

Mostrar mientras el mock data carga (o en Phase 5, mientras el fetch resuelve).

**Skeleton de stat cards — 4 cards:**
```
<div class="bg-white border border-acento rounded-xl p-6 animate-pulse flex flex-col gap-3">
  <div class="w-6 h-6 rounded bg-acento/40" />           {/* icono */}
  <div class="w-16 h-9 rounded bg-acento/40" />          {/* número */}
  <div class="w-28 h-4 rounded bg-acento/20" />          {/* label */}
</div>
```

**Skeleton de tabla — 5 filas:**
```
<tr class="border-b border-acento/50 animate-pulse">
  <td class="px-4 py-3"><div class="h-4 w-16 rounded bg-acento/30" /></td>
  <td class="px-4 py-3"><div class="h-4 w-32 rounded bg-acento/30" /></td>
  <td class="px-4 py-3"><div class="h-5 w-20 rounded-full bg-acento/40" /></td>
  <td class="px-4 py-3"><div class="h-4 w-24 rounded bg-acento/30" /></td>
  <td class="px-4 py-3"><div class="flex gap-1">
    <div class="h-8 w-8 rounded-lg bg-acento/30" />
    <div class="h-8 w-8 rounded-lg bg-acento/30" />
  </div></td>
</tr>
```

**Pulso:** `animate-pulse` de Tailwind. Color base: `bg-acento/30` para áreas principales, `bg-acento/20` para secundarias. Sin colores grises — mantener brand cálido.

---

## Delete Confirmation Modal

Aplica solo al importador al pulsar `Trash2`.

**Diseño:** Modal overlay simple, sin librería externa.

**Overlay:** `fixed inset-0 z-50 bg-texto/30 flex items-center justify-center p-4`

**Panel:** `bg-white rounded-xl border border-acento p-6 max-w-sm w-full flex flex-col gap-4`

**Copy del modal:**
- **Heading:** `¿Eliminar esta OC?`
- **Body:** `Estás por eliminar la OC {Nº OC} de {Proveedor}. Esta acción no se puede deshacer.`
- **Botón confirmar:** `Eliminar` — `bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium min-h-[44px]`
- **Botón cancelar:** `Cancelar` — `border border-acento text-texto hover:bg-fondo px-4 py-2 rounded-lg font-normal min-h-[44px]`

---

## Copywriting Contract

Todo el copy está en español. Sin mezcla de idiomas.

| Elemento | Copy |
|----------|------|
| CTA primario (importador) | `Nueva OC` (con ícono PlusCircle) |
| CTA secundario (filtro reset) | `Limpiar filtros` |
| Empty state heading (sin OCs) | `No hay órdenes de compra` |
| Empty state body (sin OCs) | `Todavía no creaste ninguna OC. Comenzá creando tu primera orden de compra.` |
| Empty state heading (filtros sin resultado) | `No hay resultados para tu búsqueda` |
| Empty state body (filtros sin resultado) | `Probá cambiando el filtro de estado o el nombre del proveedor.` |
| Confirmación eliminar — heading | `¿Eliminar esta OC?` |
| Confirmación eliminar — body | `Estás por eliminar la OC {Nº OC} de {Proveedor}. Esta acción no se puede deshacer.` |
| Confirmación eliminar — botón confirmar | `Eliminar` |
| Confirmación eliminar — botón cancelar | `Cancelar` |
| Stat card label 1 | `OC Totales` |
| Stat card label 2 | `En tránsito` |
| Stat card label 3 | `En aduana` |
| Stat card label 4 | `Entregadas` |
| Tabla col 1 | `Nº OC` |
| Tabla col 2 | `Proveedor` |
| Tabla col 3 | `Estado` |
| Tabla col 4 | `Fecha` |
| Tabla col 5 | `Acciones` |
| Filter input placeholder | `Buscar por proveedor...` |
| Filter select placeholder | `Todos los estados` |
| Page heading (importador) | `Dashboard` |
| Page heading (proveedor) | `Mis Órdenes` |
| Page heading (despachante) | `Mis Órdenes` |
| Aria-label Eye button | `Visualizar OC` |
| Aria-label Pencil button | `Editar OC` |
| Aria-label Trash2 button | `Eliminar OC` |

---

## Page Layout Structure

```
(importador layout: Sidebar + main)
main > div.p-6.bg-fondo.min-h-screen
  ├── h1.text-xl.font-bold.text-titulares.mb-6       "Dashboard"
  ├── div.grid.grid-cols-2.lg:grid-cols-4.gap-4.mb-8  [4 stat cards]
  ├── div.flex.gap-3.mb-4                             [filter bar]
  └── div.w-full.overflow-x-auto.rounded-xl.border    [tabla OCs]
```

Para proveedor y despachante: layout sin sidebar (solo navbar). Mismo contenido de page.

---

## Registry Safety

| Registry | Bloques usados | Safety Gate |
|----------|----------------|-------------|
| shadcn official | ninguno | no aplica — no inicializado |
| registros de terceros | ninguno | no aplica |

Plain Tailwind v4 con tokens `@theme` en `globals.css`. Sin dependencias externas de componentes. lucide-react instalado en Phase 1.

---

## Accessibility Notes

- Todos los botones de icono tienen `aria-label` descriptivo (ver Copywriting Contract).
- Touch targets mínimos: `min-h-[44px] min-w-[44px]` en todos los botones interactivos.
- Focus ring: `focus:ring-2 focus:ring-principal/30` en inputs y selects.
- Contraste: `text-texto` (#1C1917) sobre `bg-white` — ratio superior a 7:1.
- `text-titulares` (#9A3412) sobre `bg-white` — ratio superior a 5.5:1 (WCAG AA).

---

## Pre-Population Sources

| Fuente | Decisiones incorporadas |
|--------|------------------------|
| CONTEXT.md (decisiones D-01 a D-08) | 8 — todas las decisiones de layout, badges, stats, acciones por rol |
| CLAUDE.md §Brand Identity | 5 colores, Fira Sans, 4 pesos tipográficos, footer |
| `src/app/globals.css` @theme | 5 tokens CSS confirmados |
| `src/components/layout/Sidebar.tsx` | Patrón cn(), touch targets 44px, active link, border-acento, bg-white |
| REQUIREMENTS.md (DASH-01 a DASH-04) | 4 requisitos — stat cards, tabla, acciones, filtros |
| ROADMAP.md §Phase 2 | Goal, success criteria, 3 planes |
| Discreción del agente | Iconos lucide por stat card, colores exactos de badge por estado, skeleton design |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Aprobación:** pendiente
