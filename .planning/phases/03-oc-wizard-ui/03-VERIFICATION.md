---
phase: 03-oc-wizard-ui
verified: 2026-05-28T00:00:00Z
status: human_needed
score: 11/13 must-haves verified
overrides_applied: 0
gaps: []
deferred:
  - truth: "OC2-07: upload real de PDF a Cloudinary y guardado de URL en MongoDB"
    addressed_in: "Phase 6"
    evidence: "Phase 6 Success Criteria 1: 'Importador puede subir PDF a cualquiera de los 5 slots — upload via signed endpoint → Cloudinary (resource_type: raw) → URL guardada en MongoDB'. ROADMAP Note en Phase 3: 'DOC-03 incluida aquí como vista read-only de slots (sin upload real aún)'."
  - truth: "DOC-03: proveedor y despachante pueden descargar documentos (no solo ver slots vacíos)"
    addressed_in: "Phase 6"
    evidence: "REQUIREMENTS.md traceability: DOC-03 mapeado a Phase 4 y Phase 6. Phase 6 Requirements incluye DOC-03. En Phase 3 el requisito aplica únicamente como 'slots visibles con estado vacío'."
  - truth: "OC1-04: OC se persiste en MongoDB con estado: borrador al completar Step 1"
    addressed_in: "Phase 5"
    evidence: "ROADMAP Note Phase 3: 'OC1-04 (persistir en MongoDB) → Phase 5'. Phase 5 Success Criteria 2: 'Step 1 guarda OC como borrador en MongoDB'."
  - truth: "OC2-09: estado OC cambia de borrador a primer estado real al completar Step 2"
    addressed_in: "Phase 5"
    evidence: "ROADMAP Note Phase 3: 'OC2-09 (cambio de estado) → Phase 5'. Phase 5 Success Criteria 3: 'Step 2 actualiza OC en MongoDB; al completar, estado cambia de borrador al estado seleccionado'."
human_verification:
  - test: "Verificar que el botón 'Continuar a Paso 2' bloquea la navegación correctamente antes del primer click"
    expected: "Sin completar campos requeridos, hacer click en el botón debe mostrar errores de validación pero NO navegar a step=2. El botón visualmente aparece en estado deshabilitado (bg-principal/40) desde el inicio."
    why_human: "El atributo HTML disabled solo se activa después del primer click (submitted && !isValid). La navegación SÍ está bloqueada por el guard en handleContinuar, pero el disabled HTML no se aplica en el primer render. Necesita verificación visual/comportamental."
  - test: "Verificar flujo end-to-end completo del wizard en el browser"
    expected: "1) Navegar a /importador/oc/nueva → ver Step1Form. 2) Completar todos los campos requeridos. 3) Agregar producto con cantidad y valor → ver totales actualizarse en tiempo real. 4) Click 'Continuar a Paso 2' → navegar a step=2. 5) Ver resumen read-only de Step 1. 6) Ingresar gastos → ver subtotales actualizarse. 7) Ver 5 slots de documentos con borde dashed. 8) Ver las 3 value cards con valores correctos. 9) Click 'Guardar OC' → toast de éxito → redirect al dashboard."
    why_human: "Flujo multi-paso con estado en sessionStorage y múltiples cálculos en tiempo real — no verificable sin ejecutar el browser."
  - test: "Verificar que recargar la página en ?step=2 redirige a ?step=1"
    expected: "Al recargar directamente /importador/oc/nueva?step=2, el componente Step2Form detecta sessionStorage vacío y ejecuta router.replace a ?step=1."
    why_human: "Comportamiento de redirect en useEffect con sessionStorage — requiere browser real."
---

# Phase 3: OC Wizard UI — Reporte de Verificación

**Phase Goal:** El importador puede completar el wizard de OC de 2 pasos con todos los campos, cálculos financieros precisos y slots de documentos (estado local, sin persistencia real)
**Verificado:** 2026-05-28T00:00:00Z
**Status:** human_needed
**Re-verificación:** No — verificación inicial

---

## Resumen de Logro del Goal

