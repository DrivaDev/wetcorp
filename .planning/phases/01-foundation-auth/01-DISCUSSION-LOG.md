# Phase 1: Foundation & Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 1-foundation-auth
**Areas discussed:** Mobile sidebar, SVG logo sourcing, Collapse persistence

---

## Mobile Sidebar

| Option | Description | Selected |
|--------|-------------|----------|
| Hamburger overlay completo | Botón hamburger en navbar que abre el sidebar como overlay full-screen. Más complejo (~2h extra), pero UX completa desde el inicio. | ✓ |
| Solo collapsed (icon strip) | En mobile el sidebar siempre se muestra colapsado (64px, solo íconos). Simple, funcional, sin overlay. | |
| Sidebar oculto en mobile | El sidebar no aparece en mobile. Sin hamburger. Diferir a Fase 2. | |

**User's choice:** Hamburger overlay completo

| Opción de UI del overlay | Descripción | Selected |
|--------------------------|-------------|----------|
| Panel deslizante desde la izquierda | Sidebar entra desde el borde izquierdo con animación slide (translate-x). Backdrop oscuro para cerrar. | ✓ |
| Overlay completo (fullscreen) | El sidebar ocupa toda la pantalla en mobile cuando está abierto. | |
| Vos decidís | El planner elige el patrón que mejor encaje con el sistema de diseño. | |

**User's choice:** Panel deslizante desde la izquierda

| Ubicación del hamburger | Descripción | Selected |
|------------------------|-------------|----------|
| Navbar sticky en mobile con hamburger | En mobile aparece un top bar con isotipo.svg + botón hamburger. El sidebar está hidden por defecto. | ✓ |
| Botón hamburger flotante | Botón fijo en esquina (fixed bottom-left o top-left). Sin top bar extra. | |
| Vos decidís | El planner elige la ubicación del trigger. | |

**User's choice:** Navbar sticky en mobile con hamburger
**Notes:** El mobile navbar es específico al breakpoint < 640px. No reemplaza el sidebar en desktop/tablet.

---

## SVG Logo Sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, son los finales | Los logos finales están en Downloads. El executor los copia a public/. | ✓ |
| No, los voy a proveer después | El executor crea placeholders SVG y el plan incluye un TODO. | |
| Los subo al repo manualmente | El usuario los mueve a public/ antes de ejecutar. | |

**User's choice:** Sí, son los finales

| Método de copia | Descripción | Selected |
|-----------------|-------------|----------|
| El executor los copia automáticamente | El plan incluye una tarea que copia desde Downloads a public/. Automatizado. | ✓ |
| Los copio yo antes de ejecutar | El plan asume que los SVGs ya están en public/ y solo los valida. | |

**User's choice:** El executor los copia automáticamente
**Notes:** Rutas origen: `C:\Users\Equipo\Downloads\logo-svg (1).svg`, `logo-horizontal-svg.svg`, `isotipo-svg.svg`

---

## Collapse Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, persistir en localStorage | El sidebar recuerda si estaba colapsado. useEffect + localStorage. | ✓ |
| No, solo useState (se resetea) | Siempre empieza expandido en desktop. Más simple. | |
| Vos decidís | El planner elige basándose en lo que sea más simple y consistente. | |

**User's choice:** Sí, persistir en localStorage

| Valor inicial | Descripción | Selected |
|---------------|-------------|----------|
| Expandido en desktop, colapsado en tablet | Desktop (≥ 1024px): expanded. Tablet (640–1023px): collapsed. Coincide con UI-SPEC. | ✓ |
| Siempre expandido por defecto | Sin importar el tamaño de pantalla, empieza expanded. | |

**User's choice:** Expandido en desktop, colapsado en tablet
**Notes:** Key localStorage: `'sidebar-collapsed'`. Inicialización via useEffect con window.innerWidth check.

---

## Claude's Discretion

- Implementación del hook de detección de breakpoint para valor inicial de collapse (inline o custom hook)
- Active route detection en sidebar usando usePathname() de Next.js
- z-index del overlay mobile y backdrop
- Clerk locale: inglés por defecto en Fase 1 (confirmado como no prioritario)

## Deferred Ideas

- Clerk localization (español para SignIn/SignUp) — diferido a v2
- Sidebar collapse state granular — fuera de scope
