# Phase 5: Backend Core — Discussion Log

**Date:** 2026-06-02

## Areas Discussed

### 1. Numeración de OC

| Pregunta | Opciones | Decisión |
|----------|----------|----------|
| Formato del número de OC | El importador lo define / Auto-incremental / Con año | **El importador lo define** (referenciaOC libre) |
| ¿Unicidad? | Validar unicidad / Permitir duplicados | **Validar unicidad** por importador |

### 2. Flujo wizard con DB real

| Pregunta | Opciones | Decisión |
|----------|----------|----------|
| ¿Cómo pasa datos Step 1 → Step 2? | Step 1 guarda en DB → Step 2 lee de DB por ID / Mantener sessionStorage | **Step 1 guarda en DB → Step 2 lee por ID** |
| Estado al guardar en Step 2 | El que eligió en Step 1 / Siempre 'en_proceso' | **El que eligió en Step 1** |
| Flujo de edición | Carga de DB / Sigue con sessionStorage | **Carga y actualiza DB directamente** |

### 3. Acceso y scoping por rol

| Pregunta | Opciones | Decisión |
|----------|----------|----------|
| Identificación proveedor/despachante | Email de Clerk / userId | **Email de Clerk (principal)** |
| Comparación email | Case-insensitive / Case-sensitive exacto | **Case-insensitive** (normalizar a lowercase al guardar) |

### 4. Borradores

| Pregunta | Opciones | Decisión |
|----------|----------|----------|
| ¿Borradores en dashboard? | Sí con badge / Solo OCs completas | **Sí, con badge 'Borrador'** |
| ¿TTL automático? | No vencen / TTL 7 días | **Sin TTL — persisten indefinidamente** |

## Deferred Ideas
- Cloudinary, Resend, PDF, Sheets → Phase 6
- Historial de cambios, clonación → fuera de scope v1
