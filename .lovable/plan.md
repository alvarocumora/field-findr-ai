## Objetivo

Reorganizar el formato del informe de tasación tomando como referencia la estructura y tablas del PDF Adelphos (René Díaz Mesa, 2016), conservando los diferenciales OFERTA TERRENOS (5 métodos IVS, comparables con link, QR validador, mapa satelital con polígono, glosario y anexo de fuentes).

Versión nueva: **v13 — Reporte Profesional (Adelphos-style)**.

## Diagnóstico del formato actual (v12)

- Logo grande y descentrado en la portada, sin header consistente en páginas interiores.
- KPIs y bloques de color compiten con el contenido tabular → se ve "marketing", no "tasación".
- Secciones flotan sin numeración ni ficha técnica continua.
- Tablas con anchos variables y celdas vacías sin tratar.

## Referencia Adelphos (lo que copiamos)

1. **Portada sobria:** título "INFORME DE TASACIÓN" arriba, nombre del predio, propietario + RUT, solicitante + RUT, foto hero, mes/año.
2. **Header continuo** con identificación del predio en cada página interior.
3. **Fichas técnico-legales** en tablas 2x2 (etiqueta-valor | etiqueta-valor) con fondo gris claro en headers.
4. **Secciones numeradas y rotuladas** en mayúsculas: UBICACIÓN / SECTOR / NORMATIVA VIGENTE / PROPIEDAD / EDIFICACIONES / VALOR DE MERCADO / MÉTODOS / PLANOS / AVALÚO FISCAL / FOTOGRAFÍAS.
5. **Tabla de valor de mercado** con columnas ITEM, ROL, S.MUN., m², $/m², UF/m², Total UF.
6. **Firma del tasador** + declaración de responsabilidad al cierre del bloque de valor.
7. **Planos de ubicación** dedicados (loteo + emplazamiento general + foto aérea).

## Lo que mantenemos de OFERTA TERRENOS

- Paleta blanco + verde corporativo (#16A34A / #065F46).
- Logo OFERTA TERRENOS vectorial.
- 5 métodos IVS con fórmula, inputs, peso (E&V, Vivax, Income, Cost, Residual).
- Anclaje único FMV + rango ±5%, sin asking/ROI/BUY.
- QR de verificación → `/tasacion/v/:folio` + hash SHA-256.
- Mapa satelital Mapbox con polígono normalizado.
- Glosario IVS + Anexo de fuentes con links.

## Estructura final v13 (14 páginas)

```
P1  Portada              Logo header · Título · Predio · Propietario · Solicitante · Foto hero · Fecha · Folio · QR
P2  Ficha técnico-legal  Identificación + Rol SII + CBR + Avalúo + Destino  (tabla 2x2)
P3  Sector y Normativa   Descripción del sector + tabla normativa (DL 3.516 / PRC)
P4  Propiedad            Deslindes (N/S/E/O con metros) + Superficie + Topografía + Servicios
P5  Plano de ubicación   Mapa loteo + emplazamiento general (2 mapas)
P6  Vista satelital      Mapbox Z18 con polígono dorado + tabla vértices WGS84
P7  Valor de mercado     Tabla ITEM/ROL/m²/UF/m²/Total UF + KPI FMV + rango ±5% + firma tasador
P8  Justificación valor  Síntesis 5 métodos con peso + dispersión + atributos
P9  Métodos 1-3          Sales Comp A, Sales Comp B, Income (fórmula + inputs + fuente + peso)
P10 Métodos 4-5          Cost, Residual (fórmula + inputs + fuente + peso)
P11 Comparables          Tabla ≥6 comparables con ubicación, m², UF, UF/m², fuente + link, fecha
P12 Avalúo fiscal SII    Captura/datos sii-lookup: rol, avalúo terreno/construcción, destino
P13 Glosario + Supuestos IVS 2022, alcance, limitaciones, vigencia 90 días
P14 Anexo de fuentes     Links de los 5 métodos + comparables + disclaimers + QR + hash
```

## Sistema visual nuevo

- **Header (todas las páginas interiores):** banda blanca de 18mm con logo OFERTA TERRENOS izquierda (28x10mm), título de sección centro, folio + página derecha. Línea verde 0.5mm bajo el header.
- **Footer:** "OFERTA TERRENOS · Tasación Comercial IVS 2022 · Folio YYYY-MM-DD-PREDIO-V13 · Pág N de TOTAL".
- **Tablas tipo ficha:** 4 columnas (label-valor-label-valor), header en `#065F46` con texto blanco, filas alternadas blanco/`#F7FAF7`, bordes `#E2E8E2`.
- **Tipografía:** Helvetica-Bold para etiquetas y headers (8pt), Helvetica para valores (9pt), DejaVuSerif-Bold para títulos de sección (12pt mayúsculas con tracking).
- **Bloque FMV:** caja verde `#DCFCE7` con borde `#16A34A`, una sola línea grande con FMV en UF y rango ±5% debajo. Sin "$/m² CLP" en portada (queda en sección de valor).

## Logo

Mantener el SVG vectorial actual (verde) pero re-proporcionar: icono 8mm + wordmark 20mm + tagline 6mm en una sola línea horizontal. Si el usuario sube un PNG/SVG oficial, lo reemplazamos en `src/assets/`.

## Implementación técnica

- Nuevo generador canónico `/tmp/build_v13.py` (reportlab + qrcode + Pillow + pypdf) clonado desde v12.
- Helpers nuevos: `header(doc, section_title)`, `fact_table(rows_2x2)`, `value_table(items)`, `method_card(name, formula, inputs, source, weight)`.
- Reutiliza `/tmp/teno_v10/sat.jpg` y `lots.geojson`; descarga 2do mapa de emplazamiento general (Mapbox Z13).
- QA: `pdftoppm -jpeg -r 150` → revisión página por página + validador grep contra términos prohibidos (asking, ROI, BUY, spread, upside).
- Actualiza `docs/GUIA_TASACION_PROFESIONAL.md` agregando sección "12.1 Variante Adelphos-style v13" con las reglas del header continuo, fichas 2x2 y orden de páginas.
- Output: `/mnt/documents/Tasacion_Teno_16052026_v13_adelphos.pdf`.

## Fuera de alcance

- No se cambian números, pesos, FMV ni metodologías de cálculo (lo de v12 permanece).
- No se tocan archivos de `src/` (es solo el generador PDF + la guía .md).
- No se agrega precio de transacción / asking.
