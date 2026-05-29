# Phase 4: OC Views & Demo Polish - Research

**Researched:** 2026-05-28
**Domain:** Next.js App Router routes dinámicas, componentes reutilizables en modo read-only, sessionStorage pre-load, estados edge-case UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** La vista detalle replica las mismas secciones del wizard: Datos OC → Productos → Gastos de importación → Impuestos → Documentos → Valores. Reusar `ResumenStep1`, `GastosCard`, `ValueCards`, `DocumentSlots` en modo read-only. Consistencia visual total con el wizard.
- **D-02:** Header de la página: número OC + badge de estado + breadcrumb "Dashboard > OC-XXX" + botones Editar y Eliminar (importador) o solo Editar (proveedor/despachante).
- **D-03:** Proveedor y despachante ven la misma estructura completa que el importador. La única diferencia: no tienen botón Eliminar. Sí tienen botón Editar que abre el wizard pre-poblado.
- **D-04:** Expandir `mock-ocs.ts` con una interface `OCDetalle` que incluye: productos (con cantidad, valorUSD), gastos de despacho/despachante/adicionales, impuestos, tipoCambio, documentos slots. Al menos 2-3 OCs tendrán datos ricos con números realistas para que ValueCards muestre valores calculados con decimal.js. Las demás muestran estado vacío en sus secciones financieras.
- **D-05:** Los datos mock deben ser realistas: tipo de cambio ~1200 ARS/USD, productos con cantidad y valor coherentes, gastos ARS con valores típicos de importación.
- **D-06:** Editar una OC abre `/importador/oc/[id]/editar` (o análogos) que monta el mismo wizard de 2 pasos con los datos pre-cargados en sessionStorage como `oc-step1-draft`.
- **D-07:** Al "Guardar OC" en modo edición, en Phase 4 se simula (toast + redirect al dashboard).
- **D-08:** Proveedor y despachante pueden editar todo el contenido de la OC. No pueden eliminarla.
- **D-09:** Loading: skeleton bars con `animate-pulse bg-acento/30`. No usar spinner.
- **D-10:** Estado vacío del dashboard: ícono + mensaje + botón principal bg-principal que navega a `/importador/oc/nueva`.
- **D-11:** ID inexistente: página 404 custom "OC no encontrada" + botón "Volver al dashboard". Mismos estilos del proyecto.

### Claude's Discretion

- Breadcrumb: componente simple de texto con `/` como separador. No usar librería externa.
- Skeletons: el planner decide cuántos bloques y alturas según las secciones reales de cada página.
- Cuántas OCs mock tendrán datos ricos vs. vacíos: mínimo OC-003 y OC-004 con datos completos.

### Deferred Ideas (OUT OF SCOPE)

- Cambio de estado de OC desde la vista detalle → Phase 5
- Eliminación real de OC → Phase 5
- Permisos granulares por rol (qué campos puede editar cada rol) → Phase 5 o posterior
- Notificaciones push cuando cambia el estado → fuera de scope v1
</user_constraints>

---

## Summary

Phase 4 construye las páginas que cierran el loop de demo: detail view de OC (read-only) y modo edición (wizard pre-poblado), para los 3 roles. La base técnica está completamente presente: todos los componentes reutilizables existen, los tipos están definidos, las rutas de grupo están configuradas. La fase es principalmente de composición y extensión — no requiere nuevas librerías.

Los tres ejes de trabajo son: (1) crear páginas de detalle/edición como rutas dinámicas `[id]` bajo cada route group, (2) extender `mock-ocs.ts` con la interface `OCDetalle` compatible con los tipos del wizard, y (3) pulir estados edge-case actualizando `EmptyState`, creando `EstadoBadge` extraído de `OCTable`, y agregando `not-found.tsx` por route group.

El único patrón técnico no trivial es el `EditWizardLoader`: un Client Component que lee `OCDetalle` desde el mock, mapea sus datos al shape de `Step1Data` y escribe `sessionStorage['oc-step1-draft']` antes de montar `WizardPage`. `Step1Form` ya lee ese key en `useEffect` al montar — el mecanismo está validado y funcionando en el wizard de creación.

