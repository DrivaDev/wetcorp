# Phase 2: Dashboard UI - Pattern Map

**Mapped:** 2026-05-25
**Files analyzed:** 9
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/mock-ocs.ts` | utility/data | transform | `src/lib/utils.ts` | partial (same lib layer) |
| `src/components/dashboard/StatCard.tsx` | component | request-response | `src/components/layout/Sidebar.tsx` | role-match (cn + lucide pattern) |
| `src/components/dashboard/OCTable.tsx` | component | request-response | `src/components/layout/Sidebar.tsx` | role-match (cn + conditional rendering) |
| `src/components/dashboard/FilterBar.tsx` | component | event-driven | `src/components/layout/Sidebar.tsx` | role-match (cn + state) |
| `src/components/dashboard/EmptyState.tsx` | component | request-response | `src/components/layout/Sidebar.tsx` | role-match (cn + link pattern) |
| `src/components/dashboard/DeleteModal.tsx` | component | event-driven | `src/components/layout/Sidebar.tsx` | role-match (cn + state + overlay) |
| `src/app/(importador)/importador/dashboard/page.tsx` | page (Server Component) | request-response | `src/app/(importador)/importador/dashboard/page.tsx` | exact (replace stub) |
| `src/app/(proveedor)/proveedor/dashboard/page.tsx` | page (Server Component) | request-response | `src/app/(proveedor)/proveedor/dashboard/page.tsx` | exact (replace stub) |
| `src/app/(despachante)/despachante/dashboard/page.tsx` | page (Server Component) | request-response | `src/app/(despachante)/despachante/dashboard/page.tsx` | exact (replace stub) |

---

## Pattern Assignments

### `src/lib/mock-ocs.ts` (utility, transform)

**Analog:** `src/lib/utils.ts` (same library layer convention — no class, pure exports)

**Imports pattern** (`src/lib/utils.ts` lines 1-2):
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
```

**Core pattern — structure to follow:**
- No default export. Use named exports only.
- Export TypeScript types/interfaces first, then the data array.
- OC type must cover all 6 estados: `'borrador' | 'en_proceso' | 'en_transito' | 'en_aduana' | 'entregada' | 'cancelada'`
- Fields needed by OCTable (D-02): `id`, `numeroOC`, `proveedor` (string — email o nombre), `estado`, `fecha` (ISO string), plus `despachante` (email) for role filtering.
- No `any`. TypeScript strict.

**Skeleton shape to produce:**
```typescript
export type EstadoOC =
  | 'borrador'
  | 'en_proceso'
  | 'en_transito'
  | 'en_aduana'
  | 'entregada'
  | 'cancelada'

export interface OC {
  id: string
  numeroOC: string
  proveedor: string        // email del proveedor
  despachante: string      // email del despachante
  estado: EstadoOC
  fecha: string            // ISO date string
}

export const MOCK_OCS: OC[] = [
  // ~8-10 entries covering all 6 estados
]
```

---

### `src/components/dashboard/StatCard.tsx` (component, request-response)

**Analog:** `src/components/layout/Sidebar.tsx`

**Imports pattern** (lines 1-15):
```typescript
'use client'  // NOT needed for StatCard — it's a pure display component, no state
import { cn } from '@/lib/utils'
// lucide-react: import specific icon type as prop
import type { LucideIcon } from 'lucide-react'
```

**Core pattern — StatCard is a Server Component (no state, no hooks):**
- Props: `{ icon: LucideIcon; value: number; label: string }`
- Brand tokens (D-06): `bg-white`, `border border-acento`, `rounded-lg`, `p-6`
- Icon: `text-principal`, size 28-32
- Value: `text-3xl font-bold text-titulares`
- Label: `text-sm font-light text-texto/70`

**cn() usage pattern** (Sidebar lines 91-98):
```typescript
className={cn(
  'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
  isActive
    ? 'border-l-2 border-principal text-principal bg-acento/50'
    : 'hover:bg-acento text-texto'
)}
```

**Touch target pattern** (Sidebar line 62):
```typescript
className="text-texto hover:text-principal p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
```

---

### `src/components/dashboard/OCTable.tsx` (component, request-response)

**Analog:** `src/components/layout/Sidebar.tsx`

**Directive:** `'use client'` — needs `useState` for loading skeleton simulation (or receives `isLoading` prop).

**Imports pattern:**
```typescript
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OC } from '@/lib/mock-ocs'
```

