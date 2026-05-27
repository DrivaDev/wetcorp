# Phase 3: OC Wizard UI - Research

**Researched:** 2026-05-27
**Domain:** React multi-step wizard con cálculos financieros decimal.js, sessionStorage navigation y dynamic table rows
**Confidence:** HIGH

## Summary

La Phase 3 implementa un wizard de creación de OC de 2 pasos totalmente client-side. Todo el estado vive en memoria (React `useState`) y se serializa a `sessionStorage` solo en el momento de navegar entre steps. No hay backend en esta fase — Phase 5 conecta la persistencia real.

El stack es deliberadamente minimalista: sin react-hook-form (formulario controlado manual con arrays de estado), sin librerías de UI externas, con `decimal.js` para toda matemática financiera. El único paquete nuevo que requiere instalación es `decimal.js` — sonner (toast) puede implementarse como componente local simple per decisión de la UI spec.

La complejidad real está concentrada en tres puntos: (1) la tabla de productos dinámica con recálculo en cada keystroke sin perder el foco del input, (2) el manejo correcto del Suspense boundary obligatorio cuando se usa `useSearchParams` en producción Next.js 16, y (3) la conversión de divisas (Flete internacional USD → ARS para subtotales, y Otros gastos con divisa mixta ARS/USD).

**Primary recommendation:** Implementar en 3 planes atómicos: 03-01 instala decimal.js y crea los tipos + cálculos; 03-02 construye Step 1 completo (info general + tabla de productos); 03-03 construye Step 2 completo (gastos + value cards + slots + guardado mock).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wizard Navigation:**
- D-01: Sin indicador de progreso visible — solo el título del paso actual. Sin barra de steps ni tabs.
- D-02: Botón "Continuar a Step 2" activo solo cuando el formulario es válido (mínimo 1 producto + campos requeridos completos). Deshabilitado si falta algo.
- D-03: Step 2 tiene botón "Volver" que regresa a Step 1 con todos los datos intactos (recuperados desde sessionStorage).
- D-04: Al hacer click en "Guardar OC" (fin de Step 2): toast de éxito + redirect al dashboard (`/importador/dashboard`). No hay llamada real al backend en Phase 3.

**State Management Between Steps:**
- D-05: Datos de Step 1 se serializan a JSON y se guardan en `sessionStorage` al navegar a Step 2.
- D-06: Si el usuario recarga la página estando en Step 2 (`?step=2`): redirigir a `?step=1` y recuperar datos desde sessionStorage para pre-poblar el formulario.
- D-07: URL del wizard usa query params: `/importador/oc/nueva?step=1` y `/importador/oc/nueva?step=2`. Una sola `page.tsx` renderiza el step correspondiente según `searchParams.step`.

**Productos Table UX:**
- D-08: Botón "+ Agregar producto" debajo de la tabla (izquierda o centrado). Botón eliminar (Trash2) deshabilitado visualmente cuando queda solo 1 row.
- D-09: Totales calculados en tiempo real con cada keystroke. Total por fila = Cantidad × Valor unitario (decimal.js). FOB total = suma de todos los totales. Ambos se actualizan sin perder el foco.
- D-10: Campos requeridos por fila: Producto (nombre) + Cantidad + Valor unitario (USD). Descripción es opcional.

**Gastos Layout (Step 2):**
- D-11: 4 secciones de gastos, cada una en su propia card con borde `border-acento` y título bold. Despacho / Despachante / Gastos adicionales / Otros gastos (dinámica).
- D-12: Subtotal visible en cada card de sección (tiempo real). Total global de gastos también en tiempo real. Todos los cálculos con decimal.js.

**Value Cards & Document Slots:**
- D-13: 3 value cards inline al final de Step 2, en fila horizontal (stack en mobile). Card 1: FOB, Card 2: Gastos importación, Card 3: Costo Landed Total = FOB + Gastos.
- D-14: 5 slots de documentos con UI de estado vacío: `border-dashed border-acento`, ícono Upload. Sin funcionalidad de upload en Phase 3 — solo UI estática.

### Claude's Discretion
- Layout exacto de los campos de info general en Step 1 (grid de 2 columnas, o columna única en mobile).
- Ícono lucide-react específico por stat type en UI de slots.
- Estilos de error/validación (color del borde, texto de error debajo del campo).
- Texto exacto del toast de éxito al guardar.

