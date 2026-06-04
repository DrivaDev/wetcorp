# Phase 3: OC Wizard UI - Pattern Map

**Mapped:** 2026-05-27
**Files analyzed:** 10 (7 wizard components + 2 lib files + 1 page)
**Analogs found:** 9 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/(importador)/importador/oc/nueva/page.tsx` | page (Server Component wrapper) | request-response | `src/app/(importador)/importador/dashboard/page.tsx` | role-match |
| `src/components/wizard/WizardPage.tsx` | component (client root) | event-driven | `src/components/layout/Sidebar.tsx` | partial (useState + useEffect + localStorage → sessionStorage) |
| `src/components/wizard/Step1Form.tsx` | component (form) | event-driven | `src/components/dashboard/FilterBar.tsx` | role-match (controlled inputs + onChange handlers) |
| `src/components/wizard/Step2Form.tsx` | component (form) | event-driven | `src/components/dashboard/FilterBar.tsx` | role-match |
| `src/components/wizard/ProductosTable.tsx` | component (dynamic table) | event-driven | `src/components/dashboard/OCTable.tsx` | exact (table rows + Trash2 icon + cn() + touch targets) |
| `src/components/wizard/GastosCard.tsx` | component (card section) | event-driven | `src/components/dashboard/StatCard.tsx` | role-match (card container + border-acento + value display) |
| `src/components/wizard/OtrosGastosSection.tsx` | component (dynamic list) | event-driven | `src/components/dashboard/OCTable.tsx` | partial (dynamic rows + Trash2 + Plus pattern) |
| `src/components/wizard/DocumentSlots.tsx` | component (static UI) | request-response | `src/components/dashboard/StatCard.tsx` | partial (card container + border + icon) |
| `src/components/wizard/ValueCards.tsx` | component (value display) | request-response | `src/components/dashboard/StatCard.tsx` | exact (card layout + value + label + icon) |
| `src/lib/wizard-types.ts` | utility (types) | — | `src/lib/mock-ocs.ts` | role-match (TypeScript interface definitions) |
| `src/lib/wizard-calculations.ts` | utility (pure functions) | transform | — | no analog (first decimal.js calc file in project) |

---

## Pattern Assignments

### `src/app/(importador)/importador/oc/nueva/page.tsx` (Server Component wrapper)

**Analog:** `src/app/(importador)/importador/dashboard/page.tsx`

**Nota clave:** La dashboard page es `'use client'` porque usa `useState`. La nueva page.tsx del wizard debe ser un **Server Component async** que lee `searchParams` como prop Promise (Next.js 16) y pasa `initialStep` a `WizardPage` como Client Component. Este es un patrón diferente al dashboard — ver Pattern 3 en RESEARCH.md.

**Imports pattern** — `src/app/(importador)/importador/dashboard/page.tsx` líneas 1-8:
```typescript
'use client'
import { useState } from 'react'
import { FileText, Truck, Package, CheckCircle2 } from 'lucide-react'
import { MOCK_OCS } from '@/lib/mock-ocs'
import type { EstadoOC } from '@/lib/mock-ocs'
import { StatCard } from '@/components/dashboard/StatCard'
import { OCTable } from '@/components/dashboard/OCTable'
import { FilterBar } from '@/components/dashboard/FilterBar'
```

**Page structure pattern** — líneas 10-51:
```typescript
// Para el wizard page.tsx, adaptar a Server Component:
// - Sin 'use client', sin useState
// - async function, await searchParams
// - Pasar initialStep como prop a WizardPage (Client Component)
interface PageProps {
  searchParams: Promise<{ step?: string }>  // Next.js 16: es Promise
}

export default async function NuevaOCPage({ searchParams }: PageProps) {
  const { step } = await searchParams
  return <WizardPage initialStep={step ?? '1'} />
}
```

**Padding / layout wrapper** — `src/app/(importador)/importador/dashboard/page.tsx` línea 35:
```typescript
<div className="p-4 sm:p-6">
  <h1 className="text-xl font-bold text-titulares mb-6">Dashboard</h1>
  ...
