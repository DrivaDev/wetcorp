---
phase: 3
slug: oc-wizard-ui
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-27
---

# Phase 3 — Contrato de Diseño UI: OC Wizard

> Contrato visual e interactivo para la Fase 3 (OC Wizard UI). Generado por gsd-ui-researcher, verificado por gsd-ui-checker.

---

## Design System

| Propiedad | Valor |
|-----------|-------|
| Tool | none — Tailwind CSS puro |
| Preset | no aplica |
| Component library | none — componentes propios con Tailwind |
| Icon library | lucide-react (ya instalado) |
| Font | Fira Sans via Google Fonts |

Fuente: brand definido en `globals.css` + `CLAUDE.md` §Brand Identity.

---

## Tokens de Color

Todos los colores DEBEN referenciarse con tokens Tailwind — nunca hex directo en componentes nuevos.

| Token Tailwind | Hex | Descripción |
|----------------|-----|-------------|
| `text-principal` / `bg-principal` / `border-principal` | `#EA580C` | CTAs, foco, acentos activos |
| `text-titulares` / `bg-titulares` / `border-titulares` | `#9A3412` | H1, H2, títulos de sección |
| `bg-acento` / `border-acento` / `text-acento` | `#FED7AA` | Bordes de cards, badges, fondos secundarios |
| `bg-fondo` | `#FFF7ED` | Fondo general de página |
| `text-texto` | `#1C1917` | Body, párrafos, datos de tabla |

Fuente: `src/app/globals.css` @theme block.

---

## Escala de Espaciado

Valores declarados (todos múltiplos de 4 — Tailwind base-4 grid):

| Token | Valor px | Uso |
|-------|----------|-----|
| xs | 4px (`gap-1`, `p-1`) | Gaps entre íconos, separación inline mínima |
| sm | 8px (`gap-2`, `p-2`) | Espaciado compacto: tags, badges inline |
| md | 16px (`gap-4`, `p-4`) | Padding interno de inputs, gaps entre campos de formulario |
| lg | 24px (`gap-6`, `p-6`) | Padding interno de cards de sección de gastos y value cards |
| xl | 32px (`gap-8`, `p-8`) | Separación entre secciones del wizard (info general / tabla / footer) |
| 2xl | 48px | Separación entre Step 1 y Step 2 en layout vertical |
| 3xl | 64px | Margen superior del contenedor del wizard en desktop |

Excepciones:
- Touch targets: `min-h-[44px] min-w-[44px]` en todos los botones de ícono (Trash2, Plus, Upload) — patrón establecido en Phase 2.
- Altura de fila de tabla de productos: `py-3` (12px top + bottom) — consistente con OCTable de Phase 2.

---

## Tipografía

Exactamente 4 tamaños y 2 pesos activos en toda la interfaz del wizard.

| Rol | Tamaño | Peso Fira Sans | Line-height | Clase Tailwind | Uso en Wizard |
|-----|--------|----------------|-------------|----------------|---------------|
| Display / Título de step | 24px | 700 (Bold) | 1.2 | `text-2xl font-bold text-titulares` | "Paso 1: Información General", "Paso 2: Gastos y Documentos" |
| Heading de sección | 16px | 700 (Bold) | 1.3 | `text-base font-bold text-titulares` | Títulos de cards de gastos (Despacho, Despachante, etc.) — diferenciados de body por peso bold |
| Label de campo / Caption | 14px | 400 (Regular) | 1.4 | `text-sm font-normal text-texto` | Labels de inputs, headers de columna de tabla |
| Caption con énfasis reducido | 14px | 400 (Regular) | 1.4 | `text-sm font-normal text-texto/60` | Subtítulo ARS en value cards, texto de ayuda bajo inputs — distinción visual mediante opacidad, no peso |
| Body / Valor | 16px | 400 (Regular) | 1.5 | `text-base font-normal text-texto` | Valores ingresados en inputs, texto de opciones de select |
| Valor monetario grande | 28px | 700 (Bold) | 1.1 | `text-3xl font-bold text-titulares` | Valor USD principal en cada value card |