### Deferred Ideas (OUT OF SCOPE)
- Upload real de PDFs — slots solo tienen UI en Phase 3. Cloudinary upload va en Phase 6.
- Persistencia en MongoDB — OC1-04 (guardar borrador) y OC2-09 (cambio de estado) van en Phase 5.
- Vista detalle de OC — Phase 4 construye las páginas `/importador/oc/[id]`.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OC1-01 | Formulario info general: Referencia OC, Estado, Proveedor, mails, País, fechas, Tipo de cambio, Notas | Controlado con `useState`, grid sm:grid-cols-2, select con ChevronDown |
| OC1-02 | Tabla dinámica de productos: add/remove filas, campos Producto/Descripción/Cantidad/Valor USD/Total | Array de objetos en useState, recálculo en onChange sin perder foco |
| OC1-03 | FOB Total = suma de productos, mostrar USD + ARS | `decimal.js` reduce sobre array, convertir con tipo de cambio |
| OC1-05 | Todos los cálculos con `decimal.js`; valores guardados como centavos en Phase 5 | decimal.js 10.6.0 con tipos incluidos, inmutable, chainable |
| OC2-01 | Step 2 muestra resumen read-only de Step 1 + lista de productos | Recuperar del estado (pasado como prop desde page.tsx) |
| OC2-02 | Gastos Despacho: SIM, Derechos, Otros (ARS) | Card con 3 inputs número + subtotal decimal.js |
| OC2-03 | Gastos Despachante: Terminal, Flete int (USD), Flete int (ARS), SENASA, Despachante | Flete USD se convierte a ARS para subtotal usando tipo de cambio |
| OC2-04 | Gastos adicionales: Depósito fiscal, Digitalización, Estancia camión, IIBB (ARS) | Card con 4 inputs número |
| OC2-05 | Otros gastos dinámicos: agregar/eliminar, Descripción + Monto + Divisa (ARS/USD) | Array en useState, Divisa select, conversión en cálculo total |
| OC2-06 | Total gastos = suma de todas las secciones en USD + subtítulo ARS | Todos los gastos ARS se dividen por tipo de cambio para mostrar USD equivalente |
| OC2-07 | (Phase 4) Slots de documentos con upload real | Solo UI estática en Phase 3 — 5 slots dashed con Upload icon |
| OC2-08 | Value cards: FOB, Gastos importación, Costo Landed Total (USD + ARS) | grid sm:grid-cols-3, texto `text-3xl font-bold` |
| CALC-01 | Toda matemática financiera usa decimal.js | `new Decimal(a).times(b)` — nunca `a * b` para valores financieros |
| CALC-02 | Conversión ARS/USD usa tipo de cambio ingresado en Step 1 | tipoCambio viaja en sessionStorage con el resto del Step 1 |
| CALC-03 | Valores ARS como subtítulo/referencia — valores primarios en divisa nativa | UI: valor USD grande, subtítulo ARS pequeño debajo |
| DOC-03 | (Parcial en Phase 3) Slots de documentos visibles para proveedor/despachante como read-only | Phase 4 completa esto — Phase 3 solo construye la UI del slot vacío |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Estado del formulario (productos, gastos) | Browser / Client | — | Todo local en useState, sin roundtrip al servidor en Phase 3 |
| Navegación entre steps (URL) | Browser / Client | Frontend Server (SSR) | `useRouter.push` en cliente, `searchParams` prop en page.tsx como Server Component wrapper |
| Serialización a sessionStorage | Browser / Client | — | Operación de browser API pura, ocurre en handlers de onClick |
| Cálculos financieros decimal.js | Browser / Client | — | Se ejecutan en tiempo real en el cliente durante onChange |
| Validación de formulario | Browser / Client | — | Validación client-side pura — sin Server Actions en Phase 3 |
| Toast + redirect mock | Browser / Client | — | setTimeout local, router.push al dashboard |
| UI de slots de documentos | Browser / Client | — | Componentes estáticos, sin upload real en Phase 3 |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| decimal.js | 10.6.0 | Aritmética financiera de precisión arbitraria | Requerido por CLAUDE.md; evita errores de float nativo en cálculos USD/ARS |
| React `useState` | (React 19 incluido) | Estado del formulario de wizard | Patrón establecido en todo el proyecto; react-hook-form sería over-engineering aquí |
| Next.js `useSearchParams` | (Next 16 incluido) | Leer `?step=N` en componentes cliente | Patrón oficial Next.js App Router para query params |
| Next.js `useRouter` | (Next 16 incluido) | Navegar entre steps con `router.push` | Patrón establecido en proyecto (Sidebar usa `usePathname`) |
| lucide-react | 1.16.0 | Iconos Upload, Trash2, Plus, CheckCircle2, ChevronDown | Ya instalado; patrón establecido en todos los componentes existentes |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast de éxito al guardar OC | Disponible en npm; alternativa: toast simple con useState + useEffect (ver UI-SPEC.md) |
| clsx + tailwind-merge | (instalados) | `cn()` para clases condicionales | Todos los componentes nuevos del wizard |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useState` manual para arrays | `react-hook-form useFieldArray` | RHF useFieldArray es válido pero agrega complejidad de `Controller`/`register` para cálculos en tiempo real — useState array es más directo para este caso |
| Toast simple local | `sonner` | Sonner es más polished pero es una dependencia nueva; UI-SPEC.md dice "implementar toast simple si no se instala" |
| `useSearchParams` hook | `searchParams` prop de page.tsx (Server Component) | prop es más simple pero requiere pasar props a componentes cliente; `useSearchParams` en Client Component es directo |

**Installation:**
```bash
npm install decimal.js
```

**Version verification:** decimal.js 10.6.0 verificado en npm registry 2026-05-27. [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
URL: /importador/oc/nueva?step=N
           │
           ▼
    page.tsx (Server Component)
    reads searchParams.step prop
           │
           ▼
    WizardPage (Client Component, 'use client')
    ├── step === '1' → <Step1Form />
    │     ├── useState: InfoGeneralState
    │     ├── useState: ProductRow[]
    │     ├── onChange → recalcula FOB (decimal.js)
    │     └── onContinuar:
    │           sessionStorage.setItem('oc-step1', JSON.stringify(state))
    │           router.push('?step=2')
    │
    └── step === '2' → <Step2Form />
          ├── useEffect → lee sessionStorage / redirect si vacío
          ├── useState: GastosState
          ├── useState: OtrosGastosRow[]
          ├── onChange → recalcula subtotales + total global (decimal.js)
          ├── <ResumenStep1 /> (read-only, datos de sessionStorage)
          ├── <GastosCards />
          ├── <DocumentSlots /> (UI estática)
          ├── <ValueCards /> (FOB + Gastos + Landed Total)
          └── onGuardar:
                showToast()
                setTimeout → router.push('/importador/dashboard')
```

