---
phase: 02-dashboard-ui
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/app/(despachante)/despachante/dashboard/page.tsx
  - src/app/(despachante)/layout.tsx
  - src/app/(importador)/importador/dashboard/page.tsx
  - src/app/(importador)/layout.tsx
  - src/app/(proveedor)/layout.tsx
  - src/app/(proveedor)/proveedor/dashboard/page.tsx
  - src/components/dashboard/DeleteModal.tsx
  - src/components/dashboard/EmptyState.tsx
  - src/components/dashboard/FilterBar.tsx
  - src/components/dashboard/OCTable.tsx
  - src/components/dashboard/StatCard.tsx
  - src/components/layout/Navbar.tsx
  - src/components/layout/Sidebar.tsx
  - src/lib/mock-ocs.ts
  - src/middleware.ts
findings:
  critical: 4
  warning: 7
  info: 3
  total: 14
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-26
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 02 delivers the dashboard UI shell with mock data, Clerk middleware, Sidebar/Navbar layout components, and three role-specific dashboard pages. Most of the UI wiring is structurally sound for a mock phase. However, several issues range from a real security gap in the middleware, to role-hardcoded strings that will silently break when this phase is extended, to a broken delete flow that gives the user false confidence. These must be resolved before Phase 03 connects real data.

---

## Critical Issues

### CR-01: Middleware `SKIP_AUTH_DEV` bypass is an unconditional short-circuit — any unauthenticated request reaches all protected routes in dev

**File:** `src/middleware.ts:11`
**Issue:** When `SKIP_AUTH_DEV=true` the middleware returns `NextResponse.next()` before any authentication or role check. This means every route — including cross-role routes like `/importador/...`, `/proveedor/...`, and `/despachante/...` — is fully open to anyone in the development environment. If `.env.local` is accidentally copied to a staging/preview deployment (a common accident in Vercel/CI pipelines), the entire authentication layer is silently disabled. There is no guard to assert this is only ever set in a local dev context; the check is purely string-based on an environment variable that can be set anywhere.

**Fix:** At a minimum, combine the flag check with a `NODE_ENV` assertion so the bypass is inert in any environment that is not `development`:
```ts
if (process.env.SKIP_AUTH_DEV === 'true' && process.env.NODE_ENV === 'development') {
  return NextResponse.next()
}
```

---

### CR-02: `DeleteModal.onConfirm` does not actually delete — it silently clears the modal, giving the user false confirmation of a destructive action

**File:** `src/components/dashboard/OCTable.tsx:169-175`
**Issue:** Both `onConfirm` and `onCancel` are wired to `() => setDeleteTarget(null)`. Clicking "Eliminar" dismisses the modal identically to clicking "Cancelar". No delete action is dispatched. When real server actions are added in Phase 03, this will require the call site to be re-wired; but more urgently, the current UX tells the user they deleted an OC when nothing happened. If this reaches any user-facing demo or staging environment, it creates a trust failure.

**Fix:** Pass an `ocId` to `onConfirm` and wire it to the actual deletion logic (even a mock splice from MOCK_OCS for now):
```tsx
onConfirm={() => {
  // TODO(phase-03): dispatch deleteOC(deleteTarget.id)
  setDeleteTarget(null)
}}
```
At minimum the two callbacks must differ in behaviour so the distinction is preserved for Phase 03.

---

### CR-03: `Sidebar` hardcodes `NAV_LINKS` and the role subtitle to `importador` — proveedor/despachante share no sidebar, but if Sidebar is ever reused the nav will point to the wrong role's routes

**File:** `src/components/layout/Sidebar.tsx:18-20` and `src/components/layout/Sidebar.tsx:74`
**Issue:** `NAV_LINKS` is a module-level constant that always contains `/importador/dashboard`. The role subtitle at line 74 is the hardcoded string literal `"Importador"`. The component accepts no `rol` prop. Should a future phase reuse `Sidebar` for any other role (or should a developer copy-paste it), all navigation will silently target importador routes. This is an architectural rigidity that creates correctness risk.

**Fix:** Accept a `rol` prop and derive links dynamically:
```tsx
interface SidebarProps {
  rol: 'importador'  // extend as needed
}
export function Sidebar({ rol }: SidebarProps) {
  ...
  const navLinks = NAV_LINKS_BY_ROL[rol]
  // and replace the hardcoded "Importador" string with ROL_LABEL[rol]
}
```