El codebase implementa substancialmente el goal de Phase 3. Todos los artefactos clave existen, son sustanciales y están conectados. Los cálculos financieros con decimal.js están implementados correctamente. Los 10 must-haves binarios verificados programáticamente pasan sin excepción. Dos ítems requieren verificación humana por comportamiento de UI en tiempo real.

**Score: 11/13 must-haves verificados** (2 requieren verificación humana)

---

## Verdades Observables

| # | Verdad | Status | Evidencia |
|---|--------|--------|-----------|
| 1 | El importador puede ver el formulario de Step 1 en /importador/oc/nueva?step=1 | ✓ VERIFICADO | page.tsx Server Component async + WizardPage renderiza Step1Form cuando initialStep !== '2' |
| 2 | El importador puede ingresar info general (referencia, proveedor, mails, país, fechas, tipo de cambio, estado, notas) | ✓ VERIFICADO | Step1Form.tsx: 10 campos controlados con estado InfoGeneralState completo incluyendo todos los campos de OC1-01 |
| 3 | El importador puede agregar y eliminar filas de productos en la tabla dinámica | ✓ VERIFICADO | ProductosTable.tsx + handlers addProducto/removeProducto en Step1Form, key={row.id} con UUID estable |
| 4 | El total de cada fila (Cantidad × Valor USD) se recalcula en tiempo real con decimal.js | ✓ VERIFICADO | ProductosTable: `calcTotalFila(row).toFixed(2)` en cada celda, se recalcula en cada render |
| 5 | El FOB Total (suma de todos los totales) se muestra en USD y en ARS | ✓ VERIFICADO | ProductosTable tfoot: calcFOBTotal(productos) + usdToARS para subtítulo ARS |
| 6 | El botón Trash2 está deshabilitado cuando queda solo 1 producto | ✓ VERIFICADO | `disabled={productos.length === 1}` + aria-label correctos en ProductosTable |
| 7 | El botón Continuar a Paso 2 está deshabilitado cuando el formulario no es válido | ? INCIERTO | Visual: className aplica bg-principal/40 cuando !isValid desde el inicio. Pero: `disabled={submitted && !isValid}` — el atributo HTML disabled solo se activa post-primer-click. La navegación está bloqueada por el guard en handleContinuar. Requiere verificación humana. |
| 8 | Step 2 muestra el resumen read-only de la info general y la lista de productos del Step 1 | ✓ VERIFICADO | ResumenStep1.tsx: todos los campos de OC2-01, tabla de productos read-only, FOB Total en USD+ARS |
| 9 | Los 4 grupos de gastos con subtotales en tiempo real calculados con decimal.js | ✓ VERIFICADO | Step2Form: 3 GastosCards + OtrosGastosSection. Subtotales pasados como Decimal desde calcSubtotal* |
| 10 | El total global de gastos se muestra en USD equivalente + subtítulo en ARS, recalculado en tiempo real | ✓ VERIFICADO | Step2Form: formatUSD(totalGastosUSD) + formatARS(usdToARS(...)) en div de total |
| 11 | Las 3 value cards muestran valores correctos en USD con subtítulo en ARS | ✓ VERIFICADO | ValueCards.tsx: Valor FOB, Gastos de Importación, Costo Landed Total. calcLandedCost = FOB + GastosUSD |
| 12 | Los 5 slots de documentos muestran la UI de estado vacío con borde dashed, ícono Upload y label | ✓ VERIFICADO | DocumentSlots.tsx: 5 slots exactos, border-dashed border-acento, Upload size={32}, "Sin archivo adjunto" |
| 13 | WizardPage monta Step1Form cuando step=1 y Step2Form cuando step=2 | ✓ VERIFICADO | WizardPage.tsx: if (initialStep === '2') return Step2Form; else return Step1Form |

---

## Artefactos Requeridos