**Primary recommendation:** Organizar la ejecución en 3 planes: (1) datos mock + páginas de detalle importador + EstadoBadge + OCDetailHeader, (2) páginas de detalle proveedor/despachante + not-found pages, (3) EmptyState update + EditWizardLoader + skeletons. Todo es paralelizable entre roles una vez que los componentes compartidos estén listos.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OC detail view (datos, gastos, valores) | Frontend Server (SSR page.tsx) | — | Datos mock síncronos; Server Component es suficiente |
| EstadoBadge | Frontend Server (Server Component) | — | Sin estado cliente; solo props → clases CSS |
| OCDetailHeader (breadcrumb + botones) | Frontend Server (Server Component) | — | Links son estáticos; DeleteModal se maneja en Client separado |
| Edit mode pre-load | Browser / Client | — | sessionStorage es browser-only; requiere `'use client'` + `useEffect` |
| WizardPage (modo edición) | Browser / Client | — | Estado del wizard ya es Client Component |
| Loading skeletons | Frontend Server (Server Component) | — | `loading.tsx` en Next.js App Router es Server Component |
| not-found pages | Frontend Server (Server Component) | — | `notFound()` + `not-found.tsx` son Server Components |
| EmptyState (update copy) | Frontend Server (Server Component) | — | Componente sin estado; solo display |
| Mock data expansion (OCDetalle) | Shared (lib) | — | Datos puros TypeScript accesibles desde Server y Client |

---

## Standard Stack

### Core (ya instalado — sin nuevas dependencias)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.6 | App Router, rutas dinámicas, not-found, loading | Framework base del proyecto |
| react | 19.2.4 | Client Components (EditWizardLoader) | Base React |
| decimal.js | ^10.6.0 | Cálculos financieros en ValueCards del detalle | Ya usado en wizard; patrón establecido |
| lucide-react | ^1.16.0 | Iconos (Pencil, Trash2, FileSearch, ArrowLeft, FileText, PlusCircle) | Ya instalado; todos los íconos requeridos disponibles |
| tailwindcss | ^4 | Estilos; tokens `principal`, `titulares`, `acento`, `fondo`, `texto` | Sistema de tokens definido en globals.css |

[VERIFIED: package.json del proyecto]

### No nuevas dependencias requeridas

La UI-SPEC confirma: no shadcn, no nuevas librerías de iconos, no librerías de breadcrumb. Todo custom Tailwind.

[VERIFIED: 04-UI-SPEC.md — Registry Safety section]

---

## Architecture Patterns

### Diagrama de flujo de datos — Phase 4

```
MOCK_OCS_DETALLE (mock-ocs.ts)
  │
  ├─► [id]/page.tsx (Server Component)
  │     │  Lee OCDetalle por params.id
  │     │  Si no encontrado → notFound()
  │     ├─► OCDetailHeader (Server Component)
  │     │     ├─► EstadoBadge (Server Component)
  │     │     └─► Botones: Link "Editar" + Button "Eliminar" (importador only)
  │     ├─► ResumenStep1 (Client Component — read-only props)
  │     ├─► GastosCard × 3 (Client Component — readOnly={true})
  │     ├─► OtrosGastosSection (Client Component — read-only)
  │     ├─► ValueCards (Client Component — Decimal props calculados en page.tsx)
  │     └─► DocumentSlots (Client Component — readOnly={true})
  │
  └─► [id]/editar/page.tsx (Server Component)
        └─► EditWizardLoader (Client Component 'use client')
              │  useEffect: lee OCDetalle → mapea a Step1Data → sessionStorage['oc-step1-draft']
              └─► WizardPage (initialStep='1') — reutilizado sin cambios
```

### Estructura de archivos nuevos

```
src/
├── lib/
│   └── mock-ocs.ts                        # MODIFICAR: agregar OCDetalle + MOCK_OCS_DETALLE
├── components/
│   ├── ui/
│   │   └── EstadoBadge.tsx               # NUEVO: Server Component
│   ├── oc-detail/
│   │   ├── OCDetailHeader.tsx            # NUEVO: Server Component
│   │   └── OCDetailSkeleton.tsx          # NUEVO: Server Component (opcional para loading.tsx)
│   ├── wizard/
│   │   └── GastosCard.tsx                # MODIFICAR: agregar prop readOnly?: boolean
│   └── dashboard/
│       └── EmptyState.tsx                # MODIFICAR: actualizar copy según UI-SPEC
└── app/
    ├── (importador)/importador/oc/[id]/
    │   ├── page.tsx                       # NUEVO: Server Component
    │   ├── not-found.tsx                  # NUEVO: Server Component
    │   └── editar/
    │       ├── page.tsx                   # NUEVO: Server Component (pasa a EditWizardLoader)
    │       └── EditWizardLoader.tsx       # NUEVO: Client Component
    ├── (proveedor)/proveedor/oc/[id]/
    │   ├── page.tsx                       # NUEVO
    │   ├── not-found.tsx                  # NUEVO
    │   └── editar/
    │       ├── page.tsx                   # NUEVO
    │       └── EditWizardLoader.tsx       # NUEVO
    └── (despachante)/despachante/oc/[id]/
        ├── page.tsx                       # NUEVO
        ├── not-found.tsx                  # NUEVO
        └── editar/
            ├── page.tsx                   # NUEVO
            └── EditWizardLoader.tsx       # NUEVO
```

