## Objetivo

Rehacer la tasación de Teno como **v12 "Reporte Light"**: estética limpia tipo informe Colliers/JLL (fondo blanco, tonalidades verdes corporativas), con logo OFERTA TERRENOS y QR de verificación pública. Mantener intacta toda la información de contenido y rigor (FMV ≈ 89.420 UF, 5 métodos, comparables con fuentes, SII, glosario, ubicación, mapa satelital).

## Sistema visual (cambio de paleta)

```text
Fondo principal       #FFFFFF
Fondo secundario      #F7FAF7  (paneles, tablas zebra)
Línea divisoria       #E2E8E2
Texto principal       #0F1F17  (casi negro verdoso)
Texto secundario      #5A6B61
Verde primario        #16A34A  (acento principal, KPIs, líneas)
Verde profundo        #065F46  (títulos, headers de tabla)
Verde claro           #DCFCE7  (fondos de chip, highlights)
Ámbar (alertas)       #D97706  (uso mínimo, solo notas)
```

- Tipografía: serif para títulos (DejaVuSerif/Times) + sans para cuerpo (Helvetica).
- Header de cada página: barra superior fina verde profundo `#065F46` + logo OFERTA TERRENOS a la izquierda + folio a la derecha.
- Footer: línea verde 0.5pt + 3 líneas (estándar IVS / emisor / folio + paginación).
- Tablas: header verde profundo con texto blanco, zebra `#F7FAF7`.
- KPIs: tarjetas blancas con borde 1pt verde y barra de acento superior 3pt verde primario.

## Logo OFERTA TERRENOS

Generar SVG vectorial inline en reportlab (no requiere asset externo):
- Marca de hoja/terreno estilizada (triángulo + curva) en `#16A34A`
- Wordmark "OFERTA TERRENOS" en sans bold tracking amplio, negro verdoso
- Tagline "Inteligencia Territorial" en verde profundo, tracking 2pt
- Versión compacta (header, 14mm ancho) y versión grande (portada, 60mm ancho)

## QR de verificación

- Genera QR (lib `qrcode` + Pillow) apuntando a `https://ofertaterrenos.com/tasacion/v/2026-05-16-TENO-V12`
- 2 ubicaciones:
  - **Portada**: QR 28×28mm abajo-derecha con leyenda "Verificar tasación · SHA-256 + blockchain anchor"
  - **Footer de cada página interior**: mini QR 12×12mm a la derecha del folio
- Alineado con feature [Tasación QR + Validator](mem://features/tasacion-qr-validator-blockchain)

## Estructura (11 páginas, mismo contenido)

Reusar el contenido de v11 reescrito sobre el nuevo sistema visual (no overlay sobre el PDF dark; **reconstrucción completa** para coherencia).

1. **Portada** — Hero satelital con overlay verde translúcido, bloque FMV único, rango ±5%, UF/m², logo, QR, sello "IVS 2022".
2. **Resumen Ejecutivo** — 4 KPIs (FMV, Rango, UF/m², Superficie), síntesis metodológica, conclusión del tasador.
3. **Glosario** — Términos IVS (FMV, H&BU, BOV, Cap Rate, etc.) en 2 columnas.
4. **Terreno y Ubicación** — Mapa satelital con polígono normalizado, ficha técnica (superficie, deslindes, accesos, ROL).
5. **Datos SII** — Avalúo fiscal, ROL, destino, último reavalúo (custom edge function, no Firecrawl).
6. **Mercado y Comparables** — Tabla de 6–8 comparables con dirección, sup., precio UF, UF/m², fuente, fecha, link/cita.
7. **Método 1 — Sales Comparison A (E&V)** — fórmula, inputs, peso 25%, resultado 66.500 UF.
8. **Método 2 — Sales Comparison B (Vivax)** — peso 20%, 103.600 UF.
9. **Método 3 — Income Capitalisation** — peso 20%, 93.750 UF.
10. **Método 4 — Cost Approach** — peso 15%, 87.500 UF.
11. **Método 5 — Residual / Desarrollo** — peso 20%, 98.200 UF.
12. **Reconciliación y Conclusión** — Tabla ponderada → FMV 89.420 UF, rango 84.950–93.890, sensibilidad ±10%, firma + QR grande.
13. **Anexo de Fuentes** (ya existente) — links/citas completas.

(13 páginas totales; numeración "Página N de 13".)

## Detalles técnicos

- Script: `/tmp/build_v12.py`, reportlab + qrcode + Pillow + pypdf.
- Reutiliza imagen satelital existente `/tmp/teno_v10/sat.jpg` (o regenera vía mapbox-static si falta).
- Polígono normalizado vía `normalizePolygon` (export a GeoJSON ya disponible en `/tmp/teno_v10/lots.geojson`).
- QR: `qrcode.QRCode(error_correction=ERROR_CORRECT_H)`, módulo verde `#065F46` sobre blanco, padding 2 módulos.
- QA obligatorio: `pdftoppm -jpeg -r 150` de las 13 páginas y revisión visual; validador grep contra strings prohibidos (asking, ROI, Buy, upside, spread, 35.000) usando `/tmp/validate_v11.py`.
- Actualizar `docs/GUIA_TASACION_PROFESIONAL.md`: añadir variante **"Reporte Light"** con paleta blanco/verde como tema oficial alternativo al dark, manteniendo todas las reglas IVS.

## Entregables

- `/mnt/documents/Tasacion_Teno_16052026_v12_light.pdf`
- `/mnt/documents/Tasacion_Teno_16052026_v12_QA.txt` (resumen QA)
- `/tmp/build_v12.py`
- Actualización de `docs/GUIA_TASACION_PROFESIONAL.md` con la variante light y reglas de logo/QR.
- Memoria de proyecto actualizada con la nueva paleta como segunda variante oficial.

## Aspectos fuera de alcance

- No se modifica ningún archivo de `src/` ni componentes de la app.
- No se cambian los números de la tasación ni los pesos de los métodos.
- No se reintroduce ningún precio asking, ROI, spread ni lenguaje de "Buy".
