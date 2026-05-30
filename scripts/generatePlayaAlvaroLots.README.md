# Playa Álvaro — Pipeline de ingesta KMZ

Fuente: `PLAYA ALVARO1.kmz` (286 placemarks, 87 lotes LOTE-1..87).

## Estructura del KMZ

Carpetas anidadas (estilo AutoCAD Civil 3D export):

- `Folder AECC_PARCEL [HEX]` — un parcel por lote
  - `Placemark LOTE-XX` (Point — centroide)
  - `Placemark X.XXHA` (Point — label superficie)
- `Folder AECC_PARCEL_SEGMENT [HEX]` — bordes asociados
  - 79 contienen 1 sola `LineString` de 2 puntos (1 arista)
  - 8 contienen entre 30 y 84 `LineString` (perímetros completos de macroregiones)

Polygonización planar (Shapely `polygonize` sobre 509 aristas) sólo cierra 9/87 celdas porque el export tiene tramos faltantes. Por eso usamos:

- **Centroides + radio estimado** para overlay circular por lote (lots.ts)
- **8 anillos macro** del KMZ (macros.ts) para sectorizar matriz + áreas grandes
- **509 aristas raw** (edges.ts) como malla visual de la subdivisión sobre el mapa
- **POIs LOTE A / LOTE C** (pois.ts) como macrolotes referenciales

## Archivos generados

```
src/pages/playaAlvaro/data/
  ├── project.ts   (metadata: center, bounds, 87 lotes, 400.45 ha)
  ├── lots.ts      (87 PaLot con centroid + area_ha + price_uf + status)
  ├── macros.ts    (8 anillos macro)
  ├── edges.ts     (509 LineStrings perímetro)
  └── pois.ts      (2 POIs: LOTE A, LOTE C)
```

## Re-generar

El parser vive como Python ad-hoc en el historial de Lovable (paquete: `shapely` + `re`).
Si el KMZ cambia, pedir a Lovable: "regenerar datos Playa Álvaro desde el KMZ" y se ejecutará la misma pipeline.

## Precios placeholder

`price_uf = 800 + 250 * area_ha` — fórmula provisional. Ajustar manualmente en `lots.ts` o re-correr el script con tabla real.