</div>
```

---

### `src/components/wizard/WizardPage.tsx` (Client Component root del wizard)

**Analog:** `src/components/layout/Sidebar.tsx`

**Razón:** Sidebar es el único componente existente que combina `'use client'` + `useState` + `useEffect` + persistencia local (localStorage → aquí será sessionStorage). El patrón de inicialización en `useEffect` es directamente aplicable.

**Imports pattern** — `src/components/layout/Sidebar.tsx` líneas 1-16:
```typescript
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserButton, SignOutButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
```

**useEffect con storage pattern** — `src/components/layout/Sidebar.tsx` líneas 28-35:
```typescript
useEffect(() => {
  const stored = localStorage.getItem('sidebar-collapsed')
  if (stored !== null) {
    setCollapsed(stored === 'true')
  } else {
    setCollapsed(window.innerWidth < 1024)
  }
}, [])
```
Adaptar para WizardPage: leer sessionStorage en lugar de localStorage, y redirigir a `?step=1` si `initialStep === '2'` pero sessionStorage está vacío.

**cn() para clases condicionales** — `src/components/layout/Sidebar.tsx` líneas 85-92:
```typescript
className={cn(
  'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
  collapsed && !isMobileOverlay ? 'justify-center' : '',
  isActive
    ? 'border-l-2 border-[#EA580C] text-[#EA580C] bg-[#EA580C]/10'
    : 'text-white/70 hover:text-white hover:bg-white/10'
)}
```

---

### `src/components/wizard/Step1Form.tsx` (form, event-driven)

**Analog:** `src/components/dashboard/FilterBar.tsx`

**Razón:** FilterBar es el único componente existente con inputs controlados y onChange handlers — patrón directo para los campos de info general.

**Input controlado pattern** — `src/components/dashboard/FilterBar.tsx` líneas 13-17:
```typescript
const inputClass =
  'w-full sm:w-56 px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150'

const selectClass =
  'w-full sm:w-48 px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer'
```
Estos son los tokens de input/select del proyecto. Usar exactamente en Step1Form para consistencia visual.

**onChange handler pattern** — `src/components/dashboard/FilterBar.tsx` líneas 25-29:
```typescript
<input
  type="text"
  placeholder="Buscar por proveedor..."
  className={inputClass}
  onChange={(e) => onSearchProveedor?.(e.target.value)}
/>
```

**Select controlado** — `src/components/dashboard/FilterBar.tsx` líneas 38-47:
```typescript
<select className={selectClass} onChange={(e) => onEstado(e.target.value as EstadoOC | '')}>
  <option value="">Todos los estados</option>
  <option value="borrador">Borrador</option>
  ...
</select>
```

**Layout de sección** — `src/app/(importador)/importador/dashboard/page.tsx` líneas 34-41:
```typescript
<div className="p-4 sm:p-6">
  <h1 className="text-xl font-bold text-titulares mb-6">Dashboard</h1>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
    ...
  </div>
</div>
```
Adaptar grid a `sm:grid-cols-2` para los campos de info general del Step 1.

---

### `src/components/wizard/Step2Form.tsx` (form, event-driven)

**Analog:** `src/components/dashboard/FilterBar.tsx` + `src/components/dashboard/OCTable.tsx`

Mismo patrón de inputs controlados que Step1Form. Adicionalmente, el patrón de tabla de OCTable aplica para la lista de productos en el resumen read-only de Step 2.

**Read-only display pattern** — `src/components/dashboard/OCTable.tsx` líneas 123-143:
```typescript
{ocs.map((oc) => (
  <tr key={oc.id} className="border-b border-acento/50 hover:bg-acento/20 transition-colors duration-150">
    <td className="px-4 py-3 w-[100px]">
      <span className="font-medium text-titulares">{oc.numeroOC}</span>
    </td>
    <td className="px-4 py-3 text-base text-texto">{oc.proveedor}</td>
    ...
  </tr>
))}
```

---

### `src/components/wizard/ProductosTable.tsx` (dynamic table, event-driven)

**Analog:** `src/components/dashboard/OCTable.tsx`

**Razón:** Match exacto — tabla con filas dinámicas, iconos lucide-react, `cn()`, touch targets `min-h-[44px] min-w-[44px]`, tokens de color del proyecto.

**Imports pattern** — `src/components/dashboard/OCTable.tsx` líneas 1-8:
```typescript
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OC, EstadoOC } from '@/lib/mock-ocs'
import { DeleteModal } from './DeleteModal'
import { EmptyState } from './EmptyState'
```
Adaptar: importar `{ Trash2, Plus } from 'lucide-react'`, importar tipos de `@/lib/wizard-types`.

**Estructura de table con overflow scroll** — `src/components/dashboard/OCTable.tsx` líneas 119-122:
```typescript
<div className="w-full overflow-x-auto rounded-xl border border-acento bg-white">
  <table className={cn('w-full text-base', minWidth)}>
    <TableHead rol={rol} />
    <tbody>
```

**Table head pattern** — `src/components/dashboard/OCTable.tsx` líneas 47-65:
```typescript
function TableHead({ rol }: { rol: Rol }) {
  return (
    <thead className="bg-fondo border-b border-acento">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-medium text-titulares whitespace-nowrap w-[100px]">Nº OC</th>
        ...
      </tr>
    </thead>
  )
}
```

**Botón icono con touch target** — `src/components/dashboard/OCTable.tsx` líneas 159-166:
```typescript
<button
  onClick={() => setDeleteTarget(oc)}
  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-150"
  aria-label="Eliminar OC"
