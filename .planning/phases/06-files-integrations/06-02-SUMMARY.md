---
phase: 06-files-integrations
plan: 02
subsystem: email-notifications
tags: [resend, react-email, server-action, fire-and-forget, clerk]
dependency_graph:
  requires: [06-01]
  provides: [oc-email-notifications, sendOCNotification-helper, OCNotificationEmail-template]
  affects: [src/actions/oc.ts, src/components/emails/OCNotificationEmail.tsx]
tech_stack:
  added: [resend@^6, @react-email/components@^1]
  patterns: [fire-and-forget-void, role-aware-recipients, react-email-template]
key_files:
  created:
    - src/components/emails/OCNotificationEmail.tsx
  modified:
    - src/actions/oc.ts
    - .env.example
    - package.json
decisions:
  - "sendOCNotification es helper interno sin export — no forma parte de la API pública del módulo"
  - "Fire-and-forget con void — errors en Resend no propagan al Server Action caller"
  - "Rol del editor se lee de publicMetadata via Clerk (consistente con resto del sistema)"
  - "importadorEmail obtenido via clerkClient().users.getUser(doc.importadorId) — nunca almacenado en OC"
metrics:
  duration: 15 min
  completed: 2026-06-02
  tasks_completed: 2
  files_modified: 4
---

# Phase 6 Plan 02: Resend Email Notifications Summary

Template React Email con identidad visual Driva Dev y helper `sendOCNotification` con lógica de destinatarios por rol, inyectado como fire-and-forget en los cuatro Server Actions mutadores de OC.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Template OCNotificationEmail con identidad visual | 7d31b1f | OCNotificationEmail.tsx, package.json, package-lock.json |
| 2 | Helper sendOCNotification + inyección fire-and-forget | bffae26 | oc.ts, .env.example |

## What Was Built

### Task 1
- `src/components/emails/OCNotificationEmail.tsx` — componente React Email sin `'use client'`
- Fondo `#f0f7ff`, encabezado `#004a80`, botón CTA `#0061a6`, link footer `#62b446`
- Campos: logo horizontal, HR separador, referenciaOC, proveedor, estado, fechaOC, notas (condicional), botón "Ver OC en el sistema", footer "Desarrollado por Driva Dev"
- Packages instalados: `resend`, `@react-email/components`

### Task 2
- `sendOCNotification(ocId, editorUserId)` — helper interno (sin `export`)
- Guard `estado === 'borrador'` → retorno temprano sin envío
- Lógica de destinatarios por rol:
  - Importador edita → [emailsProveedor, emailsDespachante]
  - Proveedor edita → [importadorEmail, emailsDespachante, otrosProveedor]
  - Despachante edita → [importadorEmail, emailsProveedor, otrosDespachante]
- Editor filtrado de recipients via emails Clerk
- `void sendOCNotification(...)` inyectado en: createOC, updateOC, updateOCInfo, updateOCDocumento
- `NEXT_PUBLIC_APP_URL` agregado a `.env.example`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Paquetes resend/@react-email/components no instalados**
- **Found during:** Task 1 (pre-ejecución)
- **Issue:** `package.json` no tenía `resend` ni `@react-email/components` — el template y el helper no podían compilar
- **Fix:** `npm install resend @react-email/components`
- **Files modified:** package.json, package-lock.json
- **Commit:** 7d31b1f

## Threat Model Compliance

| Threat | Status |
|--------|--------|
| T-06-05: Information Disclosure — editor en recipients | Mitigado — `recipients.filter(r => !editorEmails.includes(r))` antes del envío |
| T-06-06: DoS — fallo Resend bloquea Server Action | Aceptado — fire-and-forget con try/catch interno; fallo solo loguea en console.error |
| T-06-07: Info Disclosure — borradores notifican | Mitigado — guard `if (doc.estado === 'borrador') return` en primera línea efectiva |
| T-06-08: Spoofing — RESEND_FROM_EMAIL | Aceptado — dominio debe estar verificado en Resend Dashboard (bloqueante operacional) |

## Known Stubs

Ninguno. `sendOCNotification` llama a Resend API real con template React Email real.

## Self-Check: PASSED

- [x] `src/components/emails/OCNotificationEmail.tsx` existe
- [x] Contiene `export function OCNotificationEmail`
- [x] Contiene `import { Body, Container, Heading`
- [x] NO contiene `'use client'`
- [x] Contiene `backgroundColor: '#f0f7ff'`
- [x] Contiene `color: '#004a80'`
- [x] Contiene `oc.notas` con renderizado condicional
- [x] Contiene `href={link}` en el botón
- [x] `src/actions/oc.ts` contiene `import { Resend } from 'resend'`
- [x] `src/actions/oc.ts` contiene `import { OCNotificationEmail }`
- [x] `src/actions/oc.ts` contiene `async function sendOCNotification(` (sin export)
- [x] `src/actions/oc.ts` contiene `console.error('[sendOCNotification] failed:', err)`
- [x] `src/actions/oc.ts` contiene `if (doc.estado === 'borrador') return`
- [x] `src/actions/oc.ts` contiene 4 ocurrencias de `void sendOCNotification`
- [x] `src/actions/oc.ts` NO contiene `await sendOCNotification`
- [x] `npx tsc --noEmit` sin errores
