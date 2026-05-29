---
status: partial
phase: 04-oc-views-demo-polish
source: [04-VERIFICATION.md]
started: 2026-05-29
updated: 2026-05-29
---

## Current Test

[Pendiente verificación humana en browser]

## Tests

### 1. Vista detalle con valores calculados
expected: /importador/oc/3 renderiza secciones de gastos, impuestos y ValueCards con valores numéricos calculados desde OCDetalle vía decimal.js (FOB, total gastos, costo landed)
result: [pending]

### 2. Modo edición con sessionStorage pre-cargado
expected: /importador/oc/3/editar abre el wizard en Step 1 con campos pre-poblados (referenciaOC, proveedor, emailsProveedor, etc.) provenientes de MOCK_OCS_DETALLE[id=3]
result: [pending]

### 3. Página 404 custom activada por notFound()
expected: /importador/oc/999 renderiza la página "OC no encontrada" con ícono FileSearch y botón "Volver al dashboard" — NOT la 404 por defecto de Next.js
result: [pending]

### 4. Botón Eliminar ausente en proveedor/despachante
expected: /proveedor/oc/3 y /despachante/oc/3 muestran botón Editar pero NO botón Eliminar (Trash2). Solo /importador/oc/3 muestra Eliminar.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