| Artefacto | Status | Detalles |
|-----------|--------|----------|
| `src/lib/wizard-types.ts` | ✓ VERIFICADO | 7 interfaces exportadas, todos los campos numéricos como string, sin `number` |
| `src/lib/wizard-calculations.ts` | ✓ VERIFICADO | 13 funciones exportadas, `import { Decimal } from 'decimal.js'`, sin operadores aritméticos nativos para dinero |
| `src/app/(importador)/importador/oc/nueva/page.tsx` | ✓ VERIFICADO | Server Component async, `await searchParams`, sin 'use client', pasa initialStep a WizardPage |
| `src/components/wizard/WizardPage.tsx` | ✓ VERIFICADO | 'use client', sin useEffect/useState/sessionStorage, condicional simple entre Step1Form y Step2Form (<15 líneas) |
| `src/components/wizard/Step1Form.tsx` | ✓ VERIFICADO | 'use client', estado InfoGeneralState + ProductRow[], sessionStorage read en useEffect, handleContinuar con sessionStorage.setItem |
| `src/components/wizard/ProductosTable.tsx` | ✓ VERIFICADO | 'use client', key={row.id} (no key={index}), calcTotalFila en render, disabled Trash2 con 1 fila |
| `src/components/wizard/ResumenStep1.tsx` | ✓ VERIFICADO | 'use client', calcTotalFila + calcFOBTotal, clases read-only bg-fondo, badges de estado |
| `src/components/wizard/GastosCard.tsx` | ✓ VERIFICADO | 'use client', prop subtotalUSD: Decimal, muestra "Subtotal", border-acento |
| `src/components/wizard/OtrosGastosSection.tsx` | ✓ VERIFICADO | 'use client', key={row.id}, select ARS/USD, subtotal con Decimal |
| `src/components/wizard/Step2Form.tsx` | ✓ VERIFICADO | 'use client', lee 'oc-step1-draft' sessionStorage, router.replace si vacío, importa ValueCards + DocumentSlots, sin llamadas fetch/API real |
| `src/components/wizard/ValueCards.tsx` | ✓ VERIFICADO | 'use client', calcLandedCost + formatUSD + formatARS + usdToARS importados, grid sm:grid-cols-3, text-3xl para USD |
| `src/components/wizard/DocumentSlots.tsx` | ✓ VERIFICADO | Sin 'use client' (Server Component), border-dashed border-acento, 5 slots con nombres exactos, Upload icon, "Sin archivo adjunto" |

---

## Verificación de Key Links

| Desde | Hacia | Via | Status | Detalles |
|-------|-------|-----|--------|----------|
| page.tsx | WizardPage.tsx | prop initialStep | ✓ WIRED | `<WizardPage initialStep={step ?? '1'} />` — confirmed |
| ProductosTable.tsx | wizard-calculations.ts | calcTotalFila, calcFOBTotal, usdToARS | ✓ WIRED | Importados y usados en render |
| Step1Form.tsx | wizard-types.ts | InfoGeneralState, ProductRow, Step1Data | ✓ WIRED | Importados como tipos, usados en useState |
| Step1Form.tsx | sessionStorage['oc-step1-draft'] | sessionStorage.setItem en handleContinuar | ✓ WIRED | Clave confirmada |
| Step2Form.tsx | sessionStorage['oc-step1-draft'] | useEffect al montar + router.replace si vacío | ✓ WIRED | `sessionStorage.getItem('oc-step1-draft')` + `router.replace('/importador/oc/nueva?step=1')` |
| Step2Form.tsx | wizard-calculations.ts | calcSubtotalDespacho/Despachante/Adicionales/Otros, calcTotalGastos | ✓ WIRED | Todos importados y usados en cálculos derivados en render |
| Step2Form.tsx | ValueCards.tsx | props fobUSD, totalGastosUSD, tipoCambio | ✓ WIRED | `<ValueCards fobUSD={fobUSD} totalGastosUSD={totalGastosUSD} tipoCambio={tipoCambio} />` |
| Step2Form.tsx | DocumentSlots.tsx | componente estático sin props | ✓ WIRED | `<DocumentSlots />` en JSX |
| GastosCard.tsx | wizard-calculations.ts | usdToARS, formatARS | ✓ WIRED | Subtotal en ARS calculado y renderizado |

---

## Data-Flow Trace (Level 4)

