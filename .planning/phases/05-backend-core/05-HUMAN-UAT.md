---
status: partial
phase: 05-backend-core
source: [05-VERIFICATION.md]
started: 2026-06-02T00:00:00Z
updated: 2026-06-02T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Flujo end-to-end de creación de OC
expected: Al hacer clic en "Continuar a Paso 2" desde Step 1, la URL cambia a `/importador/oc/[id-mongodb]?step=2` con un ID real de MongoDB (no 'OC-001' ni mock). Al guardar en Step 2, la OC aparece en el dashboard de importador con stats actualizadas.
result: [pending]

### 2. Webhook Clerk sincroniza usuario a MongoDB
expected: Al crear un nuevo usuario en Clerk (signup), el endpoint POST /api/webhooks/clerk recibe el evento user.created, verifica la firma, y crea el documento en la colección `users` de MongoDB Atlas con campos clerkId, email (lowercase), y rol.
result: [pending]

### 3. Stats desde MongoDB aggregation en dashboard
expected: Las 4 stat cards del dashboard (OC Totales, En tránsito, En aduana, Entregadas) muestran valores reales de MongoDB. Filtrar en la FilterBar no modifica los valores de las stat cards (calculadas desde el subset base del rol, no desde las OCs filtradas).
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
