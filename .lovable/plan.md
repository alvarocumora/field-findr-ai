## Objetivo

Generar **v10 — Vista Real + Escenarios Packing** del PDF de tasación del terreno Teno, con:
1. **Vista satelital real** del predio con el **polígono real demarcado** (KMZ oficial, 4 vértices ya en código).
2. **3 escenarios de packing** renderizados como overlays geográficos (footprints de naves, oficinas, patio de camiones, estanques) sobre la **misma imagen satelital**, no como bocetos.

Polígono real ya disponible en `src/pages/PropertyDetail.tsx` (TENO_POLYGON, 4 vértices, ~7 ha).
Centro: `-71.10297, -34.83831`. Token Mapbox disponible (`MAPBOX_PUBLIC_TOKEN`).

## Páginas del PDF (A4, 6 páginas)

```text
1  Portada              · Satelital real + polígono dorado + título y KPIs
2  Predio en contexto   · 2 vistas reales: zoom predio y zoom regional (Ruta 5)
3  Escenario A · Packing Compacto      · 1 nave 80×40 + oficinas + patio
4  Escenario B · Packing + Frío        · 2 naves + cámara frío + estanque
5  Escenario C · Hub Agroindustrial    · 3 naves + báscula + 40 estac. camión
6  Comparativo + Verificación pública  · Tabla m² construible / inversión / QR
```

## Cómo se generan las "vistas reales con polígono"

- Mapbox **Static Images API** estilo `satellite-v9`, 1280×800 @2x.
- Overlay 1: el **polígono real** como `path-5+B5894A-1+B5894A-0.15(geojson)` (encoded polyline o GeoJSON path).
- Overlay 2 (escenarios): cada edificio como **rectángulo geo-referenciado** (4 vértices lng/lat calculados a partir del centroide + rotación del lado largo del predio + dimensiones en metros → grados con factor de latitud).
- Colores por tipo: nave `#3B82F6`, oficinas `#F59E0B`, frío `#10B981`, patio `#64748B`.
- Se descargan vía `requests`, se componen en `reportlab` y se anotan con leyenda + escala gráfica.

## Escenarios (footprints aproximados)

| Escenario | Naves | Oficinas | Frío | Patio camiones | m² techados | % ocupación |
|---|---|---|---|---|---|---|
| A — Compacto | 1 × 80×40 m | 1 × 20×15 m | — | 30×40 m | 3.500 | 5% |
| B — Packing + Frío | 2 × 60×30 m | 1 × 25×15 m | 1 × 30×20 m | 40×40 m | 4.575 | 6,5% |
| C — Hub Agroind. | 3 × 70×30 m | 1 × 30×20 m | 1 × 40×25 m | 50×60 m | 7.900 | 11,3% |

Todos respetan el frente a Ruta 5 (lado largo orientado SW-NE según el polígono real).

## Implementación técnica

- **Archivo nuevo**: `/tmp/teno_v10/gen.py` (igual estilo que `/tmp/teno_v89/gen.py`).
- **Funciones**:
  - `static_satellite(polygon, overlays, w, h)` → bytes JPG de Mapbox.
  - `building_rect(center_lng, center_lat, w_m, h_m, rot_deg)` → 4 vértices GeoJSON.
  - `scenario_overlays(scenario)` → lista de GeoJSON Features con stroke/fill.
- **QA obligatorio**: convertir las 6 páginas a JPG, inspeccionar polígono alineado, edificios dentro del predio, leyendas legibles. Corregir y re-generar si algo se sale.
- **Output**: `/mnt/documents/Tasacion_Teno_16052026_v10_packing_real.pdf`.
- **Sin cambios** en código del proyecto (`src/`). Es un entregable generado por script.

## Riesgos / decisiones abiertas

- Mapbox Static URL tiene límite ~8 KB ⇒ si los 5 overlays de un escenario exceden, se pre-compone el polígono en una sola imagen base y los edificios se dibujan vectorialmente en `reportlab` reproyectando lng/lat al bounding box de la imagen (más limpio visualmente). **Plan A: probar overlays Mapbox; Plan B: dibujo vectorial sobre imagen base**. Voy con Plan B por defecto para máxima nitidez y control tipográfico.
- Si quieres además una **4ª vista cenital "fotorrealista"** (render 3D con naves volumétricas estilo el hero cinemático), se agrega 1 página extra; no incluida por defecto para no inflar.

¿Apruebas que genere v10 con estas 6 páginas y Plan B (imagen satelital real + edificios vectoriales sobre el polígono)?