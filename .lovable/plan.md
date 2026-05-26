# Regeneración del masterplan con el KMZ real de Lote B

## Contexto
El KMZ `LOTE_B.kmz` contiene el polígono real del predio:
- 81 vértices de perímetro
- Bounding box: lon `-73.8298 … -73.7834`, lat `-40.7317 … -40.7067`
- Superficie real: **≈ 420 ha** (no 1.820 ha como estaba estimado)

El perímetro actual en `scripts/generateHuellelhueLots.ts` es una aproximación de 12 vértices que no coincide con la geometría real. Hay que reemplazarlo por el polígono exacto del KMZ y volver a generar los lotes alineados a la costa real frente a Playa Rada de Ranú.

## Pasos

1. **Extraer el perímetro real del KMZ**
   - Parsear `user-uploads://LOTE_B.kmz` (copiar a `/tmp`, descomprimir, leer `doc.kml`).
   - Guardar los 81 vértices `[lng, lat]` como `PERIMETER_LNGLAT` en `scripts/generateHuellelhueLots.ts`.
   - Recalcular centroide y bearing dominante de la costa (ajuste de rotación de bandas) a partir del propio polígono.

2. **Reescribir el generador (`scripts/generateHuellelhueLots.ts`)**
   - Mantener el `gridSubdivide` con test punto-en-polígono usando el nuevo perímetro de 81 vértices.
   - Recalibrar el conteo de lotes a la superficie real (~420 ha, no 1.820):
     - Ocean Front: ~20 lotes (~1 ha)
     - Forest Ocean: ~55 lotes (~0,6 ha)
     - Bosque Vivo: ~40 lotes (~0,55 ha)
     - 3–4 Macrolotes (Eco Lodge, Wellness, Glamping, Gastronomy)
     - Reserva Núcleo en el sector interior con mayor pendiente/distancia a costa
   - Calcular el bearing de las bandas como la orientación promedio del tramo costero del polígono (los vértices del lado oeste), no un −39° fijo.

3. **Regenerar `src/pages/huellelhue/data/lots.ts`**
   - Ejecutar `bun scripts/generateHuellelhueLots.ts` para reescribir `HUELLELHUE_DATA` con el GeoJSON real.
   - Actualizar el `center` exportado al centroide real del KMZ.

4. **Ajustar la ficha y totales en la UI**
   - En `HueMasterplan.tsx`, `HueFicha.tsx` y cualquier copy donde aparezca "1.820 ha", cambiar a la superficie real (~420 ha) y al nuevo desglose de lotes.
   - Verificar que el `fitBounds` del mapa Mapbox use los nuevos bounds del polígono.

5. **Verificación**
   - Abrir el preview, comprobar visualmente que el polígono y los lotes encajan con la costa de Rada de Ranú.
   - Confirmar totales (cantidad de lotes y hectáreas) en consola al final del script.

## Notas técnicas
- El KMZ original queda como referencia en `/tmp/kmz/`; no se copia al repo (es un dato de origen, no asset web).
- No se toca la arquitectura del sitio ni los assets visuales — sólo geometría, conteos y copys numéricos.
- No se modifica `src/integrations/supabase/*` ni rutas existentes.
