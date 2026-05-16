
# Tasación Teno v6 — Editorial Premium

Reemplazo total del lenguaje visual del PDF (actualmente bloques planos tipo "salida de IA") por un dossier comercial editorial premium tipo Sotheby's / Engel & Völkers Commercial, con la portada como pieza épica de venta.

## Resultado esperado

- Archivo: `/mnt/documents/Tasacion_Teno_16052026_v6_editorial.pdf`
- 6–7 páginas A4 vertical, márgenes generosos
- Valor comercial: **UF 99.000** (UF 1,39 / m²) — alineado al comparable de 52.800 m² (UF 1,48/m²) con leve castigo por estar interior respecto a Ruta 5

## Lenguaje visual (Editorial Premium)

**Paleta**
- Negro carbón `#0E0E0E` (titulares y barras)
- Beige hueso `#EFEAE1` (fondo páginas interiores)
- Champagne / dorado mate `#B8945A` (líneas finas, KPIs, marca)
- Gris piedra `#6B6B6B` (texto secundario)
- Blanco roto `#FAF8F4` (cajas de cifras)

**Tipografía**
- Display: **Cormorant Garamond** (serif, light, tracking abierto) para titulares y valor
- Texto: **Inter Light** para cuerpo y tablas
- Caps con letter-spacing 0.25em para etiquetas de sección

**Reglas de composición**
- Foto satelital ESRI a sangre cubriendo toda la portada (sin marcos)
- Overlay vertical degradado negro 0→70% solo en la mitad inferior
- Numeración de páginas romana en pie (II, III, IV…)
- Línea filete dorada 0.3pt como único divisor entre secciones
- Cero gradientes verde→azul, cero íconos emoji, cero cajas de colores planos
- Cifras grandes en serif (cuerpo 48–72pt) como protagonistas

## Estructura del dossier

**I — Portada épica (full bleed)**
- Foto satelital ESRI a sangre completa
- Esquina sup-izq: monograma "OT" en dorado + línea + "OFERTA TERRENOS · DIVISIÓN TASACIONES"
- Centro-inferior: "TENO" en Cormorant 96pt blanco + "Valle Central · Región del Maule" en caps tracked
- Pie: "INFORME DE TASACIÓN COMERCIAL · MAYO 2026 · DOCUMENTO CONFIDENCIAL"
- Sin caja de precio en portada (eso va dentro, página de Valor)

**II — Resumen ejecutivo** (una sola página, mucho aire)
- Cifra protagonista: **UF 99.000** en Cormorant 84pt
- Tres KPIs en columna: Superficie 7,11 ha · UF/m² 1,39 · Multiplicador IFC 1,9×
- Párrafo editorial de 4 líneas sobre la oportunidad

**III — La propiedad**
- Foto satelital media página + ficha técnica a dos columnas (Rol, sup, deslindes, IFC, urbanización, accesos)

**IV — Contexto de mercado** (tabla rediseñada)
- Comparables reales con tipografía editorial, sin headers de color, solo filete dorado
- Incluir los dos comparables reales aportados por el cliente:
  - Pío XI 505 · 52.800 m² · UF 78.000 · UF 1,48/m² · Vivax (con foto satelital miniatura)
  - Ruta 5 Sur / J-55 · 154.700 m² · UF 147.000 · UF 0,95/m² · Engel & Völkers
  - + 4 referencias del sector Teno/Curicó industrial
- Columna "Ajuste vs. Teno" explicando por qué cada uno lo posiciona

**V — Análisis de valor**
- Tres escenarios en tipografía editorial (no cajas):
  - Conservador UF 85.000 — venta directa pa ño sin desarrollo
  - **Central UF 99.000** — valor comercial recomendado (resaltado dorado)
  - Optimista UF 120.000 — loteo terminado con IFC ejecutado
- Justificación del valor central referenciando comparables III y IV

**VI — Fundamentos del valor**
- 4 pilares en cuadrícula 2×2 con número romano:
  - I. Ubicación estratégica Valle Central
  - II. IFC aprobado vigente
  - III. Escala y forma del paño
  - IV. Liquidez del mercado de paños subdivididos

**VII — Condiciones y firma**
- Metodología, supuestos, vigencia 90 días, limitaciones
- Bloque firma: Field-Findr AI · Departamento de Tasaciones
- QR de validación (si la función ya existe en el código actual)
- Pie con número de informe y hash SHA-256

## Cambios técnicos

- Nuevo script `/tmp/genTenoV6.ts` (no toca `src/lib/tasacionPdfGenerator.ts`, que sigue sirviendo al flujo dentro de la app)
- Cargar fuentes Cormorant + Inter vía `jsPDF.addFont` desde Google Fonts API (descarga a `/tmp/fonts/` y embeber TTF)
- Reutilizar el mosaico ESRI ya generado en v4/v5 (cacheado en `/tmp/teno_satellite.jpg`)
- Para los comparables con foto: fetch de tile ESRI 1×1 z16 centrado en cada coordenada (Pío XI 505 Teno, Ruta 5 / J-55 Teno)
- QA obligatorio: pdftoppm 150 DPI sobre las 7 páginas, verificar sin overlaps, sin texto cortado, sin cajas de color residuales del estilo viejo

## No incluido (fuera de alcance)

- No cambia el generador en producción (`src/lib/tasacionPdfGenerator.ts`) — eso queda para una iteración separada si te gusta el resultado
- No re-parsea el KMZ (se reutilizan datos del v4/v5)
- No agrega nuevos planos PDF anexos