### Pattern 1: Ruta dinámica con notFound()

**What:** Server Component page.tsx que busca OC en mock, llama `notFound()` si no existe.

**When to use:** Toda página de detalle y edición.

```typescript
// Source: src/app/(importador)/importador/oc/nueva/page.tsx (patrón de page.tsx existente)
// + Next.js App Router docs — notFound() pattern
import { notFound } from 'next/navigation'
import { MOCK_OCS_DETALLE } from '@/lib/mock-ocs'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OCDetailPage({ params }: PageProps) {
  const { id } = await params
  const oc = MOCK_OCS_DETALLE.find((o) => o.id === id)
  if (!oc) notFound()
  // render...
}
```

[VERIFIED: Next.js 16 — `params` es Promise en App Router; patrón validado contra `searchParams` en nueva/page.tsx]

### Pattern 2: GastosCard en modo read-only

**What:** Agregar prop `readOnly?: boolean` a GastosCard. Cuando `true`, reemplaza `<input>` con `<p>` usando `readOnlyClass`.

**When to use:** Toda instancia de GastosCard en vistas de detalle.

```typescript
// Source: GastosCard.tsx existente + UI-SPEC Read-Only Mode section
const readOnlyClass =
  'text-base font-normal text-texto bg-fondo px-3 py-2 rounded-lg border border-acento/50'

// En el render de cada campo:
{readOnly ? (
  <p className={readOnlyClass}>{values[campo.key] || '—'}</p>
) : (
  <input ... onChange={(e) => onChange(campo.key, e.target.value)} />
)}
```

[VERIFIED: ResumenStep1.tsx ya define `readOnlyClass` con ese string exacto; GastosCard.tsx analizado]

### Pattern 3: EditWizardLoader — sessionStorage pre-load

**What:** Client Component que mapea OCDetalle → Step1Data y escribe sessionStorage antes de montar WizardPage.

**When to use:** Páginas `/[id]/editar` de los 3 roles.

```typescript
// Source: Step1Form.tsx useEffect pattern (lee sessionStorage en mount)
// + CONTEXT.md D-06
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
        fechaOC: oc.fechaOC,
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

[VERIFIED: Step1Form.tsx analizado — lee `oc-step1-draft` en useEffect con JSON.parse; mapeo de campos confirmado contra wizard-types.ts]

### Pattern 4: EstadoBadge — Server Component extraído

**What:** Componente Server que recibe `estado: EstadoOC` y retorna el pill con clases extraídas de `getBadgeClasses()` en OCTable.tsx.

```typescript
// Source: OCTable.tsx getBadgeClasses() — extraído verbatim
import type { EstadoOC } from '@/lib/mock-ocs'

const BADGE_MAP: Record<EstadoOC, string> = {
  borrador:    'text-sm px-2 py-0.5 rounded-full bg-fondo text-titulares border border-acento font-light',
  en_proceso:  'text-sm px-2 py-0.5 rounded-full bg-acento/50 text-titulares font-light',
  en_transito: 'text-sm px-2 py-0.5 rounded-full bg-acento text-titulares font-normal',
  en_aduana:   'text-sm px-2 py-0.5 rounded-full bg-principal/20 text-titulares font-normal',
  entregada:   'text-sm px-2 py-0.5 rounded-full bg-principal/10 text-principal font-normal',
  cancelada:   'text-sm px-2 py-0.5 rounded-full bg-texto/10 text-texto font-light line-through',
}

