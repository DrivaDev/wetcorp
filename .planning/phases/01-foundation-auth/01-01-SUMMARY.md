---
phase: 1
plan: "01-01"
subsystem: foundation
tags: [scaffold, nextjs, tailwind, clerk, typescript, brand-identity]
dependency_graph:
  requires: []
  provides: [nextjs-project, tailwind-v4-theme, clerk-provider, brand-identity, logos]
  affects: [all-subsequent-plans]
tech_stack:
  added:
    - next@16.2.6
    - react@19.2.4
    - react-dom@19.2.4
    - "@clerk/nextjs@7.4.1"
    - tailwindcss@4.3.0
    - "@tailwindcss/postcss@4.x"
    - lucide-react@1.16.0
    - clsx@2.1.1
    - tailwind-merge@3.6.0
    - typescript@5.x
  patterns:
    - Tailwind v4 @theme custom properties (no tailwind.config.js)
    - next/font/google with CSS variable injection
    - ClerkProvider wrapping html tag
    - cn() utility via clsx + tailwind-merge
key_files:
  created:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/lib/utils.ts
    - src/types/globals.d.ts
    - public/logo.svg
    - public/logo-horizontal.svg
    - public/isotipo.svg
    - .env.example
  modified:
    - src/app/page.tsx
    - package.json
    - .gitignore
decisions:
  - "Scaffolded into temp directory 'drivaoc-temp' then moved files — npm rejects package names with capital letters (DrivaOC); deviation from plan but same result"
  - "Refined .gitignore from .env* to specific .env.local/.env.*.local patterns to allow .env.example to be committed"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-05-25"
  tasks_completed: 3
  files_created: 8
---

# Phase 1 Plan 01: Next.js scaffold — TypeScript strict, Tailwind v4, brand identity, logos, env Summary

Next.js 16.2.6 scaffolded with TypeScript strict, Tailwind v4 @theme brand tokens (5 Driva Dev colors + Fira Sans), ClerkProvider root layout, cn() utility, CustomJwtSessionClaims type declaration, three SVG logos, and .env.example with all required keys.

## What Was Built

### Next.js Project Scaffolded

| Package | Version | Role |
|---------|---------|------|
| next | 16.2.6 | Framework |
| react | 19.2.4 | UI runtime |
| react-dom | 19.2.4 | DOM renderer |
| @clerk/nextjs | 7.4.1 | Auth + RBAC |
| tailwindcss | 4.3.0 | Utility CSS (v4) |
| @tailwindcss/postcss | 4.x | PostCSS plugin for Tailwind v4 |
| lucide-react | 1.16.0 | Icon set |
| clsx | 2.1.1 | Conditional class composition |
| tailwind-merge | 3.6.0 | Tailwind class conflict resolution |
| typescript | 5.x | Type safety (strict mode) |

### TypeScript Strict Mode

`tsconfig.json` contains `"strict": true` under compilerOptions. Verified: `npx tsc --noEmit` exits 0 with zero errors.

### Tailwind v4 Brand Theme Applied

`src/app/globals.css` uses `@import "tailwindcss"` (v4 pattern — not `@tailwind base/components/utilities`).

All 5 brand color tokens defined in `@theme` block:

| Token | Value | Usage |
|-------|-------|-------|
| --color-principal | #EA580C | Primary brand orange — buttons, links, CTAs |
| --color-titulares | #9A3412 | Headings, dark orange |
| --color-acento | #FED7AA | Accent, borders, hover backgrounds |
| --color-fondo | #FFF7ED | Page background |
| --color-texto | #1C1917 | Body text |

Font token: `--font-sans: var(--font-fira-sans), ui-sans-serif, system-ui, sans-serif`

### Root Layout

`src/app/layout.tsx` contains:
- `ClerkProvider` wrapping the html element
- `Fira_Sans` from `next/font/google` with weights 300, 400, 500, 700
- CSS variable `--font-fira-sans` injected via `firaSans.variable`
- `lang="es"` on html element
- `bg-fondo text-texto font-sans antialiased` on body element

### Utility Files

- `src/lib/utils.ts`: exports `cn()` helper (clsx + tailwind-merge)
- `src/types/globals.d.ts`: declares `CustomJwtSessionClaims` with `role?: 'importador' | 'proveedor' | 'despachante'` — enables typed `sessionClaims?.metadata?.role` in middleware without `any`

