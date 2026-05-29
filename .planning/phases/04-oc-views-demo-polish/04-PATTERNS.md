# Phase 4: OC Views & Demo Polish - Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 18 (nuevos/modificados)
**Analogs found:** 18 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/mock-ocs.ts` | model/data | transform | mismo archivo (extensión) | exact |
| `src/components/ui/EstadoBadge.tsx` | component | request-response | `src/components/dashboard/OCTable.tsx` (getBadgeClasses) | exact |
| `src/components/oc-detail/OCDetailHeader.tsx` | component | request-response | `src/components/dashboard/StatCard.tsx` | role-match |
| `src/components/oc-detail/OCDetailSkeleton.tsx` | component | request-response | `src/components/dashboard/OCTable.tsx` (SkeletonCells) | exact |
| `src/components/wizard/GastosCard.tsx` | component | CRUD | mismo archivo (modificación) | exact |
| `src/components/wizard/OtrosGastosSection.tsx` | component | CRUD | mismo archivo (modificación) | exact |
| `src/components/wizard/DocumentSlots.tsx` | component | file-I/O | mismo archivo (modificación) | exact |
| `src/components/dashboard/EmptyState.tsx` | component | request-response | mismo archivo (modificación) | exact |
| `src/app/(importador)/importador/oc/[id]/page.tsx` | route/page | request-response | `src/app/(importador)/importador/oc/nueva/page.tsx` | exact |
| `src/app/(importador)/importador/oc/[id]/not-found.tsx` | route/page | request-response | `src/components/dashboard/EmptyState.tsx` | role-match |
| `src/app/(importador)/importador/oc/[id]/loading.tsx` | route/page | request-response | `OCTable.tsx` SkeletonCells | role-match |
| `src/app/(importador)/importador/oc/[id]/editar/page.tsx` | route/page | request-response | `src/app/(importador)/importador/oc/nueva/page.tsx` | exact |
| `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` | component | request-response | `src/components/wizard/Step1Form.tsx` (useEffect + sessionStorage) | exact |
| `src/app/(proveedor)/proveedor/oc/[id]/page.tsx` | route/page | request-response | `src/app/(importador)/importador/oc/[id]/page.tsx` | exact |
| `src/app/(proveedor)/proveedor/oc/[id]/not-found.tsx` | route/page | request-response | importador not-found.tsx | exact |
| `src/app/(proveedor)/proveedor/oc/[id]/editar/page.tsx` | route/page | request-response | importador editar/page.tsx | exact |
| `src/app/(proveedor)/proveedor/oc/[id]/editar/EditWizardLoader.tsx` | component | request-response | importador EditWizardLoader.tsx | exact |
| `src/app/(despachante)/despachante/oc/[id]/page.tsx` | route/page | request-response | importador page.tsx | exact |
| `src/app/(despachante)/despachante/oc/[id]/not-found.tsx` | route/page | request-response | importador not-found.tsx | exact |
| `src/app/(despachante)/despachante/oc/[id]/editar/page.tsx` | route/page | request-response | importador editar/page.tsx | exact |
| `src/app/(despachante)/despachante/oc/[id]/editar/EditWizardLoader.tsx` | component | request-response | importador EditWizardLoader.tsx | exact |

---

## Pattern Assignments

### `src/lib/mock-ocs.ts` (model, transform)

**Analog:** mismo archivo — extensión con `OCDetalle` + `MOCK_OCS_DETALLE`

**Interface actual** (líneas 1-19):
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

**Patrón a agregar — interface OCDetalle** (agregar después de `OC`):
```typescript
import type {
  ProductRow,
  GastosDespacho,
  GastosDespachante,
  GastosAdicionales,
  Impuestos,
  OtroGastoRow,
} from './wizard-types'