**Regla de pesos:** solo `font-normal` (400) y `font-bold` (700). Nunca `font-medium`, `font-light` u otros pesos.

**Regla de tamaños:** los 4 tamaños activos son 14px, 16px, 24px, 28px. El 28px aparece exclusivamente en las 3 value cards finales. El 14px con `/60` opacidad reemplaza al antiguo 12px caption.

**Sustituciones aplicadas respecto al borrador anterior:**
- 12px (`text-xs font-light`) → 14px `text-sm font-normal text-texto/60` (opacidad para distinción visual)
- 18px (`text-lg font-bold`) → 16px `text-base font-bold` (peso bold para distinción visual)
- `font-medium` (500) → `font-normal` (400) en todo el spec
- `font-light` (300) → `font-normal text-texto/60` en todo el spec

---

## Punto de Foco por Step

- **Step 1 focal point:** botón CTA primario "Continuar a Paso 2" — único elemento interactivo de navegación en el footer.
- **Step 2 focal point:** value card "Costo Landed Total" — resultado financiero principal de todo el wizard.

---

## Color — Contrato 60/30/10

| Rol | Valor | Uso |
|-----|-------|-----|
| Dominante (60%) | `#FFF7ED` (`bg-fondo`) | Fondo de página, fondo del contenedor del wizard |
| Secundario (30%) | `#FFFFFF` (blanco) | Fondo de cards de sección, fondo de inputs, fondo de tabla |
| Acento (10%) | `#FED7AA` (`border-acento` / `bg-acento`) | Ver lista reservada abajo |
| Destructivo | `red-600` / `red-50` hover | Solo botón eliminar fila de producto (patrón establecido en OCTable) |

**El acento `#FED7AA` está reservado exclusivamente para:**
1. Bordes de cards de sección de gastos (`border border-acento`)
2. Bordes de table header de productos (`border-b border-acento`)
3. Borde del contenedor principal de tabla (`border border-acento`)
4. Bordes dashed de slots de documentos vacíos (`border-2 border-dashed border-acento`)
5. Fondo hover de filas de tabla de productos (`hover:bg-acento/20`)
6. Skeleton loading blocks (`bg-acento/30`, `bg-acento/40`) — patrón establecido en Phase 2
7. Badges de estado dentro del resumen read-only de Step 1 en Step 2

**El principal `#EA580C` está reservado para:**
1. Botón primario CTA ("Continuar a Step 2", "Guardar OC") — fondo sólido `bg-principal text-white`
2. Borde de focus en todos los inputs (`focus:outline-none focus:ring-2 focus:ring-principal`)
3. Ícono active y borde active del sidebar (ya establecido)
4. Borde de error de validación: usar `border-red-500` (no `border-principal`) para diferenciar error de focus

---

## Contrato de Inputs

Todos los campos del wizard siguen este estilo base:

```
height:        h-10 (40px)
border:        border border-acento
border-radius: rounded-lg
padding:       px-3 py-2
background:    bg-white
font:          text-base font-normal text-texto
placeholder:   placeholder:text-texto/40
```

**Estados:**

| Estado | Clases |
|--------|--------|
| Default | `border border-acento rounded-lg bg-white text-texto` |
| Focus | `focus:outline-none focus:ring-2 focus:ring-principal focus:border-principal` |
| Error | `border-red-500 focus:ring-red-500` + texto de error `text-xs text-red-600` debajo del campo |
| Disabled | `disabled:bg-fondo disabled:text-texto/40 disabled:cursor-not-allowed disabled:border-acento/50` |
| Read-only (resumen Step 2) | `bg-fondo text-texto/70 border-acento/50 cursor-default` |

**Select:**
Mismas clases que input + `appearance-none` + ícono ChevronDown de lucide-react posicionado absolute a la derecha.

**Error text:** `<p className="mt-1 text-xs text-red-600">{mensaje de error}</p>` inmediatamente debajo del input afectado.

---

## Tabla de Productos (Step 1)

**Columnas y anchos:**

