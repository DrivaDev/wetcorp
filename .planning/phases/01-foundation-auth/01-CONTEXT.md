# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the entire project foundation: Next.js 16 con TypeScript strict + Tailwind v4 con identidad visual Driva Dev + Clerk RBAC con onboarding de selección de rol + route groups por rol + shells de layout (sidebar importador colapsable, navbar proveedor/despachante, footer) + responsive mobile completo.

No hay persistencia de datos en esta fase — Clerk es el único servicio externo conectado.

</domain>

<decisions>
## Implementation Decisions

### Mobile Sidebar (Importador)
- **D-01:** Implementar hamburger overlay completo en mobile (< 640px). No diferir a Fase 2.
- **D-02:** El sidebar en mobile se muestra como panel deslizante desde la izquierda (`translate-x` animation) sobre un backdrop oscuro (`bg-texto/20`). Tocar el backdrop cierra el panel.
- **D-03:** En mobile aparece un top navbar sticky con `isotipo.svg` (32×32px) a la izquierda y botón hamburger (`Menu`/`X` icon de lucide-react) a la derecha. Este navbar reemplaza visualmente al sidebar en mobile — el sidebar se oculta (`hidden md:flex` o similar).
- **D-04:** En desktop/tablet el sidebar se comporta según lo especificado en UI-SPEC.md (collapsible con useState + localStorage). El mobile navbar solo aparece en breakpoint < 640px.

### SVG Logo Sourcing
- **D-05:** Los archivos SVG son finales y están en `C:\Users\Equipo\Downloads\`. El executor los copia automáticamente a `public/` durante la ejecución del Plan 01-01.
  - `C:\Users\Equipo\Downloads\logo-svg (1).svg` → `public/logo.svg`
  - `C:\Users\Equipo\Downloads\logo-horizontal-svg.svg` → `public/logo-horizontal.svg`
  - `C:\Users\Equipo\Downloads\isotipo-svg.svg` → `public/isotipo.svg`

### Sidebar Collapse Persistence
- **D-06:** El estado colapsado/expandido del sidebar persiste en `localStorage` con la key `'sidebar-collapsed'`. Usar `useEffect` para leer el valor en mount y guardarlo en cada cambio.
- **D-07:** Valor inicial cuando no hay `localStorage` guardado: desktop (≥ 1024px) → expandido (`false`), tablet (640–1023px) → colapsado (`true`). Detectar con `window.innerWidth` en el `useEffect` de inicialización.

### Claude's Discretion
- Implementación del hook de detección de breakpoint para el valor inicial de collapse (puede ser inline en `useEffect` o un `useMediaQuery` custom).
- Active route detection para el nav link activo en sidebar (usar `usePathname()` de Next.js).
- z-index del overlay mobile y del sidebar expandido en overlay mode.
- Clerk locale: UI-SPEC confirma que Clerk components usan inglés por defecto en Fase 1. No configurar localización — diferido.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Artifacts
- `.planning/phases/01-foundation-auth/01-RESEARCH.md` — Patrones de implementación verificados: Tailwind v4 setup, Clerk middleware, onboarding flow, versiones exactas de dependencias
- `.planning/phases/01-foundation-auth/01-UI-SPEC.md` — Contrato visual completo: tokens, componentes, spacing, responsive, copywriting. DEBE leerse antes de implementar cualquier componente de layout.

### Project Requirements & Architecture
- `.planning/REQUIREMENTS.md` — Todos los REQ-IDs de la fase: AUTH-01, AUTH-03, AUTH-04, AUTH-05, LAYOUT-01 a LAYOUT-05, SEO-04, SEO-05
- `.planning/ROADMAP.md` — Goal, success criteria y plan list de Fase 1
- `CLAUDE.md` — Reglas de código obligatorias: TypeScript strict, brand identity, patrones de Clerk/Mongoose

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Proyecto greenfield — no hay código existente. Fase 1 crea todos los assets desde cero.

### Established Patterns
- Todos los patrones de esta fase se documentan en RESEARCH.md y UI-SPEC.md. Son la fuente de verdad para el executor.

### Integration Points
- `src/app/layout.tsx` es el root layout — ClerkProvider, font, body. Todo lo demás depende de este.
- `src/middleware.ts` es el punto de entrada para RBAC — todos los route groups deben estar cubiertos por el matcher.

</code_context>

<specifics>
## Specific Ideas

- Mobile sidebar: slide-in desde la izquierda con `transform translate-x-0 / -translate-x-full`, backdrop `bg-texto/20 fixed inset-0 z-40`, sidebar `fixed inset-y-0 left-0 z-50 w-64`.
- Sidebar collapse: key `'sidebar-collapsed'` en localStorage, valor `'true'`/`'false'` como string.
- Logo copy task en Plan 01-01: usar `fs.copyFileSync` o Bash `cp` desde la ruta de Downloads al directorio `public/`. Verificar que los 3 archivos existen antes de copiar.

</specifics>

<deferred>
## Deferred Ideas

- Clerk localization (español para SignIn/SignUp components) — diferido a v2 o post-Fase 1.
- Sidebar collapse state más granular (recordar qué links estaban activos) — fuera de scope.

</deferred>

---

*Phase: 1-foundation-auth*
*Context gathered: 2026-05-25*