### Recommended Project Structure

```
src/
├── app/(importador)/importador/oc/
│   └── nueva/
│       └── page.tsx               # Server Component wrapper, lee searchParams.step
├── components/wizard/
│   ├── WizardPage.tsx             # 'use client' — root del wizard, maneja step switching
│   ├── Step1Form.tsx              # 'use client' — info general + tabla productos
│   ├── Step2Form.tsx              # 'use client' — gastos + docs + value cards
│   ├── ProductosTable.tsx         # tabla dinámica con add/remove
│   ├── GastosCard.tsx             # card genérica reutilizable para secciones de gastos
│   ├── OtrosGastosSection.tsx     # sección dinámica de gastos libres
│   ├── ResumenStep1.tsx           # resumen read-only en Step 2
│   ├── DocumentSlots.tsx          # 5 slots UI estática
│   ├── ValueCards.tsx             # 3 cards FOB/Gastos/Landed
│   └── WizardToast.tsx            # toast simple con useState+useEffect (o sonner)
└── lib/
    ├── mock-ocs.ts                # existente — interface OC de referencia
    ├── wizard-types.ts            # tipos: ProductRow, GastosState, OtrosGastoRow, Step1Data
    ├── wizard-calculations.ts     # funciones decimal.js: calcFOB, calcSubtotal, calcLanded
    └── utils.ts                   # existente — cn()
```

### Pattern 1: Tabla Dinámica con Cálculo Real-time

**What:** Array de objetos en `useState`. Cada `onChange` actualiza el campo específico de la fila por índice y recalcula el total de la fila con decimal.js. No se usa `ref` ni se manipula el DOM.

**When to use:** Tabla de productos (Step 1) y sección Otros Gastos (Step 2).

**Example:**
```typescript
// Source: patrón derivado de React docs + decimal.js docs oficiales
'use client'
import { Decimal } from 'decimal.js'

interface ProductRow {
  id: string          // crypto.randomUUID() — para React key estable
  producto: string
  descripcion: string
  cantidad: string    // string para input controlado — convertir a Decimal solo para calc
  valorUSD: string
}

function calcTotalFila(row: ProductRow): Decimal {
  const cant = new Decimal(row.cantidad || '0')
  const val  = new Decimal(row.valorUSD || '0')
  return cant.times(val)
}

function calcFOB(rows: ProductRow[]): Decimal {
  return rows.reduce(
    (acc, row) => acc.plus(calcTotalFila(row)),
    new Decimal(0)
  )
}

// En el handler de onChange — actualiza sin perder foco porque el input es controlado
// con value={row.cantidad} — React reconcilia sin desmontar el input
function handleRowChange(
  idx: number,
  field: keyof ProductRow,
  value: string,
  setRows: React.Dispatch<React.SetStateAction<ProductRow[]>>
) {
  setRows(prev => {
    const next = [...prev]
    next[idx] = { ...next[idx], [field]: value }
    return next
  })
}
```

