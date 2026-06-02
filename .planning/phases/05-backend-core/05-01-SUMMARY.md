---
phase: 05-backend-core
plan: "01"
subsystem: persistence
tags: [mongoose, mongodb, clerk-webhook, middleware, models]
dependency_graph:
  requires: []
  provides: [connectDB, OC model, User model, POST /api/webhooks/clerk]
  affects: [05-02-PLAN.md, 05-03-PLAN.md]
tech_stack:
  added: [mongoose@9.6.3]
  patterns: [mongoose-singleton-global, mongoose-model-guard]
key_files:
  created:
    - src/lib/mongodb.ts
    - src/lib/models/OC.ts
    - src/lib/models/User.ts
    - src/app/api/webhooks/clerk/route.ts
  modified:
    - next.config.ts
    - src/middleware.ts
    - .env.example
    - package.json
    - package-lock.json
decisions:
  - "Mongoose singleton usa global.mongooseCache con maxPoolSize 5, bufferCommands false — mandatorio por CLAUDE.md"
  - "Modelo OC usa guard mongoose.models.OC ?? mongoose.model para evitar 'Cannot overwrite model' en hot-reload"
  - "OCSchema.index compuesto (importadorId + referenciaOC, unique) aplicado a nivel MongoDB — rechaza duplicados ante race conditions (T-05-03)"
  - "verifyWebhook de @clerk/nextjs/webhooks verifica HMAC-SHA256 con CLERK_WEBHOOK_SIGNING_SECRET — retorna 400 si firma inválida (T-05-01)"
  - "runtime nodejs en route.ts del webhook para acceso a Mongoose fuera del Edge runtime"
metrics:
  duration: "~15 min"
  completed: "2026-06-02"
  tasks_completed: 2
  files_created: 4
  files_modified: 5
---

# Phase 5 Plan 01: MongoDB Singleton, Modelos y Webhook Clerk — Summary

Mongoose instalado e integrado con Next.js App Router mediante singleton global, modelos OC y User con guards contra hot-reload, y Route Handler del webhook de Clerk que sincroniza usuarios a MongoDB al recibir `user.created`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Mongoose + next.config.ts + mongodb.ts + modelos | a4cd62b | next.config.ts, package.json, src/lib/mongodb.ts, src/lib/models/OC.ts, src/lib/models/User.ts |
| 2 | Webhook Clerk y middleware público | 6f9ea3d | src/middleware.ts, src/app/api/webhooks/clerk/route.ts, .env.example |

## Decisions Made

1. **Singleton con global.mongooseCache**: Evita crear múltiples conexiones en desarrollo (hot-reload) y en producción (funciones serverless reutilizando instancias Node.js). Patrón mandatorio en CLAUDE.md.

2. **Guard `mongoose.models.OC ??`**: Previene el error "Cannot overwrite model once compiled" en cualquier hot-reload de Next.js.

3. **Índice compuesto único (importadorId + referenciaOC)**: La unicidad se impone a nivel de base de datos, no solo en la aplicación. Protege contra race conditions en creación concurrente (T-05-03).

4. **verifyWebhook para el webhook de Clerk**: Usa HMAC-SHA256 con timing-safe comparison. Cualquier petición sin firma válida recibe 400 inmediatamente (T-05-01).

5. **`/api/webhooks/clerk` como ruta pública en middleware**: El webhook llega desde servidores de Clerk sin sesión de usuario. La autenticación se hace por firma criptográfica, no por JWT.

6. **`export const runtime = 'nodejs'`**: Requerido en la route del webhook ya que Mongoose no es compatible con el Edge runtime de Vercel.

## Deviations from Plan

None — plan ejecutado exactamente como estaba escrito.

## Known Stubs

None.

## Threat Flags

None. Todas las amenazas del threat model fueron mitigadas:
- T-05-01: verifyWebhook implementado, retorna 400 ante firma inválida
- T-05-03: índice único compuesto aplicado en OCSchema

## User Setup Required

Antes de poder usar esta capa de persistencia en producción:

1. **MongoDB Atlas**: Configurar `MONGODB_URI` en `.env.local` con connection string desde Atlas Dashboard. Network Access debe incluir `0.0.0.0/0` para IPs dinámicas de Vercel.

2. **Clerk Webhook**: 
   - Crear endpoint en Clerk Dashboard → Webhooks → Add Endpoint → URL: `https://{dominio}/api/webhooks/clerk` → Events: `user.created`
   - Copiar Signing Secret al `.env.local` como `CLERK_WEBHOOK_SIGNING_SECRET`

## Self-Check: PASSED

- src/lib/mongodb.ts: FOUND
- src/lib/models/OC.ts: FOUND  
- src/lib/models/User.ts: FOUND
- src/app/api/webhooks/clerk/route.ts: FOUND
- Commit a4cd62b: FOUND
- Commit 6f9ea3d: FOUND
- npx tsc --noEmit: sin errores

## Status: COMPLETE
