# Phase 3: OC Wizard UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 3-OC Wizard UI
**Areas discussed:** Wizard navigation, State between steps, Productos table UX, Gastos & value cards layout

---

## Wizard Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Barra con pasos numerados | Ej: ● Paso 1: Info general — ○ Paso 2: Gastos y docs | |
| Tabs en la parte superior | Tab 'Info general' \| Tab 'Gastos y documentos' | |
| Sin indicador visible | Solo el título del paso actual | ✓ |

**User's choice:** Sin indicador visible — solo título del paso

---

| Option | Description | Selected |
|--------|-------------|----------|
| Solo activo cuando el formulario es válido | Botón deshabilitado hasta que haya al menos 1 producto y campos requeridos completos | ✓ |
| Siempre activo, valida al hacer click | Botón clickeable, muestra errores si falta algo | |

**User's choice:** Solo activo cuando el formulario es válido

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, botón 'Volver' que regresa con los datos intactos | El usuario puede corregir Step 1 sin perder lo que cargó | ✓ |
| No, el wizard es lineal | Una vez en Step 2 no se puede volver | |

**User's choice:** Sí, botón Volver con datos intactos

---

| Option | Description | Selected |
|--------|-------------|----------|
| Toast de éxito + redirect al dashboard | Simula el flujo real, redirect a listado | ✓ |
| Solo toast, se queda en el formulario | Confirma sin navegar | |
| Sin acción, botón deshabilitado | Marcado como 'Próximamente' | |

**User's choice:** Toast de éxito + redirect al dashboard

---

## State Between Steps

| Option | Description | Selected |
|--------|-------------|----------|
| sessionStorage | JSON serializado, misma pestaña, se borra al cerrar | ✓ |
| URL params (base64 encoded) | Datos en la URL, permite compartir link | |
| Zustand / React Context | Estado global en memoria, se pierde al recargar | |

**User's choice:** sessionStorage

---

| Option | Description | Selected |
|--------|-------------|----------|
| Redirigir a Step 1 con datos recuperados desde sessionStorage | Si hay datos, pre-pobla Step 1; si no, Step 1 vacío | ✓ |
| Mostrar Step 2 con los datos recuperados | sessionStorage sobrevive el reload | |

**User's choice:** Redirigir a Step 1 con datos recuperados

---

| Option | Description | Selected |
|--------|-------------|----------|
| /importador/oc/nueva?step=1 y ?step=2 | Query params, browser history funciona correctamente | ✓ |
| /importador/oc/nueva/paso-1 y /paso-2 | Rutas separadas, 2 page.tsx distintos | |
| Una sola URL /importador/oc/nueva | Step controlado por useState, URL no cambia | |

**User's choice:** Query params ?step=1 / ?step=2

---

## Productos Table UX

| Option | Description | Selected |
|--------|-------------|----------|
| Botón debajo de la tabla + deshabilitar eliminar si queda 1 row | Patrón estándar, visualmente claro | ✓ |
| Botón arriba + permitir eliminar el único row | Más compacto, valida al submit | |

**User's choice:** Botón debajo + eliminar deshabilitado con 1 row

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, en tiempo real | Recalcula con cada keystroke usando decimal.js | ✓ |
| Solo al perder el foco del campo (onBlur) | Menos re-renders, siente 'lento' | |

**User's choice:** Tiempo real con cada keystroke

---

| Option | Description | Selected |
|--------|-------------|----------|
| Producto + Cantidad + Valor unitario | Descripción es opcional | ✓ |
| Todos obligatorios: Producto + Descripción + Cantidad + Valor unitario | Más estricto | |

**User's choice:** Producto + Cantidad + Valor unitario requeridos; Descripción opcional

---

## Gastos & Value Cards Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Secciones con título + borde/card por sección | Cada sección en su propia card con borde acento | ✓ |
| Lista continua con separadores | Todos los gastos en una sola columna con subtítulos | |
| Acordeones colapsables | Cada sección expande/colapsa | |

**User's choice:** Cards por sección con borde acento

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, subtotal por sección + total global en tiempo real | Cada card muestra su subtotal | ✓ |
| Solo total global, sin subtotales por sección | Más simple, un número al final | |

**User's choice:** Subtotal por sección + total global, ambos en tiempo real

---

| Option | Description | Selected |
|--------|-------------|----------|
| Cards inline en una fila, al final del Step 2 | 3 cards horizontales desktop / stack mobile | ✓ |
| Panel fijo/sticky lateral | Cards fijas a la derecha mientras el usuario edita | |

**User's choice:** Cards inline al final de la página (no sticky)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Borde punteado + ícono upload + nombre del documento | border-dashed border-acento + ícono Upload lucide-react | ✓ |
| Botón 'Subir PDF' por cada slot | Botón clickeable, sin funcionalidad en Phase 3 | |

**User's choice:** Borde punteado + ícono + label del tipo de documento

---

## Claude's Discretion

- Layout exacto de campos de info general en Step 1 (grid columnas)
- Ícono lucide-react específico para slots de documentos (además de Upload)
- Estilos de validación (color de borde en error, texto de error)
- Texto exacto del toast de éxito

## Deferred Ideas

- Upload real de PDFs → Phase 6
- Persistencia en MongoDB → Phase 5
- Vista detalle de OC para proveedor/despachante → Phase 4
