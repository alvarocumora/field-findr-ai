

# Plan: Fix Satellite Imagery + Mejoras 3D

## Root Cause

Los logs confirman que **9/9 tiles se cargaron correctamente** y la textura se creó. El problema es la **API endpoint**:

- Se usa `/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg` — esta API legacy puede devolver imágenes vacías o con CORS restrictivo en ciertas zonas
- Los tiles `@2x` son de 512x512px pero se dibujan en slots de 256px, perdiendo resolución
- Si el canvas se "tainted" por CORS, THREE.js muestra el mesh sin textura (gris)

## Solución

### 1. Cambiar a Mapbox Static Tiles API (moderna, con CORS)

Reemplazar la URL de tiles de:
```
/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg
```
por:
```
/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}
```

Esta API es la recomendada, tiene CORS correcto, y siempre devuelve imágenes válidas.

### 2. Usar tiles de 512px nativos

Cambiar `TILE_PX` de 256 a 512 para el canvas stitched (1536x1536), duplicando la resolución visual del terreno satelital.

### 3. Agregar debug visual temporal

Si la textura no carga, mostrar un mensaje visible en el canvas con el estado ("Textura cargada: sí/no, tiles: 9/9"). Esto permite confirmar que la textura se aplicó.

### 4. Forzar `texture.needsUpdate` y `colorSpace`

Asegurar que:
- `tex.needsUpdate = true` se llama explícitamente
- `tex.colorSpace = THREE.SRGBColorSpace` para colores correctos (sin esto, satellite puede verse oscuro/lavado)

### 5. Fallback visible

Si después de 5 segundos no hay textura, mostrar un overlay "No se pudo cargar imagen satelital" en lugar de un plano gris silencioso.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/parcela/RealisticTerrain.tsx` | Cambiar URL de tiles, usar 512px, agregar colorSpace, needsUpdate, fallback |
| `src/components/parcela/ParcelaDesigner3D.tsx` | Mostrar estado de textura como overlay cuando falla |

## Resultado Esperado

Al abrir el diseñador 3D con "Relieve Real" activo, se ve inmediatamente la imagen satelital con vegetación, caminos y terreno real como fondo del diseño.

