## Objetivo

Regenerar los **62 PDFs** del data room (43 LUC Due Diligence + 19 Uso de Fondos) con identidad visual profesional y co-branding **Forestal Valle Escondido** (emisor) + **OFERTA TERRENOS** (plataforma/IR), incluyendo logos SVG diseñados ad-hoc.

## 1 · Diseño de logos (SVG vectorial)

Dos marcas escalables, embebibles tanto en PDF (vía reportlab `drawing`) como en la web:

**Forestal Valle Escondido** — `src/assets/brand/fve-logo.svg`
- Monograma: rombo dorado (`#C9A84C`) con una "V" angular de árbol estilizado dentro.
- Wordmark: "FORESTAL · VALLE · ESCONDIDO" en serif (DM Serif Display fallback Times), tracking ancho.
- Tagline opcional: "Master Loteo La Palmilla · Región del Maule".
- Versiones: full color sobre fondo claro, knockout blanco sobre fondo forest (`#1F3D2B`), y monograma solo.

**OFERTA TERRENOS · Investor Relations** — `src/assets/brand/ot-logo.svg`
- Monograma: hexágono verde gradient (`#22C55E` → `#0EA5E9`, paleta marketplace del Core Memory) con una "O" geométrica.
- Wordmark: "OFERTA TERRENOS" sans-serif geométrico (Space Grotesk fallback Helvetica) + sublabel "Investor Relations" en caps tracking.
- Versiones: full color, knockout, monograma.

Los dos logos co-existen en cada PDF como **lockup**: FVE arriba-izquierda (emisor del documento), OT abajo-derecha en footer (plataforma que respalda).

## 2 · Generador PDF profesional unificado (`/tmp/gen_pdf_v3.py`)

Reemplaza `gen_luc_v2.py` y `gen_uso_fondos.py` con un solo motor que produce ambas familias usando un layout coherente.

**Layout cover (página 1):**
- Banda superior `#1F3D2B` 30% alto con logo FVE knockout + número de documento (DOC NN/43 ó UF NN/19).
- Título en serif 36pt sobre fondo crema (`#F5F1E8`).
- Subtítulo con categoría LUC / partida.
- **KPI Box** dorado: monto (CLP/EUR), % facilidad, naturaleza (CAPEX/OPEX), mapeo LUC.
- Bloque "Emisor" con datos legales (Forestal Valle Escondido SpA, RUT, Gerente, Domicilio).
- Footer cover: logo OT lockup + URL `ofertaterrenos.com/forestal-valle-escondido` + fecha emisión + SHA-256 del PDF (auto-calculado y reinyectado).

**Layout páginas interiores:**
- Header reducido: rombo dorado + "FORESTAL VALLE ESCONDIDO · DOC NN" + número de página.
- Cuerpo de dos columnas: meta-card lateral (categoría, nivel, naturaleza, monto si aplica) + flujo principal con headings, viñetas, bloques "Nota" y "Cómo entregar".
- Footer fijo en cada página: línea dorada + "Confidencial · OFERTA TERRENOS · Investor Relations" + paginación.

**Mejoras técnicas:**
- Render del SVG con `svglib` + `reportlab.graphics` (sin depender de Inkscape).
- Tipografías: registro de Noto Serif (serif) y Noto Sans (sans) vía `pdfmetrics.registerFont` para evitar cajas negras en acentos.
- Metadata XMP completa: Title, Author=Forestal Valle Escondido SpA, Subject=LUC Financing DD, Keywords con categoría, Creator=OFERTA TERRENOS · IR.
- Marca de agua diagonal sutil "BORRADOR · NO VINCULANTE" en gris 8% sobre páginas internas (configurable por item).

## 3 · Pipeline de regeneración

```text
1. Exportar /tmp/luc.json y /tmp/uso_fondos.json desde TS  (bun export script)
2. /tmp/gen_pdf_v3.py --kind luc --json /tmp/luc.json --out public/dd-luc/
3. /tmp/gen_pdf_v3.py --kind uf  --json /tmp/uso_fondos.json --out public/dd-luc/uso-fondos/
4. Recalcular sha256 de los 3 archivos del bundle UF
5. Reempaquetar uso-fondos-respaldos.zip
6. Actualizar BUNDLE_FILES[].sha256 en FveUsoFondos.tsx
7. QA visual: pdftoppm de muestras (01, 08-sección, 17, 27, 39-sección) +
   uso-fondos uf-01, uf-09, uf-17 → inspección de cover, logos, kpi box,
   página interior, footer, watermark
```

## 4 · Uso de los logos en la web (bonus)

Reemplazar el rombo dorado actual en `FveNav.tsx` por el monograma FVE SVG inline (mantener color por currentColor para que respete dark/light). Sin tocar lógica de scroll ni layout.

## 5 · QA y entregables

- 62 PDFs regenerados en `public/dd-luc/**`.
- 2 logos en `src/assets/brand/`.
- Script canónico en `/tmp/gen_pdf_v3.py` (referencia, no se versiona).
- ZIP + manifest JSON/CSV + CHECKSUMS.txt actualizados.
- Verificación visual obligatoria: cada PDF debe mostrar (a) ambos logos legibles, (b) KPI box sin clipping, (c) acentos y caracteres `↔ · €` renderizados (sin cajas negras), (d) paginación correcta, (e) ningún elemento fuera de la página.

## Detalles técnicos

- Lib: `reportlab` (Platypus + Canvas custom) + `svglib` para SVG → flowable.
- Fuentes: descarga `NotoSerif-Regular/Bold` y `NotoSans-Regular/Bold` desde Google Fonts → registro en VFS reportlab.
- Paleta canónica: forest `#1F3D2B` · forest-deep `#0F2A1D` · gold `#C9A84C` · cream `#F5F1E8` · marketplace-green `#22C55E` · marketplace-blue `#0EA5E9` (estos dos últimos solo para el monograma OT).
- Tamaño A4 (210×297mm), márgenes 18mm.
- Watermark: configurable via campo opcional `borrador: true` en data (default false para no romper expectativa).
- No cambio el schema TS: solo regenero PDFs y agrego dos imports SVG.
