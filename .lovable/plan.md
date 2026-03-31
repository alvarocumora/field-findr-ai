

# Plan: Imagen Satelital Funcional + Mejoras Sistema 3D

## Diagnóstico Root Cause

Los logs confirman que la textura satelital SÍ se carga (`Satellite UV: { zoom: 18, tileMeters: 125, planeSize: 220 }`), pero el problema es matemático:

- Un tile a zoom 18 cubre ~125m x 125m
- El plano 3D del lote mide ~220m (2.5x el bounding box del lote)
- `repeatVal = 1.75` hace que la textura se **repita** con `RepeatWrapping`, mostrando costuras y bordes incorrectos
- El offset UV calcula la fracción dentro del tile, pero al repetir un solo tile la imagen se ve como un color uniforme o patrón incorrecto

**Solución**: Componer un canvas con una **grilla de tiles 3x3** centrada en el lote, creando una textura stitched de ~375m x 375m que cubre todo el plano sin repetición.

---

## Cambio 1: Stitched Satellite Texture (RealisticTerrain.tsx)

Reemplazar `loadSatelliteTexture` (que carga 1 tile) por `loadStitchedSatelliteTexture`:

1. Calcular tile central (tileX, tileY) del centroide del lote a zoom 18
2. Cargar 9 tiles (3x3 grid): `[tileX-1..tileX+1] x [tileY-1..tileY+1]`
3. Dibujar los 9 tiles en un canvas de 768x768 (256x3 por lado)
4. Calcular UV offset/repeat para que el centro del canvas = centro del lote GPS
5. Usar `ClampToEdgeWrapping` en vez de `RepeatWrapping` para evitar costuras
6. Fallback: si algún tile falla, se deja transparente (parcialmente visible)

```text
Cobertura: 3 tiles x 125m = ~375m por lado
Lote típico: 60-150m → siempre cubierto con margen
Resolución: 768px / 375m ≈ 2px/m (suficiente para ver vegetación)
```

## Cambio 2: UV Mapping Correcto

- `texture.repeat = [planeSize / (3 * tileMeters), planeSize / (3 * tileMeters)]`
- `texture.offset` calculado desde la fracción del tile central dentro de la grilla 3x3
- Wrapping: `ClampToEdgeWrapping` para que los bordes se estiren en vez de repetir

## Cambio 3: Canvas Background y Loading (ParcelaDesigner3D.tsx)

- Fix warnings de THREE.Color: cambiar `rgba(255,255,255,0.08)` a `#141414` (hex sin alpha)
- Mejorar loading state: mostrar progreso "Cargando 3/9 tiles..." durante la composición

## Cambio 4: Modelos 3D Pre-cargados en el Catálogo

El catálogo actual solo tiene "Sin modelos" y un botón de upload. Agregar modelos GLB gratuitos integrados usando URLs públicas de repositorios de modelos 3D open-source:

**En `AssetCatalog.tsx`**, agregar array `BUILT_IN_ASSETS` con modelos empaquetados:

| Categoría | Modelos | Fuente |
|-----------|---------|--------|
| Casas | Casa moderna, Cabaña, Tiny House | Primitivas mejoradas (ya existen en ParcelaObjects) |
| Vegetación | Pino, Araucaria, Arbusto, Césped | Primitivas 3D generadas con geometría |
| Mobiliario | Mesa picnic, Fogata, Quincho, Piscina | Primitivas 3D mejoradas |
| Vehículos | Auto, Camioneta | Primitivas existentes |
| Infraestructura | Cerca, Portón, Poste eléctrico, Camino | Nuevas primitivas |

Estos modelos usan las primitivas de `ParcelaObjects.tsx` que ya existen (casa moderna, cabaña, piscina, etc.) pero se exponen como items clicables en el catálogo en vez de requerir que el usuario los busque.

## Cambio 5: Catálogo Visual con Thumbnails

Transformar el catálogo de "Sin modelos" vacío a una grilla visual:
- Cada built-in asset se muestra como un botón con icono emoji + nombre
- Click coloca el objeto en modo "click para posicionar"
- Los assets GLB subidos se muestran debajo con icono de cubo 3D

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/parcela/RealisticTerrain.tsx` | Reescribir carga de textura: 3x3 tile stitching, ClampToEdge, UV correcto |
| `src/components/parcela/ParcelaDesigner3D.tsx` | Fix rgba warnings en Grid colors, loading mejorado |
| `src/components/parcela/AssetCatalog.tsx` | Agregar BUILT_IN_ASSETS con modelos primitivos pre-cargados |

## Resultado Esperado

1. Al abrir el diseñador 3D, se ve la imagen satelital real (vegetación, caminos, terreno) como base del diseño
2. El catálogo muestra ~15 objetos pre-cargados organizados por categoría, listos para colocar con un click
3. Sin warnings de THREE.Color en consola