---

### CR-04: `formatFecha` in `OCTable` performs no bounds/format validation — a malformed `fecha` string silently produces `undefined/undefined/undefined` in the UI

**File:** `src/components/dashboard/OCTable.tsx:41-44`
**Issue:** `formatFecha` calls `iso.split('-')` and destructures three elements. If `fecha` is an empty string, `null`-coerced string, or ISO datetime with time component (`"2025-01-15T00:00:00Z"`), the destructuring produces `undefined` values that render verbatim. In Phase 03 dates will come from MongoDB; Mongoose date fields serialised via `JSON.stringify` emit the full ISO-8601 datetime string, not the `YYYY-MM-DD` substring. This will silently break all date rendering.

**Fix:** Parse via `Date` object to be format-agnostic, or at minimum guard against the time-component case:
```ts
function formatFecha(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
```

---

## Warnings

### WR-01: `ProveedorDashboardPage` and `DespachanteDashboardPage` filter mock data by hardcoded email strings — these will always show data regardless of who is signed in

**File:** `src/app/(proveedor)/proveedor/dashboard/page.tsx:13`
**File:** `src/app/(despachante)/despachante/dashboard/page.tsx:13`
**Issue:** `MOCK_OCS.filter((oc) => oc.emailProveedor === 'proveedor@empresa.com')` and the equivalent for despachante use hardcoded email constants that match exactly five and seven records respectively. When Clerk session data is wired in Phase 03, the filtering logic will need to change. As written, nothing in the code signals this substitution point — a developer could miss it and ship a page that shows every user the same hardcoded set of OCs.

**Fix:** Extract the filter identity into a named placeholder constant and add a TODO:
```ts
// TODO(phase-03): replace with sessionClaims.email from Clerk
const MOCK_PROVEEDOR_EMAIL = 'proveedor@empresa.com'
const ocsDelProveedor = MOCK_OCS.filter((oc) => oc.emailProveedor === MOCK_PROVEEDOR_EMAIL)
```

---

### WR-02: `OCTable` renders Edit (`/rol/oc/id/editar`) and View (`/rol/oc/id`) links for proveedor and despachante even though those roles are read-only

**File:** `src/components/dashboard/OCTable.tsx:111-112`, `139-150`
**Issue:** `eyeHref` and `pencilHref` are always built; both the Eye link and the Pencil link are always rendered for all roles. The `rol !== 'importador'` guard only controls the Trash2 button. Proveedor and despachante clicking Pencil will reach a route (`/proveedor/oc/1/editar`) that does not exist and will 404, or in Phase 03 will need a server-side guard to prevent writes. The role prop is already available — the edit button should be suppressed.

**Fix:**
```tsx
{(rol === 'importador') && (
  <Link href={pencilHref(oc)} ... >
    <Pencil size={18} />
  </Link>
)}
```

---

### WR-03: `DeleteModal` has no keyboard accessibility — pressing Escape does not close it, and focus is not trapped inside the dialog

**File:** `src/components/dashboard/DeleteModal.tsx:11-38`
**Issue:** The modal is rendered as a plain `div`, not a `<dialog>` element or a focus-trapped component. When opened, keyboard focus remains wherever it was before the modal appeared, allowing Tab to cycle through the page behind the overlay. There is no `onKeyDown` handler for Escape. This breaks the baseline accessibility expectation for a destructive confirmation dialog.

**Fix:** Add a `useEffect`-based Escape key handler and autofocus the Cancel button on mount:
```tsx
useEffect(() => {
  if (!open) return
  const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
  document.addEventListener('keydown', handle)
  return () => document.removeEventListener('keydown', handle)
}, [open, onCancel])
```

---

### WR-04: `FilterBar` `<select>` has no `value` binding — the select is uncontrolled, so its visual state can drift from the parent's `estadoFiltro` state

**File:** `src/components/dashboard/FilterBar.tsx:38`
**Issue:** The select element only has an `onChange` handler; it has no `value` prop. If the parent programmatically resets `estadoFiltro` to `''` (e.g., a future "clear filters" button), the select will still display the previously chosen option. This will cause a mismatch between displayed state and applied filters.

**Fix:** Accept `estadoValue` (or rename the prop) and bind it:
```tsx
<select
  value={estadoValue}
  className={selectClass}
  onChange={(e) => onEstado(e.target.value as EstadoOC | '')}
>
```