>
  <Trash2 size={18} />
</button>
```
Aplicar directamente al botón Trash2 de eliminación de fila de producto. Cuando `productos.length === 1`, añadir `disabled` y clases de opacidad reducida para indicar estado deshabilitado.

**Fila de tabla** — `src/components/dashboard/OCTable.tsx` líneas 123-125:
```typescript
<tr key={oc.id} className="border-b border-acento/50 hover:bg-acento/20 transition-colors duration-150">
```
En la tabla de productos, usar `key={row.id}` (UUID estable) — nunca `key={index}`.

---

### `src/components/wizard/GastosCard.tsx` (card section, event-driven)

**Analog:** `src/components/dashboard/StatCard.tsx`

**Razón:** Match de rol — card con border, bg-white, rounded-xl, valor numérico destacado y label. Adaptar para contener inputs en lugar de solo mostrar valores.

**Card container pattern** — `src/components/dashboard/StatCard.tsx` líneas 9-17:
```typescript
export function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="bg-white border border-acento rounded-xl p-6 flex flex-col gap-3">
      <Icon size={24} className="text-principal" />
      <p className="text-4xl font-bold text-texto">{value}</p>
      <p className="text-sm font-light text-titulares">{label}</p>
    </div>
  )
}
```
GastosCard conserva `bg-white border border-acento rounded-xl` y añade un título bold de sección + inputs + línea de subtotal al pie.

**Imports pattern** — `src/components/dashboard/StatCard.tsx` líneas 1-6:
```typescript
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  value: number
  label: string
}
```

---

### `src/components/wizard/OtrosGastosSection.tsx` (dynamic list, event-driven)

**Analog:** `src/components/dashboard/OCTable.tsx`

Mismo patrón de filas dinámicas con add/remove que ProductosTable, pero en formato de lista vertical en lugar de tabla horizontal. Comparte el patrón de botón Trash2 con touch target y el patrón de add con Plus icon.

**Botón agregar pattern** — adaptar de `src/components/layout/Sidebar.tsx` líneas 99-110:
```typescript
<Link
  href="/importador/oc/nueva"
  className={cn(
    'flex items-center gap-3 px-3 py-2 rounded-lg min-h-[44px] transition-colors duration-150',
    'bg-[#EA580C] text-white hover:bg-[#9A3412]',
  )}
>
  <PlusCircle size={20} />
  <span className="text-sm font-medium">Nueva OC</span>
</Link>
```
Adaptar a `<button>` con `Plus` icon y clases de la marca para el botón "+ Agregar gasto".

**Select de divisa** — `src/components/dashboard/FilterBar.tsx` líneas 38-47:
```typescript
<select className={selectClass} onChange={(e) => ...}>
  <option value="ARS">ARS</option>
  <option value="USD">USD</option>
</select>
```

---

### `src/components/wizard/DocumentSlots.tsx` (static UI, request-response)

**Analog:** `src/components/dashboard/StatCard.tsx`

**Razón:** Cada slot es una card con border, ícono centrado y label — estructura idéntica a StatCard pero con border-dashed y sin valor numérico.

**Card base** — `src/components/dashboard/StatCard.tsx` líneas 9-17:
```typescript
<div className="bg-white border border-acento rounded-xl p-6 flex flex-col gap-3">
  <Icon size={24} className="text-principal" />
  ...
</div>
```
Adaptar para DocumentSlot: `border-dashed border-acento` en lugar de `border border-acento`. El ícono será `Upload` de lucide-react. Sin funcionalidad en Phase 3.

**Touch target para el slot (clickable area futura)** — `src/components/dashboard/OCTable.tsx` línea 147:
```typescript
className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-texto hover:text-principal hover:bg-acento/30 transition-colors duration-150"
```

---

### `src/components/wizard/ValueCards.tsx` (value display, request-response)

**Analog:** `src/components/dashboard/StatCard.tsx`

**Razón:** Match exacto de estructura — card con valor numérico grande, label, y ícono. Adaptar para mostrar valor USD primario + subtítulo ARS secundario.

**Card structure** — `src/components/dashboard/StatCard.tsx` líneas 9-17:
```typescript
export function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="bg-white border border-acento rounded-xl p-6 flex flex-col gap-3">
      <Icon size={24} className="text-principal" />
      <p className="text-4xl font-bold text-texto">{value}</p>
      <p className="text-sm font-light text-titulares">{label}</p>
    </div>
  )
}
```
ValueCard añade una segunda línea debajo del valor principal para el equivalente ARS (texto pequeño, `text-texto/60`).

**Grid de cards** — `src/app/(importador)/importador/dashboard/page.tsx` líneas 36-39:
```typescript
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
  <StatCard icon={FileText} value={stats.totales} label="OC Totales" />
  ...