**Clave:** usar `string` como tipo de campo numérico en el estado. Convertir a `Decimal` solo al calcular. Si se usara `number`, el input mostraría `0` cuando el usuario borra el valor, impidiendo que escriba un número nuevo.

### Pattern 2: sessionStorage Serialization para Wizard

**What:** Serializar el estado completo de Step 1 a JSON en sessionStorage al navegar a Step 2. Leer en `useEffect` al montar Step 2. Redirect a step=1 si sessionStorage está vacío.

**When to use:** Transición Step 1 → Step 2 y recuperación en recarga.

**Example:**
```typescript
// Source: Next.js useRouter docs + patrón estándar de browser API
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'oc-step1-draft'

// Al navegar de Step 1 a Step 2:
function handleContinuar(step1Data: Step1Data, router: ReturnType<typeof useRouter>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(step1Data))
  router.push('/importador/oc/nueva?step=2')
}

// Al montar Step 2:
useEffect(() => {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    router.replace('/importador/oc/nueva?step=1')
    return
  }
  const data: Step1Data = JSON.parse(raw)
  setStep1Data(data)
  setProductos(data.productos)
}, [])

// Al volver desde Step 2 a Step 1:
// NO limpiar sessionStorage — simplemente navegar a ?step=1
// El formulario recupera datos desde sessionStorage con el mismo useEffect
```

### Pattern 3: useSearchParams con Suspense Boundary

**What:** `useSearchParams` en un Client Component requiere Suspense boundary obligatorio en producción para evitar error de build.

**When to use:** En la `page.tsx` del wizard que lee `searchParams.step`.

**Example:**
```typescript
// Source: Next.js docs oficiales useSearchParams — verificado 2026-05-27
// [CITED: nextjs.org/docs/app/api-reference/functions/use-search-params]

// OPCIÓN RECOMENDADA: usar searchParams prop (Server Component, sin Suspense)
// src/app/(importador)/importador/oc/nueva/page.tsx
interface PageProps {
  searchParams: Promise<{ step?: string }>  // Next 16: searchParams es Promise
}

export default async function NuevaOCPage({ searchParams }: PageProps) {
  const { step } = await searchParams
  return <WizardPage initialStep={step ?? '1'} />
}

// WizardPage recibe initialStep como prop — no necesita useSearchParams
// Para navegar, usa useRouter().push() que actualiza la URL
```

**Nota Next.js 16:** En Next.js 16 (versión del proyecto), `searchParams` en `page.tsx` es una `Promise` — debe hacerse `await searchParams`. [VERIFIED: package.json — next 16.2.6]

### Pattern 4: Cálculos de Divisas con decimal.js

**What:** Todos los gastos tienen una divisa nativa. Para mostrar totales mixtos (USD equivalente de gastos ARS), dividir por tipo de cambio. Para mostrar ARS de valores USD, multiplicar por tipo de cambio.

**When to use:** Subtotales de sección de gastos, total global de gastos, value cards.

**Example:**
```typescript
// Source: decimal.js official docs [CITED: mikemcl.github.io/decimal.js]
import { Decimal } from 'decimal.js'

// Convertir monto ARS a USD equivalente
function arsAUSD(montoPesos: string, tipoCambio: string): Decimal {
  const monto = new Decimal(montoPesos || '0')
  const tc    = new Decimal(tipoCambio || '1')
  if (tc.isZero()) return new Decimal(0)
  return monto.dividedBy(tc)
}

// Convertir monto USD a ARS
function usdAars(montoUSD: string, tipoCambio: string): Decimal {
  return new Decimal(montoUSD || '0').times(new Decimal(tipoCambio || '0'))
}

// Subtotal de una sección mixta (ej: Despachante que tiene Flete USD + resto ARS)
// Todo se convierte a USD para el subtotal de sección
function calcSubtotalDespachante(gastos: GastosDespachante, tc: string): Decimal {
  const fleteUSD  = new Decimal(gastos.fleteInternacional || '0')
  const terminalARS = arsAUSD(gastos.terminal, tc)
  const fleteIntARS = arsAUSD(gastos.fleteInterno, tc)
  // etc.
  return fleteUSD.plus(terminalARS).plus(fleteIntARS)
}

// Formatear para mostrar en UI
function formatUSD(d: Decimal): string {
  return `USD ${d.toFixed(2)}`
}
function formatARS(d: Decimal): string {
  return `$ ${d.toFixed(2)}`
}
```

### Anti-Patterns to Avoid