| Columna | Ancho | Notas |
|---------|-------|-------|
| # (índice) | `w-[40px]` | Solo número de fila, no editable |
| Producto * | `min-w-[180px]` | Input texto, requerido |
| Descripción | `min-w-[200px]` | Input texto, opcional |
| Cantidad * | `w-[100px]` | Input número, requerido, min 0.001 |
| Valor unitario (USD) * | `w-[140px]` | Input número, requerido, min 0 |
| Total (USD) | `w-[120px]` | Calculado read-only, `bg-fondo font-bold text-titulares` |
| Acciones | `w-[56px]` | Solo ícono Trash2 |

**Estilos de tabla:**
```
contenedor:     rounded-xl border border-acento overflow-x-auto
thead:          bg-fondo border-b border-acento
th:             px-3 py-3 text-sm font-normal text-titulares text-left whitespace-nowrap
tr:             border-b border-acento/50 hover:bg-acento/20 transition-colors duration-150
td input:       h-9 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-principal rounded px-2
```

**Fila de totales (al pie de la tabla):**
```
tr:             border-t-2 border-acento bg-fondo
td "FOB Total": colspan apropiado, text-right text-sm font-normal text-titulares
td valor USD:   text-base font-bold text-titulares
td valor ARS:   text-sm font-normal text-titulares/60
```

**Botón "+ Agregar producto":**
- Posición: debajo de la tabla, alineado a la izquierda
- Clases: `flex items-center gap-2 text-sm font-normal text-principal hover:text-titulares transition-colors min-h-[44px]`
- Ícono: `Plus` size={16} de lucide-react

**Botón Trash2 deshabilitado (solo 1 fila):**
- Clases cuando disabled: `text-texto/20 cursor-not-allowed` (sin hover activo)
- Clases cuando activo: `text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors`

---

## Cards de Sección de Gastos (Step 2)

Cada una de las 4 secciones usa este layout:

```
contenedor:     rounded-xl border border-acento bg-white p-6 flex flex-col gap-4
título:         text-base font-bold text-titulares
grid campos:    grid grid-cols-1 sm:grid-cols-2 gap-4
subtotal card:  mt-4 pt-4 border-t border-acento/50 flex justify-between items-center
subtotal label: text-sm font-normal text-titulares
subtotal valor: text-base font-bold text-titulares
```

**Sección "Otros gastos" (dinámica):**
- Cada ítem: `flex items-center gap-3` con input Descripción (`flex-1`), input Monto (`w-[120px]`), select Divisa (`w-[90px]`), botón Trash2
- Botón "+ Agregar gasto": mismo estilo que "+ Agregar producto"
- Mínimo 0 ítems (esta sección puede quedar vacía)

---

## Value Cards Finales (Step 2)

3 cards en fila horizontal al final de Step 2 (no sticky):

```
contenedor:     grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8
card:           rounded-xl border border-acento bg-white p-6 flex flex-col gap-2
label:          text-sm font-bold text-titulares uppercase tracking-wide
valor USD:      text-3xl font-bold text-titulares leading-none
subtítulo ARS:  text-sm font-normal text-titulares/60
```

**Card 1 — Valor FOB:** label "Valor FOB", valor en USD, subtítulo en ARS
**Card 2 — Gastos de Importación:** label "Gastos de Importación", suma total de gastos en USD equivalente, subtítulo en ARS
**Card 3 — Costo Landed Total:** label "Costo Landed Total", FOB + Gastos en USD, subtítulo en ARS — este card PUEDE tener `bg-fondo` para distinguirlo visualmente de los otros dos

---

## Slots de Documentos (Step 2)

5 slots con UI de estado vacío:

```
contenedor:     grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6
slot:           rounded-xl border-2 border-dashed border-acento bg-white p-6
                flex flex-col items-center justify-center gap-3 min-h-[120px]
ícono Upload:   Upload size={32} className="text-acento" (de lucide-react)
label:          text-sm font-normal text-titulares text-center
subtexto:       text-sm font-normal text-texto/60 text-center
```

**Nombres de los 5 slots (labels):**
1. "Factura proveedor"
2. "Factura despachante"
3. "Conocimiento de embarque"
4. "Certificado de Origen"
5. "Otro documento"