export interface OCDetalle extends OC {
  referenciaOC: string
  emailsProveedor: string[]
  emailsDespachante: string[]
  despacho: string
  paisOrigen: string
  fechaOC: string          // DD/MM/AAAA
  llegadaEstimada: string  // DD/MM/AAAA
  tipoCambio: string       // e.g. "1200"
  divisa: 'ARS/USD' | 'ARS/EUR'
  notas: string
  productos: ProductRow[]
  gastosDespacho: GastosDespacho
  gastosDespachante: GastosDespachante
  gastosAdicionales: GastosAdicionales
  impuestos: Impuestos
  otrosGastos: OtroGastoRow[]
  documentos: {
    facturaProveedor: string | null
    facturaDespachante: string | null
    conocimientoEmbarque: string | null
    certificadoOrigen: string | null
    otro: string | null
  }
}
```

**Datos ricos requeridos:** OC-003 (id='3') y OC-004 (id='4') deben tener `tipoCambio: "1200"`, productos con valores USD realistas, gastos ARS típicos de importación argentina. Las demás OCs usan arrays vacíos en `productos`/`otrosGastos` y ceros en los campos de gastos/impuestos.

---

### `src/components/ui/EstadoBadge.tsx` (component, request-response)

**Analog:** `src/components/dashboard/OCTable.tsx` — extraer `getBadgeClasses()` + `ESTADO_LABELS`

**Patrón extraído** (líneas 19-39 de OCTable.tsx):
```typescript
// getBadgeClasses construye clases desde un base común
function getBadgeClasses(estado: EstadoOC): string {
  const base = 'text-sm px-2 py-0.5 rounded-full'
  const map: Record<EstadoOC, string> = {
    borrador:    `${base} bg-fondo text-titulares border border-acento font-light`,
    en_proceso:  `${base} bg-acento/50 text-titulares font-light`,
    en_transito: `${base} bg-acento text-titulares font-normal`,
    en_aduana:   `${base} bg-principal/20 text-titulares font-normal`,
    entregada:   `${base} bg-principal/10 text-principal font-normal`,
    cancelada:   `${base} bg-texto/10 text-texto font-light line-through`,
  }
  return map[estado]
}

const ESTADO_LABELS: Record<EstadoOC, string> = {
  borrador:    'Borrador',
  en_proceso:  'En proceso',
  en_transito: 'En tránsito',
  en_aduana:   'En aduana',
  entregada:   'Entregada',
  cancelada:   'Cancelada',
}
```

**Nuevo componente — Server Component sin 'use client':**
```typescript
import type { EstadoOC } from '@/lib/mock-ocs'

// ... BADGE_MAP y ESTADO_LABELS (extraídos verbatim de OCTable.tsx) ...

export function EstadoBadge({ estado }: { estado: EstadoOC }) {
  return <span className={BADGE_MAP[estado]}>{ESTADO_LABELS[estado]}</span>
}
```

---

### `src/components/oc-detail/OCDetailHeader.tsx` (component, request-response)

**Analog:** `src/components/dashboard/OCTable.tsx` (acciones) + `src/components/dashboard/EmptyState.tsx` (estructura)

**Patrón de botones de acción** (líneas 144-168 de OCTable.tsx):
```typescript
// Link con min-h-[44px] min-w-[44px] para touch targets
<Link
  href={pencilHref(oc)}
  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-texto hover:text-principal hover:bg-acento/30 transition-colors duration-150"
  aria-label="Editar OC"
>
  <Pencil size={18} />
</Link>
{rol === 'importador' && (
  <button
    onClick={() => setDeleteTarget(oc)}
    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-150"
    aria-label="Eliminar OC"
  >
    <Trash2 size={18} />
  </button>
)}
```

**Breadcrumb pattern (Claude's Discretion):** texto simple con `/` separador — sin librería externa.

**Nota de arquitectura:** El botón Eliminar interactúa con `DeleteModal` (Client Component). OCDetailHeader debe dividirse en:
- `OCDetailHeader.tsx` — Server Component (breadcrumb + título + EstadoBadge + Link Editar)
- `OCDetailActions.tsx` — Client Component (`'use client'`) con estado para DeleteModal, idéntico al patrón de `OCTable.tsx` líneas 89 y 175-181

**DeleteModal wiring** (líneas 89, 175-181 de OCTable.tsx):
```typescript
const [deleteTarget, setDeleteTarget] = useState<OC | null>(null)
// ...
<DeleteModal
  open={deleteTarget !== null}
  ocNumero={deleteTarget?.numeroOC ?? ''}
  proveedor={deleteTarget?.proveedor ?? ''}
  onConfirm={() => setDeleteTarget(null)}
  onCancel={() => setDeleteTarget(null)}