**Badge pattern** — derived from brand rules (PROJECT.md §Brand Identity):
- Base: `bg-acento text-titulares` (warm orange tones only, no green/red)
- Variations within the orange/amber brand system:
  - `borrador`: `bg-acento/40 text-texto/60` (muted, light)
  - `en_proceso`: `bg-acento text-titulares` (baseline acento)
  - `en_transito`: `bg-principal/20 text-principal` (orange tint)
  - `en_aduana`: `bg-principal/30 text-titulares` (mid orange)
  - `entregada`: `bg-titulares/10 text-titulares` (deep, muted)
  - `cancelada`: `bg-texto/10 text-texto/50` (neutral grey within brand)

**Conditional action buttons pattern** (D-03, based on Sidebar conditional rendering lines 100-101):
```typescript
{(isMobileOverlay || !collapsed) && <span>{label}</span>}
```
Adapt to:
```typescript
// role prop: 'importador' | 'proveedor' | 'despachante'
{role === 'importador' && (
  <button aria-label="Eliminar OC" className="...">
    <Trash2 size={16} />
  </button>
)}
```

**Skeleton pattern** — use Tailwind `animate-pulse` divs, no external library:
```typescript
// Skeleton row
<div className="h-4 bg-acento/50 rounded animate-pulse w-24" />
```

**Scroll pattern for responsive table** (D-01):
```typescript
<div className="overflow-x-auto rounded-lg border border-acento">
  <table className="w-full min-w-[600px] text-sm">
    ...
  </table>
</div>
```

---

### `src/components/dashboard/FilterBar.tsx` (component, event-driven)

**Analog:** `src/components/layout/Sidebar.tsx` (state + cn pattern)

**Directive:** `'use client'` — needs `useState` for controlled inputs.

**Imports pattern:**
```typescript
'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EstadoOC } from '@/lib/mock-ocs'
```

**Input focus pattern** (PROJECT.md §Brand Identity):
- Focus border: `focus:outline-none focus:ring-2 focus:ring-principal focus:border-principal`
- Base input: `border border-acento rounded-lg px-3 py-2 text-sm text-texto bg-white`

**Props interface:**
```typescript
interface FilterBarProps {
  onSearch: (query: string) => void
  onEstado: (estado: EstadoOC | '') => void
}
```

---

### `src/components/dashboard/EmptyState.tsx` (component, request-response)

**Analog:** `src/components/layout/Sidebar.tsx` — CTA button pattern (lines 104-115)

**Directive:** Server Component — no state needed.

**CTA button pattern** (Sidebar lines 107-115):
```typescript
<Link
  href="/importador/oc/nueva"
  className={cn(
    'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
    'bg-principal text-white hover:bg-titulares',
    isMobileOverlay || !collapsed ? '' : 'justify-center'
  )}
>
  <PlusCircle size={20} />
  {(isMobileOverlay || !collapsed) && <span>Nueva OC</span>}
</Link>
```

Adapt for EmptyState (importador only shows CTA):
```typescript
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// CTA links to: /importador/oc/nueva
// Proveedor/despachante: show message only, no CTA button
```

---

### `src/components/dashboard/DeleteModal.tsx` (component, event-driven)

**Analog:** `src/components/layout/Sidebar.tsx` — mobile overlay pattern (lines 139-157)

**Directive:** `'use client'` — controlled open/close state.

**Overlay backdrop pattern** (Sidebar lines 140-146):
```typescript
{mobileOpen && (
  <div
    className="fixed inset-0 z-40 bg-texto/20 sm:hidden"
    onClick={() => setMobileOpen(false)}
    aria-hidden="true"
  />
)}
```

**Modal panel pattern** (Sidebar lines 149-157):
```typescript
<aside
  className={cn(
    'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-acento sm:hidden',
    'transition-transform duration-200',
    mobileOpen ? 'translate-x-0' : '-translate-x-full'
  )}
>
```

Adapt to centered modal:
```typescript
// Overlay: fixed inset-0 z-50 bg-texto/40 flex items-center justify-center
// Panel: bg-white rounded-lg border border-acento p-6 max-w-sm w-full mx-4
// Confirm button: bg-principal text-white hover:bg-titulares (same as CTA)
// Cancel button: border border-acento text-texto hover:bg-acento/50
```

**Props interface:**
```typescript
interface DeleteModalProps {
  open: boolean
  ocNumero: string
  onConfirm: () => void
  onCancel: () => void
}
```

---

### Dashboard page stubs → replacements

#### `src/app/(importador)/importador/dashboard/page.tsx` (page, Server Component)

