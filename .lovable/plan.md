

# Plan: Imagen Satelital Georreferenciada + Mejoras 3D

## Problema Root Cause

La textura satelital se carga correctamente (los logs lo confirman), pero el tile de Mapbox a zoom 15 cubre ~5km x 5km. El plano 3D tiene tamaño proporcional al lote (~60-100m), y la textura se mapea con UV estándar (0-1) cubriendo todo el tile. El resultado: el lote ocupa apenas unos pocos píxeles del tile, viéndose como un color uniforme gris/marrón.

## Solución: Tile Centrado con Zoom Alto + UV Offset

### 1. Cargar tile satelital a zoom 18-19 centrado en el lote
- Zoom 18 = ~0.6m/pixel, ideal para ver vegetación, caminos, estructuras
- Cargar múltiples tiles (2x2 grid) si el lote cruza bordes de tile
- Calcular el offset UV exacto para que la textura se alinee con las coordenadas GPS del lote

### 2. UV Remapping en el PlaneGeometry
- Calcular la fracción del tile que corresponde al bounding box del lote
- Aplicar `texture.offset` y `texture.repeat` para que solo la porción relevante del tile se muestre en el plano
- Esto hace que cada metro del terreno 3D corresponda a la posición GPS real

### 3. Fallback a zoom menor si el tile falla
- Si zoom 19 falla (no disponible en zona rural), bajar a 18, luego 17
- Mantener fallback a color verde si todo falla

## Cambios en `RealisticTerrain.tsx`

| Cambio | Detalle |
|--------|---------|
| Zoom satelital | Subir de 15 a 18 (o 19) para resolución de ~1m/pixel |
| UV offset/repeat | Calcular la posición del centro del lote dentro del tile y ajustar `texture.offset`/`texture.repeat` para mapear correctamente |
| Función `lngLatToTileFraction` | Nueva función que retorna tile X/Y + fracción decimal para calcular offset UV |
| Terrain heightmap | Mantener zoom 15 para elevación (suficiente resolución), pero usar zoom 18+ solo para la textura satelital |
| Tamaño del plano | Ajustar para que coincida con el área cubierta por el tile a ese zoom |

## Mejoras Adicionales al Sistema 3D

### 4. Canvas background transparente
- Cambiar el fondo del Canvas de gris default a gradiente cielo coherente con el Sky component
- `<Canvas style={{ background: '#87CEEB' }}>` como fallback visual

### 5. Indicador de carga de textura
- Mostrar "Cargando imagen satelital..." mientras se descarga el tile
- Reemplazar el color verde plano con un skeleton/shimmer

### 6. Contorno del lote más visible
- Aumentar grosor y agregar glow al contorno del polígono del lote
- Color verde neón (#00FF88) con línea duplicada para efecto de borde

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/parcela/RealisticTerrain.tsx` | Zoom 18 para satelital, UV offset/repeat, `lngLatToTileFraction`, indicador de carga |
| `src/components/parcela/ParcelaDesigner3D.tsx` | Background color del Canvas, loading state para terreno |

## Detalle Técnico del UV Mapping

```text
Tile zoom 18: ~256m x 256m por tile
Lote: ~60m x 60m

1. Calcular tile (x, y) + fracción (fx, fy) del centro del lote
2. El plano 3D cubre "size" metros (ej: 150m = 2.5x lote)
3. texture.repeat = [size/tileSizeMeters, size/tileSizeMeters]
4. texture.offset = [fx - repeat.x/2, 1 - fy - repeat.y/2]

Resultado: la imagen satelital se alinea pixel-perfect con el terreno
```

## Resultado Esperado

Al abrir el diseñador 3D, el usuario ve inmediatamente la imagen satelital de alta resolución mostrando vegetación, caminos y relieve real del lote, con el contorno del polígono claramente visible, listo para diseñar sobre terreno real georreferenciado.