- **Float nativo para dinero:** `cantidad * valorUSD` produce errores de punto flotante (0.1 + 0.2 = 0.30000000000000004). Siempre `new Decimal(cantidad).times(valorUSD)`.
- **`number` como tipo de input controlado:** Causa que el input pierda el valor al borrar el último dígito. Usar `string` en el estado, convertir a `Decimal` solo al calcular.
- **`useSearchParams` sin Suspense:** En producción Next.js, un Client Component que llama `useSearchParams` sin `<Suspense>` arriba en el árbol falla el build. Solución: usar `searchParams` prop en la page.tsx como Server Component.
- **Guardar `Decimal` en sessionStorage:** `Decimal` no es serializable a JSON. Guardar como string: `d.toString()`, recuperar con `new Decimal(str)`.
- **`key={index}` en filas dinámicas:** Usar `key={row.id}` (UUID) para que React preserve el estado del input al reordenar filas. `key={index}` causa que el foco salte cuando se elimina una fila que no es la última.
- **Limpiar sessionStorage al volver:** D-03 dice que "Volver" debe mantener los datos. No llamar `sessionStorage.removeItem` al navegar Step 2 → Step 1.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aritmética financiera | Multiplicaciones con `*` o `/` nativo | `decimal.js` | JavaScript IEEE 754 produce errores de precisión en dinero; edge cases con NaN, Infinity |
| IDs únicos para filas | Auto-increment contador | `crypto.randomUUID()` | UUID es estable entre renders, disponible en browser sin dependencias |
| Merge de clases Tailwind | Concatenación manual de strings | `cn()` de `src/lib/utils.ts` | Ya existe, maneja conflictos de clases (margin, padding override) correctamente |

**Key insight:** El formulario del wizard parece complejo por volumen (muchos campos), pero la complejidad real es en los cálculos — decimal.js elimina la categoría entera de bugs de precisión.

---

## Common Pitfalls

### Pitfall 1: Pérdida de Foco en Inputs de Tabla

**What goes wrong:** El cursor salta al inicio o pierde el foco cuando el usuario escribe en un input de la tabla de productos.
**Why it happens:** React desmonta y monta el input cuando cambia la `key` de la fila o cuando el componente padre se re-renderiza de manera que React no puede reconciliar el input existente.
**How to avoid:** Usar `key={row.id}` con UUID estable (nunca `key={index}`). Mantener el input dentro del mismo árbol de componentes en todos los renders.
**Warning signs:** El cursor salta al final del texto cuando se escribe en medio de un número.

### Pitfall 2: Build Failure por useSearchParams sin Suspense

**What goes wrong:** `next build` falla con error "Missing Suspense boundary with useSearchParams".
**Why it happens:** Next.js 16 en producción requiere Suspense para cualquier Client Component que use `useSearchParams`.
**How to avoid:** Usar el patrón `searchParams` prop en `page.tsx` (Server Component) y pasar `initialStep` como prop a `WizardPage` Client Component. Esto evita `useSearchParams` completamente.
**Warning signs:** Error solo aparece en `next build`, no en `next dev`.

### Pitfall 3: searchParams como Promise en Next.js 16

**What goes wrong:** TypeScript error o runtime error al acceder a `searchParams.step` directamente.
**Why it happens:** En Next.js 16 (App Router), `searchParams` en `page.tsx` es una `Promise<Record<string, string>>`, no un objeto plano.
**How to avoid:** `const { step } = await searchParams` en un Server Component async.
**Warning signs:** TypeScript reporta "Property 'step' does not exist on type 'Promise<...>'".

### Pitfall 4: Decimal serializado en sessionStorage

**What goes wrong:** `JSON.parse` de sessionStorage devuelve un objeto plano, no una instancia de `Decimal`. Los métodos `.plus()`, `.times()` no existen.
**Why it happens:** JSON.stringify de un objeto `Decimal` no preserva el prototipo.
**How to avoid:** El estado del wizard usa `string` para todos los campos numéricos. El tipo `Step1Data` no contiene instancias de `Decimal` — solo strings. Las instancias de `Decimal` son temporales, creadas y descartadas en cada cálculo.
**Warning signs:** TypeError: "d.plus is not a function" después de recuperar de sessionStorage.

### Pitfall 5: Conversión de Divisas Incorrecta en Total Gastos

**What goes wrong:** El total de gastos suma pesos y dólares directamente sin conversión.
**Why it happens:** Sección Despachante tiene `fleteInternacional` en USD mientras el resto de sus campos están en ARS. Sección Otros Gastos tiene divisa mixta por ítem.
**How to avoid:** Para el total global de gastos en USD: convertir cada campo ARS a USD dividiendo por tipo de cambio, sumar todo en USD. Nunca sumar strings de distintas divisas sin conversión.
**Warning signs:** El total de gastos muestra un número 1000x mayor de lo esperado (suma de pesos sin dividir).