**Subtexto en cada slot:** "Sin archivo adjunto"

Los slots son completamente estáticos en Phase 3 — sin evento onClick, sin funcionalidad de upload.

---

## Jerarquía de Botones

| Tipo | Clases | Uso |
|------|--------|-----|
| Primario CTA | `bg-principal text-white font-bold px-6 py-3 rounded-lg hover:bg-titulares transition-colors min-h-[44px]` | "Continuar a Paso 2", "Guardar OC" |
| Primario deshabilitado | `bg-principal/40 text-white/70 cursor-not-allowed px-6 py-3 rounded-lg min-h-[44px]` | "Continuar a Paso 2" cuando form inválido |
| Secundario outline | `border border-principal text-principal font-normal px-6 py-3 rounded-lg hover:bg-acento/30 transition-colors min-h-[44px]` | "Volver" en Step 2 |
| Ícono destructivo | `min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors` | Trash2 eliminar fila de producto / gasto |
| Ícono add | `flex items-center gap-2 text-sm font-normal text-principal hover:text-titulares min-h-[44px] transition-colors` | "+ Agregar producto", "+ Agregar gasto" |

---

## Layout del Wizard

**Contenedor general:**
```
max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8
```

**Título del step (D-01 — sin barra de progreso):**
```
<h1 className="text-2xl font-bold text-titulares">
  Paso 1: Información General
</h1>
```

**Grid de campos — Info General (Step 1):**
```
grid grid-cols-1 sm:grid-cols-2 gap-4
```
Campos que van en ancho completo (colspan): Proveedor (si requiere búsqueda), Notas/Observaciones.

**Footer de navegación del wizard:**
```
flex items-center justify-between mt-8 pt-6 border-t border-acento
```
- Step 1: solo botón "Continuar a Paso 2" (derecha)
- Step 2: botón "Volver" (izquierda) + botón "Guardar OC" (derecha)

---

## Toast de Éxito

Al hacer click en "Guardar OC" (D-04):

```
Tipo:     success
Posición: top-right
Texto:    "OC guardada exitosamente"
Subtexto: "Redirigiendo al dashboard..."
Duración: 2000ms, luego redirect a /importador/dashboard
```

Implementación: usar `sonner` o similar. Si no está instalado, implementar toast simple con estado local (`useState` + `useEffect` con timeout) usando clases:
```
fixed top-4 right-4 z-50 bg-white border border-acento rounded-xl px-4 py-3
shadow-lg flex items-center gap-3 text-sm font-normal text-texto
```
Ícono: `CheckCircle2` size={20} `text-principal` de lucide-react.

---

## Estados Empty / Error / Carga

**Campo de tabla vacío sin datos ingresados:**
- Placeholder del input Producto: `"Ej: Tela de algodón"`
- Placeholder Cantidad: `"0"`
- Placeholder Valor USD: `"0.00"`

**Error de validación al intentar continuar con form inválido:**
- El botón "Continuar a Paso 2" no realiza acción (está `disabled`) — no hay toast de error
- Los campos requeridos vacíos muestran borde `border-red-500` + texto de error debajo

**Estado de recarga en Step 2 sin datos en sessionStorage (D-06):**
- Redirect inmediato a `?step=1` — sin pantalla intermedia
- Si sessionStorage tenía datos parciales: pre-poblar formulario y mostrar un banner informativo:
  ```
  bg-acento/30 border border-acento rounded-lg px-4 py-3 text-sm text-titulares
  ```
  Texto: "Se recuperaron los datos de tu sesión anterior."

---

## Breakpoints Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| `< 640px` (mobile) | Grid de 1 columna para todos los campos. Tabla de productos con scroll horizontal. Value cards en stack vertical (1 columna). Slots de documentos 1 columna. Footer wizard en columna con botones full-width. |
| `>= 640px` (sm) | Grid de 2 columnas para campos de info general. Value cards 3 columnas inline. Slots 2 columnas. Footer horizontal. |
| `>= 1024px` (lg) | Slots de documentos 3 columnas. Layout sin cambios adicionales sobre sm. |