### Logo Files Copied

| File | Source | Size |
|------|--------|------|
| public/logo.svg | C:\Users\Equipo\Downloads\logo-svg (1).svg | 28,048 bytes |
| public/logo-horizontal.svg | C:\Users\Equipo\Downloads\logo-horizontal-svg.svg | 28,224 bytes |
| public/isotipo.svg | C:\Users\Equipo\Downloads\isotipo-svg.svg | 1,450 bytes |

### .env.example

Committed with all required keys:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (client-safe)
- `CLERK_SECRET_KEY` (NO NEXT_PUBLIC_ prefix — server-only, security requirement)
- Clerk redirect URLs for sign-in, sign-up, onboarding flow
- Empty stubs for MongoDB, Cloudinary, Resend, Google Sheets (setup in later phases)

### page.tsx

Replaced create-next-app boilerplate with minimal redirect to `/sign-in`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm rejects 'DrivaOC' as package name (capital letters)**
- **Found during:** Task T-01-01
- **Issue:** `npx create-next-app@latest .` failed with "name can no longer contain capital letters" because the directory name DrivaOC contains uppercase letters
- **Fix:** Scaffolded into `drivaoc-temp` directory alongside DrivaOC, then moved all files into DrivaOC. Package name set to `drivaoc` in package.json.
- **Files modified:** package.json (name field)
- **Commit:** 4c476fb

**2. [Rule 2 - Security] .gitignore .env* pattern blocked .env.example from being committed**
- **Found during:** Task T-01-03
- **Issue:** The scaffold's `.gitignore` used `.env*` which blocked `.env.example` from being staged. The plan requires `.env.example` to be committed.
- **Fix:** Refined `.gitignore` from `.env*` to specific patterns: `.env.local`, `.env.*.local`, `.env.development`, `.env.production`. This allows `.env.example` to be committed while still protecting all actual secret files.
- **Files modified:** .gitignore
- **Commit:** 80c3b84

## Verification Results

```
npx tsc --noEmit → exit code 0 (zero errors)
postcss.config.mjs → uses @tailwindcss/postcss (v4 plugin)
globals.css → @import "tailwindcss" + @theme with all 5 brand colors
layout.tsx → ClerkProvider + Fira_Sans + lang="es"
public/logo.svg → True (28,048 bytes)
public/logo-horizontal.svg → True (28,224 bytes)
public/isotipo.svg → True (1,450 bytes)
git status .env.local → empty (gitignored)
```

## Commits

| Hash | Message |
|------|---------|
| 4c476fb | chore(01-01): scaffold Next.js 16 with TypeScript strict and Tailwind v4 |
| 51c6987 | chore(01-01): add scaffold src and public files from create-next-app |
| 097081a | feat(01-01): apply Tailwind v4 brand theme and configure root layout |
| 80c3b84 | feat(01-01): copy SVG logos, create .env.example, replace page.tsx with redirect |

## Known Stubs

None. All files created in this plan are fully functional (no placeholder data flowing to UI rendering).

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat model:
- T-01-01: .env.local gitignored — mitigated
- T-01-02: CLERK_SECRET_KEY without NEXT_PUBLIC_ prefix — mitigated
- T-01-03: Next.js 16.2.6 >= 15.2.3 threshold — CVE-2025-29927 mitigated

## Self-Check: PASSED

- [x] src/app/globals.css exists with @import "tailwindcss" and 5 brand color tokens
- [x] src/app/layout.tsx exists with ClerkProvider, Fira_Sans, lang="es"
- [x] src/lib/utils.ts exists with cn() export
- [x] src/types/globals.d.ts exists with CustomJwtSessionClaims
- [x] public/logo.svg exists (28,048 bytes > 0)
- [x] public/logo-horizontal.svg exists (28,224 bytes > 0)
- [x] public/isotipo.svg exists (1,450 bytes > 0)
- [x] .env.example exists with CLERK_SECRET_KEY (no NEXT_PUBLIC_ prefix)
- [x] npx tsc --noEmit exits 0
- [x] Commits 4c476fb, 51c6987, 097081a, 80c3b84 exist in git log