const ESTADO_LABELS: Record<EstadoOC, string> = {
  borrador: 'Borrador', en_proceso: 'En proceso', en_transito: 'En tránsito',
  en_aduana: 'En aduana', entregada: 'Entregada', cancelada: 'Cancelada',
}

export function EstadoBadge({ estado }: { estado: EstadoOC }) {
  return <span className={BADGE_MAP[estado]}>{ESTADO_LABELS[estado]}</span>
}
```

[VERIFIED: OCTable.tsx analizado — clases extraídas verbatim]

### Anti-Patterns to Avoid

- **Usar spinner en vez de skeleton:** D-09 es explícito — `animate-pulse` bars únicamente.
- **Modificar Step1Form/Step2Form para modo edición:** No tocarlos. EditWizardLoader pre-carga sessionStorage y el wizard funciona sin cambios.
- **Pasar OCDetalle directamente a GastosCard:** GastosCard espera `Record<string, string>`. Mapear los campos del OCDetalle al shape correcto en la page.tsx.
- **Calcular ValueCards en el componente:** Los valores Decimal se calculan en page.tsx con las funciones de `wizard-calculations.ts` y se pasan como props a ValueCards (igual que Step2Form).
- **`'use client'` en page.tsx del detalle:** La page.tsx debe ser Server Component. Solo EditWizardLoader necesita `'use client'`.
- **Usar `not-found.tsx` global para los 3 roles:** Usar `not-found.tsx` por route group para que el layout (Sidebar vs Navbar) envuelva correctamente la página de error.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cálculos financieros en detalle | Nueva lógica de cálculo | `wizard-calculations.ts` existente | `calcFOBTotal`, `calcTotalGastos`, `calcSubtotalImpuestos`, `calcLandedCost` ya resuelven el caso |
| Badge de estado | Nueva implementación | Extraer `getBadgeClasses()` de OCTable.tsx | El patrón y todas las clases ya existen y están validados |
| Modo read-only de ResumenStep1 | Nuevo componente | Reusar ResumenStep1 as-is — ya es read-only por diseño | No tiene inputs; acepta `Step1Data` y muestra `<p>` elements |
| Layout de skeleton | Skeleton genérico | Replicar estructura real de cada sección | La UI-SPEC define alturas concretas para cada bloque |
| Breadcrumb | Librería externa | Texto + separador `/` como string | D-Claude's Discretion: sin librería |
| sessionStorage write | Mecanismo propio | `sessionStorage.setItem('oc-step1-draft', JSON.stringify(step1Data))` | Step1Form ya lee este key exacto |

---

## Hallazgos críticos del codebase

### 1. GastosCard requiere modificación mínima

`GastosCard.tsx` actualmente solo renderiza `<input>` elements. Para el modo read-only necesita un prop `readOnly?: boolean`. La modificación es opt-in: el comportamiento existente (modo edición en el wizard) no cambia.

`OtrosGastosSection.tsx` también tiene inputs y botones Add/Remove. Necesita el mismo tratamiento: prop `readOnly?: boolean` que oculta botones y reemplaza inputs con `<p>`.

[VERIFIED: GastosCard.tsx y OtrosGastosSection.tsx analizados]

### 2. DocumentSlots — no acepta props actualmente

`DocumentSlots` es un componente sin props (`export function DocumentSlots()`). Para el modo read-only (sin upload buttons) necesita una prop `readOnly?: boolean`. En modo read-only: ocultar botones "Adjuntar/Cambiar" y botones X de "Otros", mostrar nombre del documento y `"Sin archivo adjunto"`.

[VERIFIED: DocumentSlots.tsx analizado — ningún prop actualmente]

### 3. OCDetalle interface — campos que faltan en OC base

La interface `OC` en `mock-ocs.ts` tiene: `id`, `numeroOC`, `proveedor`, `emailProveedor` (singular), `despachante`, `emailDespachante` (singular), `numeroDespacho`, `estado`, `fecha`.

La interface `OCDetalle` del UI-SPEC extiende `OC` y agrega campos nuevos. Observación importante: `OC` usa `emailProveedor` (singular string) pero `InfoGeneralState` del wizard usa `emailsProveedor` (array). `OCDetalle` debe tener ambas representaciones o alinear con la del wizard. La solución más limpia: `OCDetalle` extiende `OC` y agrega `emailsProveedor: string[]` y `emailsDespachante: string[]`.

Adicionalmente, `OC.fecha` es ISO `YYYY-MM-DD` pero `InfoGeneralState.fechaOC` es `DD/MM/AAAA`. `OCDetalle` define `fechaOC` (formato display) como campo propio además de heredar `fecha`. El `EditWizardLoader` debe usar `oc.fechaOC` (ya en formato DD/MM/AAAA), no `oc.fecha`.

[VERIFIED: mock-ocs.ts y wizard-types.ts analizados]

### 4. Step1Form.handleContinuar hardcodea la ruta de navegación

```typescript
router.push('/importador/oc/nueva?step=2')
```

En modo edición, Step1Form navega a `/importador/oc/nueva?step=2` — incorrecto para las rutas de edición de proveedor/despachante. Sin embargo, dado que el wizard se reutiliza sin modificaciones (D-06), esto es un comportamiento aceptado para Phase 4 (demo). Phase 5 puede resolver la navegación con datos reales. No bloquea la demo.

[VERIFIED: Step1Form.tsx analizado — línea 158]

### 5. EmptyState — copy desactualizado

`EmptyState.tsx` actual usa copy diferente al contrato de UI-SPEC:
- Actual: `"No hay órdenes de compra"` / `"Todavía no creaste ninguna OC. Comenzá creando tu primera orden de compra."`
- UI-SPEC: `"Todavía no hay OCs"` / `"¡Creá tu primera orden de compra!"`

Además, el heading de filtros activos dice `"No hay resultados para tu búsqueda"` pero UI-SPEC dice `"Sin resultados"`. Hay copy diferenciado por rol (proveedor/despachante) que no está implementado.

[VERIFIED: EmptyState.tsx y UI-SPEC analizados]

### 6. Rutas `/[id]/editar` para proveedor/despachante — no existen aún

`OCTable.tsx` ya genera los links correctos:
```typescript
const eyeHref = (oc: OC) => `/${rol}/oc/${oc.id}`
const pencilHref = (oc: OC) => `/${rol}/oc/${oc.id}/editar`
```
Los links ya apuntan a las rutas que Phase 4 crea. Actualmente darían 404 al navegar.

[VERIFIED: OCTable.tsx analizado — líneas 114-115]

---

## OCDetalle Interface (confirmada contra codebase)

```typescript
// Agregar a src/lib/mock-ocs.ts
import type {
  ProductRow,
  GastosDespacho,
  GastosDespachante,
  GastosAdicionales,
  Impuestos,
  OtroGastoRow,
} from './wizard-types'