Tabla de productos: siempre con `overflow-x-auto` para scroll horizontal en mobile — no colapsar a cards.

---

## Contrato de Copywriting

| Elemento | Texto |
|----------|-------|
| Título Step 1 | "Paso 1: Información General" |
| Título Step 2 | "Paso 2: Gastos y Documentos" |
| CTA principal Step 1 | "Continuar a Paso 2" |
| CTA principal Step 2 | "Guardar OC" |
| Botón volver Step 2 | "Volver" |
| Botón agregar producto | "+ Agregar producto" |
| Botón agregar gasto | "+ Agregar gasto" |
| Toast éxito heading | "OC guardada exitosamente" |
| Toast éxito body | "Redirigiendo al dashboard..." |
| Slot documento subtexto | "Sin archivo adjunto" |
| Texto fila mínima (Trash2 disabled) | aria-label="No es posible eliminar el único producto" |
| Trash2 activo — fila de producto | aria-label="Eliminar producto" |
| Trash2 activo — fila de gasto | aria-label="Eliminar gasto" |
| Banner recuperación datos | "Se recuperaron los datos de tu sesión anterior." |
| Label subtotal por sección | "Subtotal" |
| Label total global gastos | "Total gastos" |
| Error campo requerido vacío | "Este campo es obligatorio" |
| Error cantidad inválida | "Ingresa un valor mayor a 0" |
| Error tipo de cambio | "Ingresa un tipo de cambio válido" |

**Eliminación de filas — Trash2 destructivo:**
Sin confirmation dialog. Eliminación optimista sin undo (datos locales en sessionStorage). La fila desaparece inmediatamente al hacer click en el Trash2 activo.

---

## Registro de Dependencias

| Librería | Estado | Acción requerida |
|----------|--------|-----------------|
| `lucide-react` | Instalada | Ninguna |
| `decimal.js` | **Pendiente instalar** | Instalar en plan 03-01 (`npm install decimal.js`) |
| `sonner` (toast) | No instalada | Opcional — implementar toast simple si no se instala |

---

## Registry Safety

| Registry | Bloques usados | Safety Gate |
|----------|----------------|-------------|
| shadcn official | ninguno | no aplica — no se usa shadcn |
| terceros | ninguno | no aplica |

---

## Fuentes de las Decisiones

| Sección | Fuente |
|---------|--------|
| Tokens de color | `src/app/globals.css`, `CLAUDE.md` §Brand Identity |
| Escala de espaciado | Tailwind base-4 + patrones de `OCTable.tsx`, `StatCard.tsx` |
| Tipografía | `CLAUDE.md` §Brand Identity + patrones de componentes existentes; colapsada a 4 tamaños/2 pesos por revisión del checker |
| Jerarquía de botones | `CLAUDE.md` §Brand Identity §Reglas UI + `Sidebar.tsx`; `py-2.5` → `py-3` por revisión del checker |
| Touch targets 44px | `OCTable.tsx` + `Sidebar.tsx` (patrón Phase 2) |
| Tabla de productos | D-08, D-09, D-10 de `03-CONTEXT.md` |
| Cards de gastos | D-11, D-12 de `03-CONTEXT.md` |
| Value cards | D-13 de `03-CONTEXT.md` |
| Document slots | D-14 de `03-CONTEXT.md` |
| Toast + redirect | D-04 de `03-CONTEXT.md` |
| Navegación wizard | D-01, D-02, D-03 de `03-CONTEXT.md` |
| sessionStorage | D-05, D-06, D-07 de `03-CONTEXT.md` |
| Breakpoints responsive | D-13 (stack mobile) + convenciones Tailwind sm/lg del proyecto |
| Copywriting (errores, labels, aria-labels) | Discreción del researcher (no especificado en upstream) |
| Toast implementación | Discreción del researcher (upstream solo especifica comportamiento) |
| Punto de foco por step | Discreción del researcher |
| Confirmación destructiva | Sin dialog — eliminación optimista (datos en sessionStorage) |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
