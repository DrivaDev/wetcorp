# Phase 4: OC Views & Demo Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 4-OC Views & Demo Polish
**Areas discussed:** Layout del detail, Datos mock completos, Modo edición, Estados vacíos y loading

---

## Layout del detail

| Option | Description | Selected |
|--------|-------------|----------|
| Mismas secciones del wizard | Datos OC → Productos → Gastos → Impuestos → Documentos → Valores. Reusar componentes wizard. | ✓ |
| Layout diferente tipo 'ficha' | Header con datos clave + tabs o acordeón por sección. | |

**User's choice:** Mismas secciones del wizard
**Notes:** Consistencia visual total con el wizard.

---

| Option | Description | Selected |
|--------|-------------|----------|
| N° OC + estado + Editar + Eliminar | Header con breadcrumb y botones de acción arriba. | ✓ |
| Solo N° OC con botones abajo | Sin breadcrumb. | |

**User's choice:** Número OC + estado + botones Editar y Eliminar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Igual que importador sin Eliminar | Ven toda la estructura, solo sin botón de borrar. | ✓ |
| Vista reducida por rol | Solo secciones relevantes al rol. | |

**User's choice:** Proveedor/despachante: igual pero sin botón Eliminar

---

## Datos mock completos

| Option | Description | Selected |
|--------|-------------|----------|
| Expandir OC con OCDetalle en mock-ocs.ts | Interface rica con productos, gastos, valores. 2-3 OCs con datos completos. | ✓ |
| Archivo separado mock-oc-detail.ts | Mantener OC thin y crear archivo aparte. | |

**User's choice:** Expandir mock-ocs.ts con interface OCDetalle

---

| Option | Description | Selected |
|--------|-------------|----------|
| Datos realistas con números | TC ~1200, productos y gastos típicos. Demo convincente. | ✓ |
| Solo estructura en 0 | Campos existen pero en 0. | |

**User's choice:** Datos realistas con números

---

## Modo edición

| Option | Description | Selected |
|--------|-------------|----------|
| Mismo wizard de 2 pasos pre-poblado | /[id]/editar monta WizardPage con sessionStorage pre-cargado. | ✓ |
| Formulario inline una página | Sin steps, todos los campos juntos. | |

**User's choice:** Mismo wizard de 2 pasos pre-poblado

---

| Option | Description | Selected |
|--------|-------------|----------|
| Solo leer, sin edición | Proveedor/despachante solo read-only. | |
| Pueden editar campos de su rol | Editan solo su sección. | |
| Pueden ver y editar todo (free text) | Editan igual que importador. | ✓ |

**User's choice:** "Pueden ver y editar todo" → sin botón Eliminar es la única diferencia

---

## Estados vacíos y loading

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton bars | animate-pulse bg-acento/30, replican el layout real. | ✓ |
| Spinner centrado | Un spinner en el centro. | |

**User's choice:** Skeleton bars

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ilustración + CTA Crear OC | Ícono + mensaje + botón naranja. | ✓ |
| Solo texto sin CTA | Mensaje simple. | |

**User's choice:** Ilustración + CTA 'Crear primera OC'

---

| Option | Description | Selected |
|--------|-------------|----------|
| 404 custom con link al dashboard | Página custom con "OC no encontrada". | ✓ |
| Redirect silencioso | Redirect a dashboard sin mostrar error. | |

**User's choice:** Página 404 custom

---

## Claude's Discretion

- Implementación del breadcrumb (componente simple, sin librería)
- Alturas y cantidad de bloques en skeletons
- Qué OCs específicas de la lista reciben datos ricos (mínimo OC-003 y OC-004)

## Deferred Ideas

- Cambio de estado desde el detalle → Phase 5
- Eliminación real → Phase 5
- Permisos granulares por rol → posterior
- Notificaciones push → fuera de scope v1