export interface OCDetalle extends OC {
  // Campos adicionales de info general
  referenciaOC: string
  emailsProveedor: string[]       // array para el wizard
  emailsDespachante: string[]     // array para el wizard
  despacho: string
  paisOrigen: string
  fechaOC: string                 // DD/MM/AAAA display format
  llegadaEstimada: string         // DD/MM/AAAA display format
  tipoCambio: string              // e.g. "1200"
  divisa: 'ARS/USD' | 'ARS/EUR'
  notas: string
  // Datos financieros
  productos: ProductRow[]
  gastosDespacho: GastosDespacho
  gastosDespachante: GastosDespachante
  gastosAdicionales: GastosAdicionales
  impuestos: Impuestos
  otrosGastos: OtroGastoRow[]
  // Documentos
  documentos: {
    facturaProveedor: string | null
    facturaDespachante: string | null
    conocimientoEmbarque: string | null
    certificadoOrigen: string | null
    otro: string | null
  }
}
```

**Datos ricos requeridos:** OC-003 (id='3', Comercial Andina SRL, en_transito) y OC-004 (id='4', Distribuidora Norte, en_aduana) deben tener `tipoCambio: "1200"`, productos con valores realistas en USD, y gastos ARS típicos de importación argentina. Las demás OCs pueden tener arrays vacíos en gastos/productos.

[VERIFIED: mock-ocs.ts IDs confirmados; wizard-types.ts types confirmados]

---

## Common Pitfalls

### Pitfall 1: params es Promise en Next.js 16

**What goes wrong:** Acceder a `params.id` directamente sin await genera un error en Next.js 16.
**Why it happens:** Next.js 16 cambió `params` y `searchParams` a Promises en los Server Components.
**How to avoid:** `const { id } = await params` en el cuerpo async de la page.
**Warning signs:** TypeError al acceder params.id; ya validado contra el patrón de `nueva/page.tsx`.

[VERIFIED: nueva/page.tsx usa `await searchParams` — patrón confirmado]

### Pitfall 2: `'use client'` transitivo en componentes del wizard

**What goes wrong:** Al importar `ResumenStep1`, `GastosCard`, `ValueCards`, `DocumentSlots` en una página Server Component, el componente se convierte efectivamente en Client debido a los `'use client'` en esos componentes.
**Why it happens:** Estos componentes tienen `'use client'` en la primera línea (estado, hooks).
**How to avoid:** Es correcto importarlos desde Server Components — React los trata como Client Components dentro del Server Component tree. La page.tsx permanece Server Component; los hijos son Client. No confundir el árbol de renderizado.
**Warning signs:** No genera error — es comportamiento correcto de React Server Components.

[VERIFIED: ResumenStep1.tsx, GastosCard.tsx, ValueCards.tsx, DocumentSlots.tsx — todos tienen `'use client'`]

### Pitfall 3: GastosCard onChange requerido

**What goes wrong:** Pasar `readOnly={true}` a GastosCard sin el prop `onChange` puede romper TypeScript strict si `onChange` sigue siendo requerido.
**Why it happens:** El tipo actual de GastosCard hace `onChange` required.
**How to avoid:** Al agregar `readOnly?: boolean`, hacer `onChange` opcional cuando `readOnly` es true, o siempre pasar `onChange={() => {}}` como noop.
**Warning signs:** Error TypeScript en la página de detalle.

### Pitfall 4: Cálculo de ValueCards en page.tsx (no en el componente)

**What goes wrong:** Intentar calcular FOB/gastos/impuestos dentro de ValueCards o pasar strings en lugar de instancias Decimal.
**Why it happens:** ValueCards espera `Decimal` props precalculados.
**How to avoid:** Calcular en page.tsx usando las funciones de `wizard-calculations.ts`:
```typescript
const fobUSD = calcFOBTotal(oc.productos)
const totalGastosUSD = calcTotalGastos(oc.gastosDespacho, oc.gastosDespachante, oc.gastosAdicionales, oc.otrosGastos, oc.tipoCambio)
const totalImpuestosUSD = calcSubtotalImpuestos(oc.impuestos, oc.tipoCambio)
```

[VERIFIED: ValueCards.tsx props interface + wizard-calculations.ts funciones confirmadas]

### Pitfall 5: DocumentSlots no acepta props

**What goes wrong:** DocumentSlots actual no acepta ningún prop — llamarlo con `readOnly={true}` genera error TypeScript.
**Why it happens:** Fue diseñado como componente standalone del wizard.
**How to avoid:** Agregar `readOnly?: boolean` y `documentos?: OCDetalle['documentos']` como props opcionales antes de usarlo en el detalle.

### Pitfall 6: not-found.tsx debe estar en el route group correcto

**What goes wrong:** Un `not-found.tsx` en `src/app/not-found.tsx` no hereda el layout de Sidebar/Navbar de cada rol.
**Why it happens:** Next.js App Router busca el `not-found.tsx` más cercano en el árbol de rutas.
**How to avoid:** Colocar `not-found.tsx` dentro de cada `[id]` directory para que herede el layout del route group (Sidebar para importador, Navbar para proveedor/despachante).

[VERIFIED: layouts de los 3 route groups analizados — (importador) usa Sidebar, (proveedor)/(despachante) usan Navbar]

---

## Mapping: OCDetalle → Step1Data para EditWizardLoader

La fase no modifica Step1Form. El mapeo debe ser preciso para que el wizard precargue correctamente:

| OCDetalle field | Step1Data path | Nota |
|-----------------|----------------|------|
| `oc.referenciaOC` | `info.referenciaOC` | |
| `oc.estado` | `info.estado` | |
| `oc.proveedor` | `info.proveedor` | |
| `oc.emailsProveedor` | `info.emailsProveedor` | Array |
| `oc.despacho` | `info.despacho` | |
| `oc.emailsDespachante` | `info.emailsDespachante` | Array |
| `oc.paisOrigen` | `info.paisOrigen` | |
| `oc.fechaOC` | `info.fechaOC` | Ya en DD/MM/AAAA |
| `oc.llegadaEstimada` | `info.llegadaEstimada` | Ya en DD/MM/AAAA |
| `''` | `info.fechaPago` | No en OCDetalle; usar string vacío |
| `oc.tipoCambio` | `info.tipoCambio` | |
| `oc.divisa` | `info.divisa` | |
| `oc.notas` | `info.notas` | |
| `oc.productos` | `productos` | Array de ProductRow |

Nota: Step2Form (gastos) carga sus propios valores desde sessionStorage o comienza vacío. En Phase 4 (mock), los gastos del Step2 no se pre-cargan en sessionStorage — el usuario editará los datos del Step 1 y verá Step 2 vacío (comportamiento mock aceptado per D-07).

[VERIFIED: Step1Form.tsx useEffect analizado — confirma keys leídos de Step1Data]

---

## Code Examples

### Detail page — patrón completo (importador)

```typescript
// src/app/(importador)/importador/oc/[id]/page.tsx
import { notFound } from 'next/navigation'
import { MOCK_OCS_DETALLE } from '@/lib/mock-ocs'
import {
  calcFOBTotal, calcTotalGastos, calcSubtotalImpuestos
} from '@/lib/wizard-calculations'
import { OCDetailHeader } from '@/components/oc-detail/OCDetailHeader'
import { ResumenStep1 } from '@/components/wizard/ResumenStep1'
import { GastosCard } from '@/components/wizard/GastosCard'
import { ValueCards } from '@/components/wizard/ValueCards'
import { DocumentSlots } from '@/components/wizard/DocumentSlots'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OCDetailPage({ params }: PageProps) {
  const { id } = await params
  const oc = MOCK_OCS_DETALLE.find((o) => o.id === id)
  if (!oc) notFound()

  const fobUSD = calcFOBTotal(oc.productos)
  const totalGastosUSD = calcTotalGastos(
    oc.gastosDespacho, oc.gastosDespachante,
    oc.gastosAdicionales, oc.otrosGastos, oc.tipoCambio
  )
  const totalImpuestosUSD = calcSubtotalImpuestos(oc.impuestos, oc.tipoCambio)

  const step1Data = { info: { ...oc }, productos: oc.productos }

  return (
    <div className="bg-fondo min-h-screen">
      <OCDetailHeader oc={oc} rol="importador" ocId={id} />
      <main className="px-4 sm:px-8 py-6 max-w-5xl mx-auto flex flex-col gap-6">
        <ResumenStep1 step1Data={step1Data} />
        <GastosCard ... readOnly />
        <ValueCards fobUSD={fobUSD} totalGastosUSD={totalGastosUSD} totalImpuestosUSD={totalImpuestosUSD} tipoCambio={oc.tipoCambio} />
        <DocumentSlots readOnly documentos={oc.documentos} />
      </main>
    </div>
  )
}
```

### not-found.tsx — patrón

```typescript
// src/app/(importador)/importador/oc/[id]/not-found.tsx
import Link from 'next/link'
import { FileSearch, ArrowLeft } from 'lucide-react'