---

### WR-05: `FilterBar` text inputs for proveedor/despachante are also uncontrolled for the same reason

**File:** `src/components/dashboard/FilterBar.tsx:24-35`
**Issue:** Both `<input type="text">` elements have `onChange` but no `value`. Identical drift problem as WR-04: a future reset will clear parent state without clearing the input's displayed text.

**Fix:** Accept `proveedorValue` and `despachanteValue` props and bind them to the inputs.

---

### WR-06: `Sidebar` hydration mismatch — `collapsed` state is initialised to `false` on the server but conditionally set to `true` on the client in `useEffect`, causing a layout shift and potential hydration warning

**File:** `src/components/layout/Sidebar.tsx:25-35`
**Issue:** `useState(false)` provides the server render. The `useEffect` then reads `localStorage` and `window.innerWidth` and potentially calls `setCollapsed(true)`. Because the server cannot know the stored value, the first client paint differs from the server HTML. In Next.js App Router with `'use client'`, this causes a visible flash of the expanded sidebar before it collapses, and can produce a React hydration mismatch warning.

**Fix:** Initialise `collapsed` as `undefined`/`null` and render nothing (or a stable fallback) until the effect runs, using a `mounted` guard:
```tsx
const [collapsed, setCollapsed] = useState<boolean | null>(null)
// render nothing for collapsed-dependent classes until mounted
const effectiveCollapsed = collapsed ?? false
```

---

### WR-07: `SkeletonCells` column count calculation is wrong for proveedor and despachante roles

**File:** `src/components/dashboard/OCTable.tsx:65-66`
**Issue:** `const extraCols = rol === 'importador' ? 2 : 1` gives proveedor and despachante one extra column, but those roles each omit one of the two name columns. The `TableHead` for proveedor renders: Nº OC, Despachante, Estado, Fecha, Acciones (5 columns). The `TableHead` for despachante renders: Nº OC, Proveedor, Estado, Fecha, Acciones (5 columns). Both are 5 columns, same as the skeleton. However the skeleton renders `1 (Nº OC) + extraCols (1) + estado + fecha + acciones = 5` cells — which happens to be numerically correct. But it means the skeleton always renders one name-column regardless of which one is actually present, which is technically correct only by coincidence. If a third name column is added in the future this logic will silently misalign. The more defensible fix is to derive the count from the same conditional used in `TableHead`.

**Fix:**
```tsx
const extraCols = rol === 'importador' ? 2 : 1  // correct today but fragile
// Better:
const nameColCount = (rol !== 'proveedor' ? 1 : 0) + (rol !== 'despachante' ? 1 : 0)
```

---

## Info

### IN-01: `MOCK_OCS` mock data dates extend to December 2025 but the current date is May 2026 — all OCs will appear past-due when real date logic is added

**File:** `src/lib/mock-ocs.ts:29-119`
**Issue:** All mock `fecha` values are in 2025. In Phase 03 any relative-date logic ("pending for X days", overdue highlighting) will make all mock OCs appear overdue during development, which can mask real display bugs. Not a current blocker but worth updating now while the mock data is still the only data source.

**Fix:** Advance the dates to 2026 to reflect the current development period.

---

### IN-02: `EmptyState` filter hint message only mentions proveedor search when the importador dashboard also has a despachante search input

**File:** `src/components/dashboard/EmptyState.tsx:18`
**Issue:** The hint `"Probá cambiando el filtro de estado o el nombre del proveedor."` does not mention the despachante filter, which is visible on the importador dashboard. A user filtering by despachante who sees no results will read a misleading hint.

**Fix:**
```tsx
'Probá cambiando el filtro de estado, el nombre del proveedor o el despachante.'
```

---

### IN-03: `StatCard` `value` prop typed as `number` but rendered directly — zero values render as `0` with no visual distinction from a loading state

**File:** `src/components/dashboard/StatCard.tsx:6` and `13`
**Issue:** Minor: a count of zero renders as the numeral `0`. Without a loading skeleton or placeholder, a briefly-loading page looks identical to a "no data" page, which may be confusing. Not a bug with mock data, but worth noting for when real async data is fetched.

**Fix:** Consider accepting an optional `isLoading` prop or rendering `—` when `value` is `undefined`.

---

_Reviewed: 2026-05-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