**Current stub** (lines 1-8):
```typescript
export default function ImportadorDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-titulares">Dashboard</h1>
      <p className="text-base text-texto/60 mt-2">Esta sección está en construcción.</p>
    </div>
  )
}
```

**Replace with:**
- Server Component (no directive needed)
- Import `MOCK_OCS` from `@/lib/mock-ocs`
- Import `StatCard`, `OCTable`, `FilterBar`, `EmptyState` from `@/components/dashboard/`
- Page title pattern: `<h1 className="text-2xl font-bold text-titulares">Dashboard</h1>`
- Layout wrapper: the existing layout (`src/app/(importador)/layout.tsx`) already provides `p-6 bg-fondo` — page content goes directly into a `<div className="space-y-6">`
- Pass `role="importador"` prop to `OCTable`
- Stat cards: OC Totales, En tránsito, En Aduana, Entregadas — all computed from `MOCK_OCS`

#### `src/app/(proveedor)/proveedor/dashboard/page.tsx` (page, Server Component)

Same structure as importador, with:
- Pass `role="proveedor"` to `OCTable` (Eye + Pencil, no Trash2)
- Filter `MOCK_OCS` where `oc.proveedor === userEmail` — for Phase 2 mock, hardcode a mock email or pass all

#### `src/app/(despachante)/despachante/dashboard/page.tsx` (page, Server Component)

Same as proveedor with:
- Pass `role="despachante"` to `OCTable`
- Filter `MOCK_OCS` where `oc.despachante === userEmail`

---

## Shared Patterns

### cn() — Conditional Class Merging
**Source:** `src/lib/utils.ts` lines 1-6
**Apply to:** All new components
```typescript
import { cn } from '@/lib/utils'
```

### Brand Tokens — Tailwind Custom Properties
**Source:** `src/app/globals.css` lines 3-11 + Sidebar usage throughout
**Apply to:** All new components and pages

| Token | Value | Usage |
|-------|-------|-------|
| `text-principal` / `bg-principal` | `#EA580C` | CTAs, icon accents, focus rings |
| `text-titulares` / `bg-titulares` | `#9A3412` | H1/H2, badge text, deep states |
| `bg-acento` / `border-acento` | `#FED7AA` | Card borders, badge backgrounds, dividers |
| `bg-fondo` | `#FFF7ED` | Page background (provided by layout) |
| `text-texto` | `#1C1917` | Body text |

### Typography Scale
**Source:** `CLAUDE.md` §Brand Identity + Sidebar usage
```typescript
// H1/H2 — page titles
"text-2xl font-bold text-titulares"     // from existing stubs
// H3/nav — section headers
"text-base font-medium text-titulares"
// Body
"text-sm text-texto"
// Captions / labels
"text-xs font-light text-texto/70"
```

### Touch Targets
**Source:** `src/components/layout/Sidebar.tsx` lines 60-64, 68-73
**Apply to:** All icon buttons in OCTable actions column
```typescript
className="min-h-[44px] min-w-[44px] flex items-center justify-center"
```

### Primary CTA Button
**Source:** `src/components/layout/Sidebar.tsx` lines 107-115
**Apply to:** EmptyState CTA, DeleteModal confirm button
```typescript
className={cn(
  'flex items-center gap-3 px-4 py-2 rounded-lg min-h-[44px]',
  'bg-principal text-white hover:bg-titulares transition-colors duration-150'
)}
```

### 'use client' Rule
**Source:** `CLAUDE.md` §Code Standards + Sidebar.tsx line 1
**Apply to:** Components with `useState`/`useEffect` only.
- `StatCard.tsx` — Server Component (no directive)
- `EmptyState.tsx` — Server Component (no directive)
- `OCTable.tsx` — `'use client'` (isLoading state or skeleton)
- `FilterBar.tsx` — `'use client'` (controlled inputs)
- `DeleteModal.tsx` — `'use client'` (open/close state)
- All three dashboard `page.tsx` — Server Components (no directive)

### lucide-react Icon Import Pattern
**Source:** `src/components/layout/Sidebar.tsx` lines 7-14
```typescript
import {
  LayoutDashboard,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
```
Named imports only. Icons at `size={20}` for nav/actions, `size={28-32}` for stat cards.

---

## No Analog Found

All files have viable analogs. No external pattern sources required beyond what RESEARCH.md provides for table/modal HTML semantics.

---

## Metadata

**Analog search scope:** `src/components/layout/`, `src/app/**/dashboard/page.tsx`, `src/lib/`, `src/app/globals.css`
**Files scanned:** 9 existing files read
**Pattern extraction date:** 2026-05-25