/>
```

---

### `src/components/oc-detail/OCDetailSkeleton.tsx` (component, request-response)

**Analog:** `src/components/dashboard/OCTable.tsx` — `SkeletonCells` + `animate-pulse bg-acento/30`

**Patrón de skeleton** (líneas 67-86 de OCTable.tsx):
```typescript
// Barras con animate-pulse bg-acento/30, alturas plausibles
<td className="px-4 py-3"><div className="h-4 w-16 rounded bg-acento/30" /></td>
<td className="px-4 py-3"><div className="h-5 w-20 rounded-full bg-acento/40" /></td>
// Fila completa con animate-pulse en el <tr>:
<tr key={i} className="border-b border-acento/50 animate-pulse">
```

**Aplicar en `loading.tsx`:** replicar la estructura real de cada sección (header, ResumenStep1, GastosCards, ValueCards) con barras de altura que imiten el contenido real. Ejemplo de bloque de card:
```typescript
// Skeleton de una card de gastos (≈ h-48)
<div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-4 animate-pulse">
  <div className="h-5 w-32 rounded bg-acento/30" />  {/* título */}
  <div className="grid grid-cols-2 gap-4">
    <div className="h-10 rounded-lg bg-acento/30" />
    <div className="h-10 rounded-lg bg-acento/30" />
    <div className="h-10 rounded-lg bg-acento/30" />
    <div className="h-10 rounded-lg bg-acento/30" />
  </div>
</div>
```

---

### `src/components/wizard/GastosCard.tsx` (component, CRUD — MODIFICAR)

**Analog:** mismo archivo

**Interface actual** (líneas 11-18):
```typescript
interface GastosCardProps {
  titulo: string
  campos: GastoField[]
  values: Record<string, string>
  subtotalUSD: Decimal
  tipoCambio: string
  onChange: (key: string, value: string) => void  // actualmente requerido
}
```

**Modificación requerida — agregar `readOnly` y hacer `onChange` opcional:**
```typescript
interface GastosCardProps {
  titulo: string
  campos: GastoField[]
  values: Record<string, string>
  subtotalUSD: Decimal
  tipoCambio: string
  onChange?: (key: string, value: string) => void  // opcional cuando readOnly
  readOnly?: boolean
}
```

**Patrón read-only** (extraído de `ResumenStep1.tsx` línea 19):
```typescript
// readOnlyClass ya establecido en ResumenStep1.tsx:
const readOnlyClass =
  'text-base font-normal text-texto bg-fondo px-3 py-2 rounded-lg border border-acento/50'

// Reemplazar <input> con <p> cuando readOnly:
{readOnly ? (
  <p className={readOnlyClass}>{values[campo.key] || '—'}</p>
) : (
  <input
    type="number"
    min="0"
    step="0.01"
    placeholder="0.00"
    value={values[campo.key] ?? ''}
    onChange={(e) => onChange?.(campo.key, e.target.value)}
    className={inputClass}
  />
)}
```

---

### `src/components/wizard/OtrosGastosSection.tsx` (component, CRUD — MODIFICAR)

**Analog:** mismo archivo

**Interface actual** (líneas 7-14):
```typescript
interface OtrosGastosSectionProps {
  rows: OtroGastoRow[]
  subtotalUSD: Decimal
  tipoCambio: string
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, field: keyof Omit<OtroGastoRow, 'id'>, value: string) => void
}
```

**Modificación requerida — todos los callbacks opcionales + `readOnly`:**
```typescript
interface OtrosGastosSectionProps {
  rows: OtroGastoRow[]
  subtotalUSD: Decimal
  tipoCambio: string
  onAdd?: () => void
  onRemove?: (id: string) => void
  onChange?: (id: string, field: keyof Omit<OtroGastoRow, 'id'>, value: string) => void
  readOnly?: boolean
}
```

**Cuando `readOnly={true}`:** ocultar botón "Agregar gasto" (línea 69-76) y botón Trash2 por fila (líneas 57-64), reemplazar inputs con `<p>` usando `readOnlyClass`.

---

### `src/components/wizard/DocumentSlots.tsx` (component, file-I/O — MODIFICAR)

**Analog:** mismo archivo

**Interface actual** (línea 85): `export function DocumentSlots()` — sin props.

**Modificación requerida:**
```typescript
interface DocumentSlotsProps {
  readOnly?: boolean
  documentos?: {
    facturaProveedor: string | null
    facturaDespachante: string | null
    conocimientoEmbarque: string | null
    certificadoOrigen: string | null
    otro: string | null
  }
}