| Artefacto | Variable de datos | Fuente | Produce datos reales | Status |
|-----------|-------------------|--------|----------------------|--------|
| ValueCards.tsx | fobUSD, totalGastosUSD | Props desde Step2Form (Decimal instances) | Sí — calculados desde estado React reactivo | ✓ FLOWING |
| ProductosTable.tsx | calcTotalFila(row) | Props productos[] desde Step1Form useState | Sí — recalculado en cada keystroke | ✓ FLOWING |
| ResumenStep1.tsx | step1Data | Prop desde Step2Form que viene de sessionStorage | Sí — deserializado de sessionStorage | ✓ FLOWING |
| GastosCard.tsx | subtotalUSD | Prop Decimal desde Step2Form (cálculo derivado en render) | Sí — recalculado en cada cambio de input | ✓ FLOWING |
| DocumentSlots.tsx | N/A | Componente estático (intencionalmente sin datos) | N/A — Phase 3 define estado vacío como correcto | ✓ CORRECTO para Phase 3 |

---

## Spot-Checks Comportamentales

| Comportamiento | Verificación | Resultado | Status |
|----------------|-------------|-----------|--------|
| decimal.js instalado y funcional | `node -e "require('decimal.js')" && new Decimal('1.1').plus('2.2').toFixed(2)` | `3.30` (correcto, evita error float 3.3000000001) | ✓ PASS |
| decimal.js en package.json | `grep -c "decimal.js" package.json` | `1` | ✓ PASS |
| TypeScript compila sin errores | `npx tsc --noEmit` | Sin output = sin errores | ✓ PASS |
| DocumentSlots sin 'use client' (Server Component) | grep | `0` matches | ✓ PASS |
| ValueCards importa funciones de cálculo | grep calcLandedCost\|formatUSD\|formatARS\|usdToARS | `8` referencias | ✓ PASS |

---

## Cobertura de Requirements

| Requirement | Plan fuente | Descripción resumida | Status | Evidencia |
|-------------|-------------|----------------------|--------|-----------|
| OC1-01 | 03-01 | Formulario info general completo | ✓ SATISFECHO | Step1Form: 10 campos controlados con todos los definidos en el requisito |
| OC1-02 | 03-01 | Tabla dinámica de productos con totales | ✓ SATISFECHO | ProductosTable: agregar/eliminar filas, Total = Cantidad × Valor USD, mínimo 1 producto |
| OC1-03 | 03-01 | FOB Total en USD y ARS con tipo de cambio | ✓ SATISFECHO | ProductosTable tfoot + Step1Form: calcFOBTotal + usdToARS |
| OC1-05 | 03-01 | decimal.js para todos los cálculos financieros | ✓ SATISFECHO | wizard-calculations.ts: sin operadores aritméticos nativos, decimal.js en package.json |
| OC2-01 | 03-02 | Resumen read-only del Step 1 en Step 2 | ✓ SATISFECHO | ResumenStep1.tsx: todos los campos de info general + tabla de productos read-only |
| OC2-02 | 03-02 | Gastos Despacho: SIM, Derechos, Otros (ARS) | ✓ SATISFECHO | GastosCard con camposDespacho: 3 campos ARS |
| OC2-03 | 03-02 | Gastos Despachante: Terminal, Flete int USD, Flete ARS, SENASA, Despachante | ✓ SATISFECHO | GastosCard con camposDespachante: 5 campos incluyendo fleteInternacional (USD) |
| OC2-04 | 03-02 | Gastos Adicionales: Depósito fiscal, Digitalización, Estancia camión, IIBB | ✓ SATISFECHO | GastosCard con camposAdicionales: 4 campos ARS |
| OC2-05 | 03-02 | Otros gastos dinámicos: Descripción + Monto + Divisa ARS/USD | ✓ SATISFECHO | OtrosGastosSection: agregar/eliminar filas, select ARS/USD, key={row.id} |
| OC2-06 | 03-02 | Total global de gastos en USD + ARS en tiempo real | ✓ SATISFECHO | Step2Form: formatUSD(totalGastosUSD) + formatARS(usdToARS(...)) recalculado en render |
| OC2-07 | 03-03 | 5 slots de documentos — solo UI en Phase 3 (upload real en Phase 6) | ⚠️ PARCIAL | DocumentSlots.tsx: UI de 5 slots estática. Upload a Cloudinary/MongoDB diferido. Ver sección Deferred. |
| OC2-08 | 03-03 | Cards finales: Valor FOB, Gastos, Costo Landed Total en USD + ARS | ✓ SATISFECHO | ValueCards.tsx: 3 cards con calcLandedCost, text-3xl, subtítulo ARS |
| CALC-01 | 03-01/03/03 | decimal.js sin float nativo | ✓ SATISFECHO | wizard-calculations.ts: solo `.times()`, `.plus()`, `.dividedBy()`, `.greaterThan()` — sin *, +, /, - nativos |
| CALC-02 | 03-01/03/03 | Conversión ARS/USD usa tipo de cambio del importador | ✓ SATISFECHO | arsToUSD/usdToARS usan `tipoCambio` de InfoGeneralState propagado a todos los componentes |
| CALC-03 | 03-01/03/03 | Valores ARS como subtítulo; valores primarios en divisa nativa | ✓ SATISFECHO | Patrón consistente: valor USD primario en text-bold, ARS como `text-titulares/60` secundario |
| DOC-03 | 03-03 | Slots visibles y read-only para proveedor/despachante | ⚠️ PARCIAL | DocumentSlots.tsx: read-only por diseño (sin onClick/handlers). Vista de proveedor/despachante en Phase 4. Ver Deferred. |