</div>
```
Adaptar a `grid grid-cols-1 sm:grid-cols-3 gap-4` para las 3 ValueCards.

---

### `src/lib/wizard-types.ts` (types utility)

**Analog:** `src/lib/mock-ocs.ts`

**Razón:** Match de rol — archivo de tipos TypeScript con `interface` y `type` exports.

**Interface export pattern** — `src/lib/mock-ocs.ts` líneas 1-19:
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
  proveedor: string
  emailProveedor: string
  despachante: string
  emailDespachante: string
  numeroDespacho: string
  estado: EstadoOC
  fecha: string
}
```
`wizard-types.ts` debe exportar: `ProductRow`, `InfoGeneralState`, `GastosDespacho`, `GastosDespachante`, `GastosAdicionales`, `OtroGastoRow`, `Step1Data`. Todos los campos numéricos como `string` (inputs controlados).

---

### `src/lib/wizard-calculations.ts` (pure functions, transform)

**Analog:** Ninguno — primer archivo de cálculos financieros en el proyecto.

Ver sección "No Analog Found" más abajo. El planner debe usar los ejemplos de RESEARCH.md §Pattern 1 y §Pattern 4.

---

## Shared Patterns

### cn() para clases condicionales
**Source:** `src/lib/utils.ts` líneas 1-6
**Apply to:** Todos los componentes del wizard
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
Import en cada componente: `import { cn } from '@/lib/utils'`

### Tokens de color Tailwind (nunca hex directo)
**Source:** `src/components/dashboard/OCTable.tsx` + `src/components/dashboard/StatCard.tsx`
**Apply to:** Todos los componentes del wizard
```typescript
// Bordes de card: border border-acento
// Fondo de sección: bg-fondo
// Texto primario: text-texto
// Titulares/labels: text-titulares
// Color principal (naranja): text-principal
// Hover: hover:bg-acento/30
// Fila activa/hover: hover:bg-acento/20
```

### Touch targets para botones de ícono
**Source:** `src/components/dashboard/OCTable.tsx` líneas 144-166
**Apply to:** ProductosTable (Trash2), OtrosGastosSection (Trash2 + Plus), DocumentSlots (Upload)
```typescript
className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-texto hover:text-principal hover:bg-acento/30 transition-colors duration-150"
```

### Input text controlado
**Source:** `src/components/dashboard/FilterBar.tsx` líneas 13-14
**Apply to:** Step1Form, Step2Form, ProductosTable, GastosCard, OtrosGastosSection
```typescript
const inputClass =
  'w-full sm:w-56 px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto placeholder:text-texto/50 focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150'
```
En los formularios del wizard usar la variante `w-full` (sin `sm:w-56`).

### Select controlado
**Source:** `src/components/dashboard/FilterBar.tsx` líneas 15-17
**Apply to:** Step1Form (campo estado, país, divisa), OtrosGastosSection (select divisa ARS/USD)
```typescript
const selectClass =
  'w-full sm:w-48 px-4 py-2 rounded-lg border border-acento bg-white text-base text-texto focus:outline-none focus:ring-2 focus:ring-principal/30 focus:border-principal transition-colors duration-150 cursor-pointer'
```

### 'use client' obligatorio
**Source:** `src/components/dashboard/OCTable.tsx` línea 1, `src/components/layout/Sidebar.tsx` línea 1
**Apply to:** WizardPage, Step1Form, Step2Form, ProductosTable, GastosCard, OtrosGastosSection, ValueCards, DocumentSlots
```typescript
'use client'
```
Todos los componentes del wizard usan `useState` — todos requieren `'use client'`.

### Alias de paths (@/)
**Source:** `src/components/dashboard/OCTable.tsx` líneas 5-6
**Apply to:** Todos los archivos nuevos
```typescript
import { cn } from '@/lib/utils'
import type { OC, EstadoOC } from '@/lib/mock-ocs'
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/wizard-calculations.ts` | utility | transform | No hay ningún archivo de cálculos financieros en el proyecto. Es el primer uso de decimal.js. Usar patrones de RESEARCH.md §Pattern 1 y §Pattern 4. |

---

## Metadata

**Analog search scope:** `src/components/`, `src/app/`, `src/lib/`
**Files scanned:** 11 archivos leídos completamente
**Pattern extraction date:** 2026-05-27