export default function OCNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center px-4">
      <FileSearch size={64} className="text-acento" />
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold text-titulares">OC no encontrada</h1>
        <p className="text-base font-normal text-texto/70 max-w-sm">
          No pudimos encontrar la orden de compra que buscás. Puede que haya sido eliminada o que el enlace sea incorrecto.
        </p>
      </div>
      <Link
        href="/importador/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-principal text-white font-medium hover:bg-titulares transition-colors duration-150 min-h-[44px]"
      >
        <ArrowLeft size={18} />
        Volver al dashboard
      </Link>
    </div>
  )
}
```

[VERIFIED: UI-SPEC 404 section + lucide-react FileSearch disponible]

---

## Environment Availability

Step 2.6: SKIPPED — Phase 4 es puramente frontend con datos mock. No requiere herramientas, servicios o CLIs externos más allá de Next.js ya corriendo. Todas las dependencias ya están instaladas (confirmado en `package.json`).

---

## Validation Architecture

`nyquist_validation: false` en `.planning/config.json` — sección omitida.

---

## Security Domain

Phase 4 no introduce nuevas rutas de API, no procesa datos de usuario, no maneja autenticación ni credenciales. Trabaja exclusivamente con datos mock client-side y rutas protegidas por el middleware de Clerk (Phase 1). Sin nuevas consideraciones de seguridad para esta fase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Step2Form gastos no se pre-cargan en sessionStorage en modo edición (solo Step1Data) | Mapping OCDetalle → Step1Data | Si el usuario espera ver los gastos pre-cargados en la demo, la experiencia sería incompleta — pero D-07 acepta comportamiento mock |
| A2 | Step1Form.handleContinuar navegando a `/importador/oc/nueva?step=2` en modo edición es aceptable para Phase 4 (demo) | Pattern 3 | Si el cliente hace pruebas cruzando roles en edición, la navegación post-step1 podría ser confusa. Impacto: bajo para demo |

**Todos los demás claims verificados contra el codebase real.**

---

## Open Questions

1. **¿GastosCard.onChange debe ser opcional o siempre requerido con noop?**
   - What we know: GastosCard requiere `onChange` actualmente; readOnly prop es nueva
   - What's unclear: Preferencia de TypeScript — `onChange?: (key: string, value: string) => void` vs `onChange: ...` siempre requerido
   - Recommendation: Hacer `onChange` opcional cuando `readOnly={true}` usando union type o prop opcional. El planner decide.

2. **¿El botón Eliminar en el detalle del importador abre DeleteModal o hace algo diferente?**
   - What we know: UI-SPEC dice "Button click → opens DeleteModal". `DeleteModal.tsx` ya existe.
   - What's unclear: DeleteModal está en OCTable como Client Component — necesita wiring en OCDetailHeader
   - Recommendation: OCDetailHeader debe ser Server Component con un Client Component hermano `OCDetailActions.tsx` que maneje el estado del modal. O bien OCDetailHeader se hace Client Component. El planner decide el split.

---

## Sources

### Primary (HIGH confidence — verificado contra codebase)
- `src/lib/mock-ocs.ts` — interface OC actual, IDs de OC-003 y OC-004 confirmados
- `src/lib/wizard-types.ts` — interfaces Step1Data, InfoGeneralState, ProductRow, GastosDespacho, GastosDespachante, GastosAdicionales, Impuestos, OtroGastoRow
- `src/lib/wizard-calculations.ts` — calcFOBTotal, calcTotalGastos, calcSubtotalImpuestos, calcLandedCost confirmados
- `src/components/wizard/ResumenStep1.tsx` — read-only mode, `readOnlyClass` string exacto
- `src/components/wizard/GastosCard.tsx` — interface actual, onChange requerido
- `src/components/wizard/ValueCards.tsx` — props Decimal, grid layout
- `src/components/wizard/DocumentSlots.tsx` — sin props actualmente
- `src/components/wizard/Step1Form.tsx` — sessionStorage key `oc-step1-draft`, fecha migration, `handleContinuar` hardcodea ruta
- `src/components/wizard/OtrosGastosSection.tsx` — interface actual con callbacks
- `src/components/wizard/WizardPage.tsx` — acepta `initialStep: string`, sin cambios requeridos
- `src/components/dashboard/OCTable.tsx` — `getBadgeClasses()`, links a `/${rol}/oc/${oc.id}` y editar
- `src/components/dashboard/EmptyState.tsx` — copy actual vs. UI-SPEC
- `src/app/(importador)/importador/oc/nueva/page.tsx` — patrón de page.tsx + `await searchParams`
- `src/app/(importador)/layout.tsx` — Sidebar layout
- `src/app/(proveedor)/layout.tsx` — Navbar layout
- `src/app/(despachante)/layout.tsx` — Navbar layout
- `package.json` — dependencias instaladas, versiones
- `.planning/config.json` — `nyquist_validation: false`
- `.planning/phases/04-oc-views-demo-polish/04-CONTEXT.md` — decisiones locked
- `.planning/phases/04-oc-views-demo-polish/04-UI-SPEC.md` — contrato visual completo

### Secondary (MEDIUM confidence — documentación oficial)
- Next.js App Router: `notFound()` + `not-found.tsx` por segmento — patrón estándar de la plataforma [CITED: nextjs.org/docs/app/api-reference/functions/not-found]
- Next.js 16: `params` como Promise en Server Components — confirmado por patrón observado en `nueva/page.tsx`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package.json verificado, sin nuevas dependencias
- Architecture: HIGH — todos los componentes analizados, interfaces verificadas
- Pitfalls: HIGH — identificados directamente del análisis del codebase
- Mock data: HIGH — IDs y estructura confirmados contra mock-ocs.ts

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (estable — sin dependencias de terceros nuevas)