### Requirements No Incluidos en los Planes pero Mapeados a Phase 3 en REQUIREMENTS.md

| Requirement | Traceability Table Phase | Nota |
|-------------|--------------------------|------|
| OC1-04 | Phase 3 en tabla, pero Note del ROADMAP lo mueve a Phase 5 | Diferido correctamente — ver sección Deferred |
| OC2-09 | Phase 3 en tabla, pero Note del ROADMAP lo mueve a Phase 5 | Diferido correctamente — ver sección Deferred |
| OC2-07 | Phase 4 en tabla | El PLAN de Phase 3 lo reclama como parcial (UI sin upload) — aceptable |
| DOC-03 | Phase 4 en tabla | El PLAN de Phase 3 lo reclama como parcial (slots visibles) — aceptable |

---

## Anti-Patrones Detectados

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| Step2Form.tsx | 132, 141, 150 | `as unknown as Record<string, string>` para pasar GastosDespacho/Despachante/Adicionales a GastosCard | ⚠️ Warning | TypeScript strict evasion — CLAUDE.md prohíbe `as any`, y `as unknown as` es funcionalmente equivalente. No afecta el comportamiento en runtime pero viola las convenciones del proyecto. El SUMMARY 03-02 lo documenta como "cast aplicado para compatibilidad de tipos". |
| Step1Form.tsx | 308 | `disabled={submitted && !isValid}` — el atributo HTML disabled no se aplica en el primer render | ⚠️ Warning | El botón aparece visualmente deshabilitado (className correcto desde el inicio) pero no es aria-disabled ni disabled antes del primer click. Navegación sí bloqueada por guard en handleContinuar. |

**Clasificación de anti-patrones:**
- `as unknown as` en Step2Form: Warning — no bloquea funcionalidad pero viola TypeScript strict del proyecto. Root cause: GastoField genérico con `Record<string, string>` vs tipos concretos. Fix recomendado: parametrizar GastosCard con generics.
- disabled condicional: Warning — la navegación está protegida, solo el atributo HTML es inconsistente. Comportamiento UX es correcto.

---

## Items Diferidos (Phase 3 no los cubre — cubiertos en fases posteriores)