---

## Code Examples

### decimal.js — Instalación e Import

```typescript
// Source: npm registry — decimal.js 10.6.0 incluye tipos TypeScript nativos
// No se necesita @types/decimal.js
// [VERIFIED: npm view decimal.js types → 'decimal.d.ts']

import { Decimal } from 'decimal.js'

// Uso básico
const total = new Decimal('1234.56').times('3').plus('100')
console.log(total.toFixed(2))  // '3803.68'
console.log(total.toString())  // '3803.68'
```

### Tabla de Productos — Estado Inicial

```typescript
// [ASSUMED] — patrón derivado de React docs y necesidades del wizard
interface ProductRow {
  id: string
  producto: string
  descripcion: string
  cantidad: string
  valorUSD: string
}

const DEFAULT_ROW: Omit<ProductRow, 'id'> = {
  producto: '',
  descripcion: '',
  cantidad: '',
  valorUSD: '',
}

// Estado inicial con 1 fila vacía
const [productos, setProductos] = useState<ProductRow[]>([
  { id: crypto.randomUUID(), ...DEFAULT_ROW }
])

// Agregar fila
const addRow = () =>
  setProductos(prev => [...prev, { id: crypto.randomUUID(), ...DEFAULT_ROW }])

// Eliminar fila (min 1)
const removeRow = (id: string) =>
  setProductos(prev => prev.filter(r => r.id !== id))

// Actualizar campo
const updateRow = (id: string, field: keyof Omit<ProductRow, 'id'>, value: string) =>
  setProductos(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
```

### Validación de Formulario (sin react-hook-form)

```typescript
// [ASSUMED] — validación manual derivada de decisiones D-02 y D-10
function isStep1Valid(
  info: InfoGeneralState,
  productos: ProductRow[]
): boolean {
  const hasRequiredInfo =
    info.referenciaOC.trim() !== '' &&
    info.proveedor.trim() !== '' &&
    info.emailProveedor.trim() !== '' &&
    info.emailDespachante.trim() !== '' &&
    info.paisOrigen.trim() !== '' &&
    info.fechaOC !== '' &&
    new Decimal(info.tipoCambio || '0').greaterThan(0)

  const hasValidProducts = productos.length >= 1 &&
    productos.every(r =>
      r.producto.trim() !== '' &&
      new Decimal(r.cantidad || '0').greaterThan(0) &&
      new Decimal(r.valorUSD || '0').greaterThanOrEqualTo(0)
    )

  return hasRequiredInfo && hasValidProducts
}
```

### Toast Simple (sin sonner)

```typescript
// Source: UI-SPEC.md §Toast de Éxito + lucide-react + patrón existente del proyecto
// [CITED: .planning/phases/03-oc-wizard-ui/03-UI-SPEC.md]
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

function useSuccessToast() {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  const trigger = () => {
    setVisible(true)
    setTimeout(() => {
      setVisible(false)
      router.push('/importador/dashboard')
    }, 2000)
  }

  return { visible, trigger }
}

// JSX del toast
function SuccessToast({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-acento rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 text-sm font-normal text-texto">
      <CheckCircle2 size={20} className="text-principal" />
      <div>
        <p className="font-bold">OC guardada exitosamente</p>
        <p className="text-texto/60">Redirigiendo al dashboard...</p>
      </div>
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pages/` con `useRouter` de `next/router` | App Router con `searchParams` prop en Server Component | Next.js 13+ | `searchParams` es la forma canónica en App Router; `useRouter` para navegación programática sigue siendo correcto |
| `searchParams` como objeto plano | `searchParams` como `Promise<...>` | Next.js 15+ | Requiere `await searchParams` en Server Components async |
| `@types/decimal.js` separado | Tipos incluidos en `decimal.js` | decimal.js v10+ | No instalar `@types/decimal.js` — ya viene con la librería |

**Deprecated/outdated:**
- `import Decimal from 'decimal.js'` (default import): Algunos ejemplos antiguos usan default import. El patrón actual es `import { Decimal } from 'decimal.js'` con named import. [CITED: mikemcl.github.io/decimal.js]
- `export const dynamic = 'force-dynamic'` para dynamic rendering: Reemplazado por `await connection()` en Next.js 16. [CITED: nextjs.org/docs/app/api-reference/functions/use-search-params]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `crypto.randomUUID()` está disponible en el browser target del proyecto | Architecture Patterns — tabla dinámica | Si el browser objetivo no soporta crypto.randomUUID, usar `Math.random().toString(36)` como fallback. Riesgo bajo — disponible en todos los browsers modernos desde 2021. |
| A2 | Toast simple con useState+useEffect es suficiente — no instalar sonner | Standard Stack Supporting | Si el cliente pide toast más elaborado (stack, dismiss manual, tipos), instalar sonner 2.0.7. Riesgo bajo — UI-SPEC.md explícitamente dice "implementar toast simple si no se instala". |
| A3 | Step1Data almacenada en sessionStorage cabe en el límite de ~5MB | Architecture Patterns — sessionStorage | Datos del wizard (texto + números) son pequeños, no hay riesgo real de exceder el límite. |
| A4 | Los campos de info general del Step 1 no incluyen búsqueda/autocomplete de proveedor | Code Examples | REQUIREMENTS.md OC1-01 no menciona búsqueda de proveedor existente — input de texto libre. Si se agrega en futuro, requiere componente combobox. |