export function DocumentSlots({ readOnly, documentos }: DocumentSlotsProps = {}) {
```

**Cuando `readOnly={true}`:** ocultar botón "Adjuntar/Cambiar" (líneas 63-70) y botón X (líneas 71-80). Mostrar `documentos?.facturaProveedor ?? 'Sin archivo adjunto'` en vez de estado local. Ocultar botón "Agregar otro documento" (líneas 121-128).

**Patrón de nombre de archivo** (línea 50-52 — ya existe):
```typescript
<span className="text-sm font-normal text-texto/50 hidden sm:block shrink-0 max-w-[180px] truncate">
  {fileName ?? 'Sin archivo adjunto'}
</span>
```

---

### `src/components/dashboard/EmptyState.tsx` (component, request-response — MODIFICAR)

**Analog:** mismo archivo

**Copy actual** (líneas 13-19):
```typescript
<p className="text-xl font-bold text-titulares">
  {hasFilters ? 'No hay resultados para tu búsqueda' : 'No hay órdenes de compra'}
</p>
<p className="text-base font-normal text-texto/70 max-w-sm">
  {hasFilters
    ? 'Probá cambiando el filtro de estado o el nombre del proveedor.'
    : 'Todavía no creaste ninguna OC. Comenzá creando tu primera orden de compra.'}
</p>
```

**Copy correcto según UI-SPEC:**
- Sin filtros: `"Todavía no hay OCs"` / `"¡Creá tu primera orden de compra!"`
- Con filtros: `"Sin resultados"` / `"Probá cambiando el filtro de estado o el nombre del proveedor."`

**Patrón de botón CTA** (líneas 21-29 — mantener estructura, solo actualizar copy):
```typescript
{!hasFilters && rol === 'importador' && (
  <Link
    href="/importador/oc/nueva"
    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-principal text-white font-medium hover:bg-titulares transition-colors duration-150 min-h-[44px]"
  >
    <PlusCircle size={18} />
    Crear OC
  </Link>
)}
```

---

### `src/app/(importador)/importador/oc/[id]/page.tsx` (route, request-response — NUEVO)

**Analog:** `src/app/(importador)/importador/oc/nueva/page.tsx`

**Patrón de page.tsx con params** (analog completo, líneas 1-10):
```typescript
import { WizardPage } from '@/components/wizard/WizardPage'

interface PageProps {
  searchParams: Promise<{ step?: string }>
}

export default async function NuevaOCPage({ searchParams }: PageProps) {
  const { step } = await searchParams
  return <WizardPage initialStep={step ?? '1'} />
}
```

**Adaptar para detalle con `params` + `notFound()`:**
```typescript
import { notFound } from 'next/navigation'
import { MOCK_OCS_DETALLE } from '@/lib/mock-ocs'
import {
  calcFOBTotal,
  calcTotalGastos,
  calcSubtotalImpuestos,
} from '@/lib/wizard-calculations'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OCDetailPage({ params }: PageProps) {
  const { id } = await params
  const oc = MOCK_OCS_DETALLE.find((o) => o.id === id)
  if (!oc) notFound()

  const fobUSD = calcFOBTotal(oc.productos)
  const totalGastosUSD = calcTotalGastos(
    oc.gastosDespacho,
    oc.gastosDespachante,
    oc.gastosAdicionales,
    oc.otrosGastos,
    oc.tipoCambio
  )
  const totalImpuestosUSD = calcSubtotalImpuestos(oc.impuestos, oc.tipoCambio)

  const step1Data = { info: { ...oc }, productos: oc.productos }
  // render componentes reutilizables...
}
```

**Nota crítica:** `params` es `Promise` en Next.js 16 — siempre `await params` antes de acceder a `id`. Validado contra `nueva/page.tsx` que usa `await searchParams`.

**Layout heredado:** `src/app/(importador)/layout.tsx` provee Sidebar automáticamente — no re-implementar.

---

### `src/app/(importador)/importador/oc/[id]/not-found.tsx` (route, request-response — NUEVO)

**Analog:** `src/components/dashboard/EmptyState.tsx` — misma estructura de centrado vertical

**Patrón de link de regreso** (líneas 21-29 de EmptyState.tsx):
```typescript
<Link
  href="/importador/dashboard"
  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-principal text-white font-medium hover:bg-titulares transition-colors duration-150 min-h-[44px]"
>
  <ArrowLeft size={18} />
  Volver al dashboard
</Link>
```

**Íconos:** `FileSearch` de `lucide-react` (disponible en el proyecto).

**Posicionamiento:** `flex flex-col items-center justify-center py-32 gap-6 text-center px-4` — consistente con EmptyState que usa `py-16`.

**Tipografía:** `text-lg font-bold text-titulares` para el título. Fira Sans heredado del layout.

---

### `src/app/(importador)/importador/oc/[id]/loading.tsx` (route, request-response — NUEVO)

**Analog:** `OCTable.tsx` SkeletonCells (líneas 67-86)

**Patrón:** Server Component sin imports de React. Estructura de bloques `animate-pulse bg-acento/30` replicando secciones reales:
- Header skeleton: h-8 para número OC, h-6 para badge, h-10 para botones
- ResumenStep1 skeleton: card con grid 2 cols, filas h-10
- GastosCard × 3: card con grid, filas h-10
- ValueCards: grid 4 cols, cards h-20
- DocumentSlots: lista de filas h-12

---

### `src/app/(importador)/importador/oc/[id]/editar/page.tsx` (route, request-response — NUEVO)

**Analog:** `src/app/(importador)/importador/oc/nueva/page.tsx` (líneas 1-10)

**Patrón — Server Component que delega a Client:**
```typescript
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarOCPage({ params }: PageProps) {
  const { id } = await params
  return <EditWizardLoader ocId={id} rol="importador" />
}
```

---

### `src/app/(importador)/importador/oc/[id]/editar/EditWizardLoader.tsx` (component, request-response — NUEVO)

**Analog:** `src/components/wizard/Step1Form.tsx` — patrón `useEffect` + `sessionStorage`

**Patrón de sessionStorage en Step1Form** (líneas 1-10, patrón useEffect):
```typescript
'use client'
import { useState, useEffect } from 'react'
// ...
useEffect(() => {
  const raw = sessionStorage.getItem('oc-step1-draft')
  if (raw) {
    const saved: Step1Data = JSON.parse(raw)
    // ... setInfo(saved.info); setProductos(saved.productos)
  }
}, [])
```

**EditWizardLoader — inverso: escribe sessionStorage antes de montar WizardPage:**
```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WizardPage } from '@/components/wizard/WizardPage'
import { MOCK_OCS_DETALLE } from '@/lib/mock-ocs'
import type { Step1Data } from '@/lib/wizard-types'

