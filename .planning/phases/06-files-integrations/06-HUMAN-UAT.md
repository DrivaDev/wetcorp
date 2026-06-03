---
status: partial
phase: 06-files-integrations
source: [06-VERIFICATION.md]
started: 2026-06-02T00:00:00Z
updated: 2026-06-02T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Upload firmado a Cloudinary
expected: El widget de Cloudinary se abre desde DocumentSlots, permite seleccionar un PDF, lo sube con firma server-side (`/api/sign-cloudinary-params`), y al completar el slot muestra "Archivo adjunto". En MongoDB, `documentos.{slot}` contiene la URL de Cloudinary.
result: [pending]

### 2. Email de notificación con Resend
expected: Al crear/actualizar una OC con emailsProveedor o emailsDespachante y estado distinto de 'borrador', los destinatarios reciben email con template OCNotificationEmail: logo horizontal, colores de marca (#f0f7ff, #004a80, #0061a6), datos de la OC (referencia, proveedor, estado, fecha, notas), botón "Ver OC en el sistema".
result: [pending]

### 3. Descarga de PDF
expected: Desde la vista detalle de cualquier rol, clic en "Exportar PDF" descarga `OC-{referencia}.pdf` con secciones: info general, tabla de productos, gastos, value cards (FOB/Gastos/Landed Cost) y branding Driva Dev.
result: [pending]

### 4. Sync a Google Sheets
expected: Al crear/actualizar una OC, la fila en la Sheet configurada se crea o actualiza con 8 columnas: Referencia OC, Proveedor, Estado, Fecha OC, País de Origen, FOB USD, Total Gastos USD, Landed Cost USD. No se duplica si ya existe.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