---

## Open Questions

1. **¿Tipo de cambio: campo número libre o con validación de rango?**
   - What we know: REQUIREMENTS.md OC1-01 dice "Tipo de cambio (número) + divisa (ARS/USD o ARS/EUR)". CONTEXT.md Specifics menciona conversión ARS = monto_USD × tipo_de_cambio.
   - What's unclear: ¿El campo Tipo de Cambio acepta decimales? ¿Hay validación de rango mínimo/máximo? ¿La divisa es un select con opciones ARS/USD y ARS/EUR?
   - Recommendation: El planner debe decidir si el tipo de cambio es un input libre (con validación `> 0`) o si incluye select de par de divisas. El calc logic es el mismo — solo afecta el label de la UI.

2. **¿El `id` de la OC se genera en el frontend para Phase 3 o se omite?**
   - What we know: Phase 3 no tiene backend. Al "Guardar OC" se hace un toast + redirect sin llamada real.
   - What's unclear: ¿Se genera un UUID local para el mock que luego será reemplazado en Phase 5, o simplemente se redirige al dashboard sin generar ID?
   - Recommendation: No generar ID en Phase 3 — redirect directo sin crear ningún objeto mock. Phase 5 manejará la creación real con MongoDB.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | next dev | ✓ | En uso | — |
| decimal.js | CALC-01, CALC-02 | ✗ (pendiente instalar) | 10.6.0 en npm | Sin fallback — es requerimiento de CLAUDE.md |
| lucide-react | iconos Upload, Trash2, Plus | ✓ | 1.16.0 | — |
| sonner | toast de éxito | ✗ | 2.0.7 en npm | Toast simple con useState (ver UI-SPEC.md) |
| sessionStorage | D-05, D-06 | ✓ (browser API) | — | Sin fallback — browser API estándar |
| crypto.randomUUID | IDs de filas | ✓ (browser API moderna) | — | Math.random fallback si necesario |

**Missing dependencies con no fallback:**
- `decimal.js`: Debe instalarse en el primer plan de la fase (03-01). `npm install decimal.js`

**Missing dependencies con fallback:**
- `sonner`: Si no se instala, usar toast simple local con `useState` + `useEffect` + `setTimeout`. Patrón documentado en UI-SPEC.md.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No detectado — no hay config de tests en el proyecto |
| Config file | ninguno |
| Quick run command | N/A — Wave 0 debe configurar |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CALC-01 | `calcFOB()` retorna valor correcto con decimal.js | unit | `npx jest tests/wizard-calculations.test.ts -t calcFOB` | ❌ Wave 0 |
| CALC-02 | Conversión ARS/USD con tipo de cambio produce resultado correcto | unit | `npx jest tests/wizard-calculations.test.ts -t conversion` | ❌ Wave 0 |
| CALC-03 | Valores ARS se muestran como subtítulo, valores USD como primario | manual-only | inspección visual | — |
| OC1-02 | Agregar/eliminar filas actualiza el array correctamente | unit | `npx jest tests/wizard-state.test.ts -t productRows` | ❌ Wave 0 |
| D-02 | `isStep1Valid()` retorna false cuando faltan campos requeridos | unit | `npx jest tests/wizard-calculations.test.ts -t validation` | ❌ Wave 0 |
| D-06 | Redirect a step=1 cuando sessionStorage está vacío en step=2 | manual-only | inspección en browser | — |

### Sampling Rate
- **Per task commit:** No test runner configurado — validación manual en browser durante ejecución
- **Per wave merge:** Si se configura Jest en Wave 0: `npx jest tests/wizard-calculations.test.ts`
- **Phase gate:** Inspección manual de todos los cálculos antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] No hay framework de testing configurado en el proyecto. Para tests unitarios de cálculos financieros, instalar y configurar Jest + ts-jest, o vitest. Comando: `npm install -D vitest @vitest/ui`
- [ ] `tests/wizard-calculations.test.ts` — cubre CALC-01, CALC-02, D-02
- [ ] `tests/wizard-state.test.ts` — cubre OC1-02 (add/remove rows)

