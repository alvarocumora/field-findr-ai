# QA v20 (estado real)

Verifiqué los dos PDF abiertos. Resultado:

| Elemento | Standard | Extendido | Estado |
|---|---|---|---|
| FMV UF 88.000 + rango 82k–94k | ✅ p.1 y p.4 | ✅ p.1 y p.7 | OK |
| Ficha de predio | ✅ | ✅ | OK |
| Comparables IFC Ruta 5 Sur | — | ✅ p.3 | OK |
| Triangulación 5 métodos | — | ✅ p.3 | OK |
| Due Diligence + Tornado | — | ✅ p.5 | OK |
| **Imagen satelital + polígono KMZ** | ❌ | ❌ | **FALTA** |
| **Galería de fotos del predio** | ❌ | ❌ | **FALTA** |
| **QR de validación embebido** | ❌ (sólo URL texto) | ❌ | **FALTA** |
| **Link validador + SHA-256 visible** | parcial (URL plano) | parcial | **FALTA** |
| Chart evolución mercado 2023–26 | — | ❌ | **FALTA** |
| Páginas reales | 4 (no 11) | 7 (no 16) | reducido |

**Bug visual crítico**: el header `OFERTA TERRENOS · VALUATION` y los títulos H1 (`Informe de Valor Comercial`, `Conclusión`, `Comparables`) renderizan con kerning roto — la `O` parece `0`, la `I` queda separada (`Inform e`). Es un problema del Helvetica-Bold de ReportLab al mezclar con el carácter `·` y con el espaciado extra que aplica el script. Hay que regenerar con una TTF embebida (Inter o Manrope) o ajustar `setCharSpace(0)` y no usar `·` en H1.

El script `/tmp/build_v20.py` ya no existe, así que cualquier corrección parte de un generador nuevo `build_v21.py`.

# Plan v21 — "FMV 88.000 + verificable + visual"

## 1. Generador único y reproducible
- Nuevo `/tmp/build_v21.py` con dos salidas: `..._v21_standard.pdf` (11 pág) y `..._v21_extendido.pdf` (16 pág).
- Embeber fuente TTF (Inter Regular/Bold) vía `pdfmetrics.registerFont` para eliminar el kerning roto del Helvetica built-in.
- Marca emisora intacta: **OFERTA TERRENOS · Valuation**, paleta blanco + verde profundo `#0E5A3A` / acento `#1F8A5B` / dorado discreto `#B5894A`.

## 2. Restaurar imagen satelital + polígono (en ambas variantes)
- Stitch ESRI World Imagery z18 alrededor del centroide `-34.83870, -71.10210`.
- Overlay del polígono real extraído de `Teno-3.kmz` (7,07 ha) con vértices P1–P4 etiquetados y norte/escala.
- Página 2 del Standard, página 2 del Extendido.

## 3. Galería de contexto del predio (nueva sección)
- 4 miniaturas en grilla 2×2 con caption: vista aérea, frente a Ruta 5 Sur, polígono sobre ortofoto, contexto regional (mosaico Curicó–Romeral–Molina).
- Las imágenes se generan en el mismo script desde tiles satelitales + un mapa regional anotado con los comparables (reutiliza la matriz que ya está).
- Standard: 1 página (pág. 6). Extendido: 2 páginas (pág. 9–10) ampliando a 8 thumbnails con los comparables IFC.

## 4. Bloque de validación pública + QR
Nueva sección final fija en ambos PDF, **antes** del bloque "Certificación":
- QR (200×200 pt) generado con `qrcode[pil]` apuntando a `https://ofertaterrenos.com/tasacion/v/2026-05-18-TENO-V21`.
- Junto al QR:
  - URL completa en mono.
  - `SHA-256 (payload)` y `SHA-256 (PDF final)` en mono, truncados `abcd1234…ef56`.
  - Folio único + fecha emisión + vigencia 180 días.
  - Nota: *"Escaneá para validar autenticidad en el portal público OFERTA TERRENOS"*.
- El cálculo del SHA-256 del PDF final se hace en dos pasadas: se construye PDF sin hash final → se calcula SHA → se reinyecta texto en la página de validación y se reescribe.

## 5. Chart evolución de mercado (sólo extendido)
- Línea 2023–2026 UF/m² para "Con IFC vigente" vs "Sin IFC" en el corredor Ruta 5 Sur, marcando el punto Teno @ 1,245 UF/m².
- Página 12 del extendido.

## 6. Mejoras de diseño transversales
- Banda verde superior continua de 28 pt con wordmark + folio (sin spacing roto).
- Footer 3 líneas: marca · folio + emisión + vigencia · SHA-256 corto del PDF.
- Tipografía: Inter 9/10/22 (body/secundario/H1), interlineado 1.35.
- Tablas con filas alternadas `#F4F8F5`, encabezado verde `#0E5A3A` texto blanco.
- Callouts FMV con borde superior dorado 2pt.

## 7. QA obligatoria antes de entregar
- `pdftoppm -r 150` de cada página de ambos PDF.
- Checklist: kerning correcto, satelital visible, QR escaneable (probar decode con `zbarimg`), FMV 88.000 presente, galería con 4/8 imágenes sin cortes, footer con SHA correcto, total 11 / 16 páginas.
- Validar con `grep` que NO aparezcan `Adelphos`, `Field-Findr`, `ROI`, `asking`, `spread`, `upside`.

## Entregables
- `/mnt/documents/Tasacion_Teno_18052026_v21_standard.pdf` (11 pág)
- `/mnt/documents/Tasacion_Teno_18052026_v21_extendido.pdf` (16 pág)
- `/tmp/build_v21.py` (generador canónico, reemplaza a v20)

## Detalles técnicos
- Stack: `reportlab`, `Pillow`, `matplotlib`, `qrcode[pil]`, `requests` (tiles ESRI), `hashlib`.
- Fuente Inter: descargar TTF a `/tmp/fonts/Inter-{Regular,Bold}.ttf` (Google Fonts), registrar en ReportLab.
- Polígono: parsear `Teno-3.kmz` ya existente; proyectar lon/lat → píxeles del mosaico ESRI (Web Mercator z18) → overlay PIL.
- QR: `qrcode.make(url, box_size=10, border=2)` → PNG en memoria → `Image` reportlab.
- Hash en dos pasadas para que el SHA-256 impreso coincida con el PDF entregado: render → SHA del buffer → reescribir página de validación → guardar definitivo.
