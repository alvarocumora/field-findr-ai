# Plan: Consistencia de Datos del Master Plan

## Problema raiz

Los polígonos se reconstruyen desde LineStrings del KMZ con algoritmos aproximados (polygonize, buffer-hole, etc.), produciendo geometrías imprecisas con gaps de ~10m. No hay distinción entre bordes de lotes y caminos, por lo que la compactación fusiona todo indiscriminadamente.revisar [https://www.lanube360.com/las-cavas-tahona/](https://www.lanube360.com/las-cavas-tahona/)

## Solución: 3 cambios coordinados

### 1. Extraer y renderizar caminos del KMZ como capa separada

**Archivo:** `src/lib/kmz/index.ts`

- Nueva función `extractRoadGeometries(kmlContent)` que identifica LineStrings/placemarks que NO son lotes (nombres sin "Lote", "camino", "acceso", "calle", geometrías abiertas no asignables a lotes)
- Retorna un GeoJSON FeatureCollection de LineStrings para renderizar como capa visual

**Archivo:** `src/components/lots/LotMapView.tsx`

- Nueva capa Mapbox `roads-kmz` (line, color blanco/amarillo, width 3, dash pattern) renderizada debajo de los polígonos de lotes
- Toggle "Caminos" en toolbar admin (activo por defecto)
- Al restaurar/reimportar KMZ, también extraer y guardar las geometrías de caminos en el state del componente

### 2. Compactación segura con restricción de caminos

**Archivo:** `src/components/lots/LotMapView.tsx` (función `handleCompactLots`)

- Antes de snapear un par de vértices, verificar que la línea entre ellos no cruza ningún segmento de camino
- Reducir tolerancia a **0.8m** (vertex-to-vertex) y **1.5m** (vertex-to-segment)
- Agregar dialog de previsualización: "Se ajustarán X vértices en Y lotes. Confirmar?"
- Si no hay caminos cargados, advertir al usuario antes de proceder

### 3. Estandarizar nomenclatura "Lote ##"

**Archivo:** `src/components/lots/LotMapView.tsx`

- En `handleRestoreKmz` y `handleReimportByName`: al asignar polígono, también actualizar `name = 'Lote {N}'` en la BD
- Label del mapa ya usa `['concat', 'Lote:', ['get', 'lot_number']]` -- cambiar a `['concat', 'Lote ', ['get', 'lot_number']]` (espacio en vez de dos puntos)
- En popup hover, usar "Lote {N}" consistente

**Archivo:** `src/components/lots/PlanCompareView.tsx`

- Actualizar label format a `['concat', 'Lote ', ['get', 'lot_number']]`

**Archivo:** `src/components/lots/LotRenumberTool.tsx`

- Al confirmar renumeración, también actualizar `name = 'Lote {N}'`

## Archivos a modificar


| Archivo                                   | Cambio                                                   |
| ----------------------------------------- | -------------------------------------------------------- |
| `src/lib/kmz/index.ts`                    | Nueva función `extractRoadGeometries`                    |
| `src/components/lots/LotMapView.tsx`      | Capa caminos, compactación con restricción, nomenclatura |
| `src/components/lots/PlanCompareView.tsx` | Label format                                             |
| `src/components/lots/LotRenumberTool.tsx` | Name format                                              |


## Flujo esperado

```text
Admin → Restaurar KMZ
  → Polígonos originales restaurados por nombre
  → Caminos extraídos y renderizados como capa
  → Labels muestran "Lote 1", "Lote 2"...
  → Opcionalmente: Compactar (con restricción de caminos)
    → Preview: "12 vértices en 8 lotes, sin cruzar caminos"
    → Solo micro-gaps (<1m) se cierran
  → Resultado: lotes compactos, caminos visibles, tour virtual correcto
```