export function EditWizardLoader({ ocId, rol }: { ocId: string; rol: string }) {
  const router = useRouter()

  useEffect(() => {
    const oc = MOCK_OCS_DETALLE.find((o) => o.id === ocId)
    if (!oc) {
      router.replace(`/${rol}/dashboard`)
      return
    }
    const step1Data: Step1Data = {
      info: {
        referenciaOC: oc.referenciaOC,
        estado: oc.estado,
        proveedor: oc.proveedor,
        emailsProveedor: oc.emailsProveedor,
        despacho: oc.despacho,
        emailsDespachante: oc.emailsDespachante,
        paisOrigen: oc.paisOrigen,
        fechaOC: oc.fechaOC,       // ya en DD/MM/AAAA
        llegadaEstimada: oc.llegadaEstimada,
        fechaPago: '',
        tipoCambio: oc.tipoCambio,
        divisa: oc.divisa,
        notas: oc.notas,
      },
      productos: oc.productos,
    }
    sessionStorage.setItem('oc-step1-draft', JSON.stringify(step1Data))
  }, [ocId, rol, router])

  return <WizardPage initialStep="1" />
}
```

**Mapeo OCDetalle → Step1Data:** tabla completa en RESEARCH.md sección "Mapping: OCDetalle → Step1Data".

---

### Páginas de proveedor y despachante

**Analog:** todas las páginas del importador — misma estructura, diferentes rutas y `rol`.

**Diferencias clave:**
- `not-found.tsx`: `href="/proveedor/dashboard"` o `href="/despachante/dashboard"`
- `editar/EditWizardLoader.tsx`: `rol="proveedor"` / `rol="despachante"`
- `page.tsx` detalle: sin botón Eliminar — no renderizar `OCDetailActions` o pasar `rol` al header
- Layout heredado: `(proveedor)/layout.tsx` y `(despachante)/layout.tsx` usan `Navbar` (no Sidebar)

**Layout Navbar** (líneas 1-19 de `src/app/(proveedor)/layout.tsx`):
```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function ProveedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar rol="proveedor" />
      <main className="flex-1 bg-fondo">{children}</main>
      <Footer />
    </div>
  )
}
```

---

## Shared Patterns

### Tokens de color Tailwind
**Source:** `src/components/wizard/ResumenStep1.tsx`, `src/components/dashboard/OCTable.tsx`
**Apply to:** todos los archivos nuevos
```
bg-fondo, bg-white, bg-principal, bg-acento, bg-acento/30
text-texto, text-titulares, text-principal, text-texto/70, text-titulares/60
border-acento, border-acento/50, rounded-xl, rounded-lg
```

### Read-only field display
**Source:** `src/components/wizard/ResumenStep1.tsx` (línea 19)
**Apply to:** `GastosCard.tsx`, `OtrosGastosSection.tsx`, `DocumentSlots.tsx`
```typescript
const readOnlyClass =
  'text-base font-normal text-texto bg-fondo px-3 py-2 rounded-lg border border-acento/50'
