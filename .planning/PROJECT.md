# DrivaOC

## What This Is

Sistema web de gestión de órdenes de compra (OC) para importadores. Conecta tres roles: importador (crea y gestiona OCs), proveedor (ve las OCs donde está asignado) y despachante (ídem). Permite registrar productos, gastos de importación, documentos adjuntos y calcular el costo Landed total en USD/ARS.

## Core Value

Un importador puede crear una OC, ver el costo total de importación (FOB + gastos) y compartir el estado con su proveedor y despachante — todo desde una sola plataforma.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Usuario puede registrarse eligiendo su rol (importador / proveedor / despachante)
- [ ] Importador tiene sidebar con Dashboard y Nueva OC; proveedor/despachante solo ven dashboard
- [ ] Dashboard muestra stats inline (OC Totales, En tránsito, En Aduana, Entregadas) y lista de OCs filtrable
- [ ] Importador puede crear OC — Paso 1: info general + tabla de productos con cálculo automático de FOB
- [ ] Importador puede completar OC — Paso 2: gastos de importación (despacho, despachante, adicionales, otros), documentos PDF, valores finales
- [ ] Documentos PDF se suben a Cloudinary y la URL se guarda en MongoDB
- [ ] Importador puede exportar la OC a PDF
- [ ] Importador puede sincronizar la OC a Google Sheets del cliente (URL fija en .env, service account)
- [ ] Proveedor y despachante reciben email (Resend) al ser asignados a una OC
- [ ] Proveedor/despachante ven solo las OCs donde su email coincide con el campo proveedor/despachante
- [ ] UI respeta identidad visual Driva Dev (Fira Sans, #EA580C, responsive, footer)
- [ ] SEO on-code: meta tags, OG, sitemap, robots

### Out of Scope

- Sistema de pedidos / e-commerce — DrivaOC es gestión interna, no venta
- Multi-tenant completo — producto para un solo cliente importador
- Notificaciones en tiempo real (WebSockets) — email es suficiente para v1
- App móvil nativa — web responsive
- Multi-idioma — solo español v1
- Pagos — fuera del scope

## Context

- **Producto:** Software de gestión interno para cliente importador, desarrollado por Driva Dev
- **Dominio:** No definido aún — deployar en Vercel
- **Estado:** Greenfield — construir desde cero
- **Google Sheets:** URL fija en `.env` — el cliente comparte su sheet con la service account de Google
- **PDFs:** Solo lectura/descarga en proveedor y despachante; subida solo desde el importador
- **Emails:** Resend envía a proveedor/despachante cuando se crea una OC con sus emails
- **Matching de roles:** Al loguearse, proveedor/despachante ven OCs donde su email de Clerk coincide con el campo guardado en la OC
- **Tipo de cambio:** El importador ingresa el TC manualmente; los valores en ARS se calculan en frontend

## Constraints

- **Tech Stack:** Next.js App Router + TypeScript + Tailwind CSS + MongoDB Atlas + Clerk + Cloudinary + Resend + Google Sheets API — no cambiar
- **TypeScript:** Estricto, sin `any`
- **Hosting:** Vercel
- **Fonts:** Fira Sans via Google Fonts
- **PDFs adjuntos:** Solo formato PDF (no imágenes, no Word)
- **PDF export:** Generar desde el backend (puppeteer o react-pdf)

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS |
| Base de datos | MongoDB Atlas + Mongoose |
| Autenticación | Clerk |
| Archivos/Docs | Cloudinary (PDF upload) |
| Emails | Resend |
| Google Sheets | Google Sheets API v4 (service account) |
| PDF Export | react-pdf o puppeteer |
| Deploy | Vercel |

## Brand Identity (Driva Dev)

### Colores
```css
--color-principal:  #EA580C;  /* Botones, CTAs */
--color-titulares:  #9A3412;  /* H1, H2 */
--color-acento:     #FED7AA;  /* Fondos secundarios, badges */
--color-fondo:      #FFF7ED;  /* Fondo general */
--color-texto:      #1C1917;  /* Cuerpo de texto */
```

### Tipografía
- Fuente: **Fira Sans** (Google Fonts)
- H1/H2: Bold 700, color `#9A3412`
- H3/nav: Medium 500
- Body: Regular 400
- Captions: Light 300

### Logos disponibles
- `C:\Users\Equipo\Downloads\logo-svg (1).svg` — vertical (isotipo + logotipo)
- `C:\Users\Equipo\Downloads\logo-horizontal-svg.svg` — horizontal
- `C:\Users\Equipo\Downloads\isotipo-svg.svg` — solo isotipo (ícono)

### Reglas UI
- Botón primario: fondo `#EA580C`, texto blanco
- Botón secundario: borde `#EA580C`, texto `#EA580C`, fondo transparente
- Badges: fondo `#FED7AA`, texto `#9A3412`
- Focus inputs: borde `#EA580C`
- Footer obligatorio: "Desarrollado por Driva Dev" con link a `drivadev.com.ar`

## Key Decisions

| Decisión | Rationale | Outcome |
|----------|-----------|---------|
| Clerk para auth | No reinventar autenticación; roles en metadata de Clerk + MongoDB | — Pending |
| Google Sheets service account | Cliente único — comparte su sheet con la service account en lugar de OAuth por usuario | — Pending |
| Cloudinary para PDFs | Upload, storage y CDN; soporta PDFs además de imágenes | — Pending |
| Resend para emails | Transaccional simple; fácil integración con Next.js API routes | — Pending |
| Matching por email para roles | Proveedor/despachante se identifican por el email que el importador ingresó en la OC | — Pending |
| Standard granularity | 5-8 fases para proyecto de complejidad media-alta con múltiples integraciones | — Pending |

## Evolution

Este documento evoluciona en cada transición de fase y milestone.

**Tras cada fase:** actualizar Validated/Active según lo entregado.
**Tras cada milestone:** revisión completa de secciones.

---
*Última actualización: 2026-05-24 — inicialización del proyecto*