**Nota:** Dado que Phase 3 es 100% UI client-side sin Server Actions ni API routes, los tests más críticos son unitarios sobre las funciones de cálculo en `lib/wizard-calculations.ts`. Los tests de integración / E2E quedan para fases posteriores.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Clerk ya maneja auth — wizard solo accesible por importador vía middleware existente |
| V3 Session Management | no | sessionStorage es localStorage del browser, no afecta session de servidor |
| V4 Access Control | no | Middleware de Phase 1 protege `/importador/*` — wizard hereda esa protección |
| V5 Input Validation | sí | Validación client-side en `isStep1Valid()` + `isStep2Valid()` — validación real de servidor en Phase 5 |
| V6 Cryptography | no | No hay datos sensibles en Phase 3 — sessionStorage contiene datos de formulario sin credenciales |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via valores de inputs | Tampering | React escapa automáticamente los valores en JSX — no usar `dangerouslySetInnerHTML` |
| Datos de sessionStorage manipulados | Tampering | En Phase 3 no hay consecuencias (sin backend). En Phase 5, validar todo en el servidor antes de persistir |
| Acceso al wizard sin autenticación | Elevation of Privilege | Middleware existente de Phase 1 protege `/importador/*` — wizard hereda sin cambios |

---

## Project Constraints (from CLAUDE.md)

Directivas de CLAUDE.md que aplican a Phase 3:

1. **TypeScript strict — sin `any`, sin `as any`:** Todos los tipos del wizard deben ser explícitos. `ProductRow`, `InfoGeneralState`, `GastosState` deben definirse en `lib/wizard-types.ts`.
2. **`'use client'` obligatorio** en todos los componentes con `useState` — el wizard completo lo necesita.
3. **`decimal.js` para toda matemática financiera** — nunca `*`, `/`, `+`, `-` nativo para valores monetarios.
4. **Valores monetarios en MongoDB como enteros (centavos)** — Phase 3 no persiste, pero los tipos deben ser compatibles con la conversión futura: documentar que los strings del formulario se convertirán a centavos en Phase 5.
5. **Sin comentarios explicativos** — el código debe ser autoexplicativo. Nombres de función deben expresar intención: `calcFOBTotal`, `calcSubtotalDespacho`, `arsToUSD`.
6. **Server Actions para CRUD** — no aplica en Phase 3 (sin backend). En Phase 5 sí.
7. **Tailwind tokens, nunca hex directo** — `text-principal`, `border-acento`, `bg-fondo`, `text-titulares`, `text-texto`.
8. **Touch targets `min-h-[44px] min-w-[44px]`** en todos los botones de ícono (Trash2, Plus, Upload).
9. **Fuente Fira Sans** — ya configurada en `globals.css` via `--font-sans`.
10. **Footer "Desarrollado por Driva Dev"** — heredado del layout existente, sin cambios.

---

## Sources

### Primary (HIGH confidence)

- decimal.js 10.6.0 — versión verificada en npm registry. API: `new Decimal(x).times(y).plus(z).toFixed(2)`. Tipos incluidos nativos. [VERIFIED: npm registry]
- Next.js 16.2.6 docs oficiales — `searchParams` es `Promise` en page.tsx, `useSearchParams` requiere Suspense en producción. [CITED: nextjs.org/docs/app/api-reference/functions/use-search-params] [VERIFIED: package.json]
- decimal.js official docs — constructores, métodos aritméticos, output methods, TypeScript. [CITED: mikemcl.github.io/decimal.js]

### Secondary (MEDIUM confidence)

- UI-SPEC.md Phase 3 — contrato visual completo: estilos de inputs, tabla, cards de gastos, value cards, slots, toast. [VERIFIED: codebase grep]
- CONTEXT.md Phase 3 — decisiones D-01 a D-14 sobre comportamiento del wizard. [VERIFIED: codebase read]
- Patrones de OCTable.tsx y StatCard.tsx — estructura de componentes, uso de `cn()`, touch targets, badge styles. [VERIFIED: codebase read]

### Tertiary (LOW confidence)

- N/A — todas las claims críticas fueron verificadas con fuentes PRIMARY o SECONDARY.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — decimal.js version verificada en npm; Next.js patterns verificados en docs oficiales
- Architecture: HIGH — basada en patrones existentes del proyecto (Phase 2) + docs Next.js verificadas
- Pitfalls: HIGH — Suspense boundary y searchParams Promise verificados en docs Next.js 16; float/string pitfalls verificados en decimal.js docs
- UI patterns: HIGH — UI-SPEC.md es el contrato de diseño verificado y aprobado

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (30 días — stack estable)