```

### Skeleton bars
**Source:** `src/components/dashboard/OCTable.tsx` (líneas 67-86)
**Apply to:** `OCDetailSkeleton.tsx`, todos los `loading.tsx`
```typescript
// Barra genérica:
<div className="h-4 w-32 rounded bg-acento/30" />
// Badge pill:
<div className="h-5 w-20 rounded-full bg-acento/40" />
// Input-height block:
<div className="h-10 rounded-lg bg-acento/30" />
// Fila de tabla:
<tr className="border-b border-acento/50 animate-pulse">
```

### Touch target mínimo
**Source:** `src/components/dashboard/OCTable.tsx` (líneas 144-168), `src/components/dashboard/EmptyState.tsx` (línea 23)
**Apply to:** todos los botones y links nuevos
```typescript
className="min-h-[44px] min-w-[44px] flex items-center justify-center ..."
// o para links full-width:
className="inline-flex items-center gap-2 px-6 py-3 ... min-h-[44px]"
```

### Transiciones de color
**Source:** `src/components/dashboard/OCTable.tsx` (líneas 124, 147, 154)
**Apply to:** todos los botones interactivos
```typescript
className="... hover:bg-acento/30 transition-colors duration-150"
```

### params como Promise (Next.js 16)
**Source:** `src/app/(importador)/importador/oc/nueva/page.tsx` (patrón `await searchParams`)
**Apply to:** todos los `page.tsx` con `[id]` dinámico
```typescript
interface PageProps {
  params: Promise<{ id: string }>
}
export default async function Page({ params }: PageProps) {
  const { id } = await params
  // ...
}
```

### Server Component sin 'use client'
**Apply to:** `EstadoBadge.tsx`, `OCDetailHeader.tsx`, `OCDetailSkeleton.tsx`, todos los `page.tsx`, todos los `not-found.tsx`, todos los `loading.tsx`
— No agregar `'use client'` en ninguno de estos. Solo `EditWizardLoader.tsx` requiere `'use client'` (usa `useEffect` + `useRouter`).

---

## No Analog Found

Todos los archivos tienen analog directo en el codebase.

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/lib/`
**Files scanned:** 16 archivos leídos + estructura de directorios
**Pattern extraction date:** 2026-05-28
