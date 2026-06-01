# DrivaOC — Claude Code Instructions

## Project

Sistema web de gestión de órdenes de compra (OC) para importadores. Tres roles: importador (full CRUD), proveedor y despachante (read-only de OCs asignadas).

**Stack:** Next.js App Router + TypeScript (strict) + Tailwind CSS + MongoDB Atlas + Clerk + Cloudinary + Resend + Google Sheets API v4

**Planning:** `.planning/` — leer ROADMAP.md y STATE.md antes de cualquier trabajo de implementación.

## GSD Workflow

Este proyecto usa Get Shit Done (GSD). Siempre:
1. Leer `.planning/STATE.md` para entender el estado actual
2. Seguir los planes en `.planning/phases/[N]/PLAN-*.md`
3. Commitear cada cambio atómicamente
4. Pushear a origin después de cada commit

Comandos clave:
- `/gsd-plan-phase [N]` — planificar una fase
- `/gsd-execute-phase [N]` — ejecutar una fase
- `/gsd-progress` — ver progreso

## Code Standards

- TypeScript strict — sin `any`, sin `as any`
- Server Actions para CRUD; API Routes solo para: Cloudinary signing, PDF download, Clerk webhook
- `export const runtime = 'nodejs'` en routes que usan Mongoose o react-pdf
- Mongoose: singleton global con `maxPoolSize: 5`, `bufferCommands: false`
- `decimal.js` para toda matemática financiera — nunca float nativo
- Valores monetarios en MongoDB como enteros (centavos)
- Sin comentarios explicativos — el código debe ser autoexplicativo

## Critical Patterns

**MongoDB singleton:** `lib/mongodb.ts` con `global.mongooseCache`
**Clerk role check:** `sessionClaims?.metadata?.role` (requiere customizar session token en Clerk Dashboard)
**Cloudinary PDF:** `resource_type: 'raw'`, signed upload via API Route (nunca `NEXT_PUBLIC_` para secrets)
**Google Sheets private key:** `.replace(/\\n/g, '\n')` al leer de env var
**OC draft:** guardar como `estado: 'borrador'` en Step 1, completar en Step 2

## Brand Identity

- Colores: `#0061a6` (principal/azul), `#004a80` (titulares), `#62b446` (acento/verde), `#f0f7ff` (fondo), `#1C1917` (texto)
- Fuente: Fira Sans (Google Fonts) — 700 H1/H2, 500 H3/nav, 400 body, 300 captions
- Footer: "Desarrollado por Driva Dev" + link a `drivadev.com.ar`
- Logos en: `public/logo.svg` (vertical), `public/logo-horizontal.svg`, `public/isotipo.svg`

## Env Vars Required

Ver `.env.example` para la lista completa. Nunca commitear `.env.local`.