| # | Item no cumplido | Cubierto en | Evidencia |
|---|-----------------|-------------|-----------|
| 1 | Upload real de PDFs a Cloudinary en los 5 slots | Phase 6 | SC1 de Phase 6: "Importador puede subir PDF a cualquiera de los 5 slots — upload via signed endpoint → Cloudinary" |
| 2 | URLs de documentos guardadas en MongoDB | Phase 6 | DOC-01, DOC-02 en Requirements de Phase 6 |
| 3 | Proveedor/despachante ven documentos adjuntos reales y pueden descargarlos | Phase 6 | DOC-03 listado en Requirements de Phase 6 |
| 4 | OC persistida en MongoDB con estado: borrador al completar Step 1 | Phase 5 | SC2 de Phase 5: "Step 1 guarda OC como borrador en MongoDB" |
| 5 | Estado OC cambia de borrador al completar Step 2 | Phase 5 | SC3 de Phase 5: "Step 2 actualiza OC en MongoDB; estado cambia de borrador al estado seleccionado" |

---

## Verificación Humana Requerida

### 1. Comportamiento del botón "Continuar a Paso 2" antes del primer click

**Prueba:** Navegar a /importador/oc/nueva sin completar ningún campo. Observar el botón "Continuar a Paso 2" y hacer click sin llenar el formulario.
**Esperado:** El botón visualmente debe verse deshabilitado (gris con bg-principal/40). Al hacer click, debe mostrar mensajes de error en los campos vacíos requeridos pero NO navegar al Step 2.
**Por qué requiere humano:** El `disabled` HTML solo se activa después del primer click. La apariencia visual ES correcta desde el inicio (className basado en `isValid`). La navegación sí está bloqueada. Verificar que la UX es aceptable o si necesita `disabled={!isValid}` siempre.

### 2. Flujo end-to-end completo del wizard en browser

**Prueba:** Completar el wizard completo desde Step 1 hasta "Guardar OC":
1. Ingresar todos los campos de info general, agregar 1+ productos con cantidad y valor
2. Observar que los totales de cada fila y el FOB Total se actualizan en tiempo real al tipear
3. Click "Continuar a Paso 2" — verificar que los datos aparecen en el resumen read-only
4. Ingresar gastos en cada sección — observar subtotales actualizarse
5. Agregar un ítem en "Otros gastos" con divisa USD
6. Verificar las 3 value cards con valores coherentes (Landed = FOB + Gastos)
7. Click "Guardar OC" — ver toast "OC guardada exitosamente" y redirect al dashboard

**Esperado:** Todo el flujo funciona sin errores de consola, los cálculos son precisos (sin errores de punto flotante), los datos persisten al navegar entre steps.
**Por qué requiere humano:** Estado reactivo multi-componente con sessionStorage, cálculos Decimal en tiempo real, y toast + redirect — requiere browser real.

### 3. Comportamiento de redirect al recargar en ?step=2

**Prueba:** Completar Step 1 y navegar a Step 2. Luego recargar la página (F5) estando en /importador/oc/nueva?step=2.
**Esperado:** La página debe redirigir automáticamente a /importador/oc/nueva?step=1 (sessionStorage sobrevive la recarga pero el useEffect debe detectarlo).

**NOTA:** Este comportamiento es sutilmente diferente — sessionStorage SÍ persiste entre recargas (a diferencia de una nueva pestaña), por lo que puede que el redirect NO ocurra en este caso. Verificar cuál es el comportamiento real y si es el esperado por el diseño (D-06).
**Por qué requiere humano:** Comportamiento de sessionStorage al recargar vs nueva sesión — el diseño D-06 especifica redirect "si sessionStorage vacío", pero en una recarga simple sessionStorage no se vacía.

---

## Resumen de Gaps

No se encontraron gaps bloqueantes. Todos los must-haves verificables programáticamente pasan. Los 2 ítems en estado INCIERTO (botón disabled y flujo end-to-end) requieren validación en browser.

El anti-patrón `as unknown as` en Step2Form es un warning que viola las convenciones TypeScript strict del proyecto (CLAUDE.md), pero no afecta la funcionalidad. Se recomienda fix antes de Phase 5 cuando se agreguen tipos genéricos más precisos.

---

_Verificado: 2026-05-28T00:00:00Z_
_Verificador: Claude (gsd-verifier)_
