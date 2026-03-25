

# Plan: Motor de Planificación 3D Georreferenciado con Catálogo de Assets GLTF

## Estado Actual

El sistema ya tiene una base sólida:
- R3F + Three.js + drei con 32 objetos procedimentales
- Terreno realista via Mapbox Terrain-RGB (64x64 heightmap)
- Simulación solar, medición, undo/redo, snap grid
- Detección de colisiones y modos de vista (orbit/top/pedestrian)
- TransformControls de drei (parcialmente integrados)

## Mejoras Propuestas (3 fases)

### Fase 1: Terreno Georreferenciado de Alta Resolución

Mejorar `RealisticTerrain.tsx`:
- Aumentar resolución de 64x64 a 128x128 para mayor fidelidad topográfica
- Recortar (clip) la malla del terreno al polígono exacto del lote usando `ShapeGeometry` + displacement
- Cargar tiles adyacentes para cubrir el área completa si el lote es grande
- Agregar sombras de terreno con `receiveShadow` mejorado
- Mostrar elevación base real en el UI (ej: "Elevación: 245m")

Mejorar `ParcelaDesigner3D.tsx`:
- Calibrar coordenadas: convertir GPS → local con `proj4` (ya se hace manualmente, formalizar con constantes)
- Snap de objetos a la altura del terreno (Y) automáticamente via raycasting contra la malla

### Fase 2: Catálogo de Assets GLTF/GLB

Nuevo archivo `src/components/parcela/GLTFAssetLoader.tsx`:
- Componente que usa `useGLTF` de drei para cargar modelos GLB desde Storage
- Previsualización thumbnail en el catálogo (renderizado como imagen estática)
- Sistema de fallback: si no hay GLB, usar el objeto procedural existente

Nuevo archivo `src/components/parcela/AssetCatalog.tsx`:
- UI mejorada del catálogo con tabs por categoría, thumbnails, y búsqueda
- Drag & drop visual: al arrastrar un item del catálogo, muestra ghost preview
- Indicador de "arrastra al terreno"

Ampliar `useParcelaState.ts`:
- Nuevo tipo `glb_custom` en `ParcelaObjectType` para modelos GLTF externos
- Campo `modelUrl?: string` en `PlacedObject` para referenciar el GLB
- Campo `modelName?: string` para identificación

Storage: Crear bucket `3d-assets` para almacenar modelos GLB subidos por el admin

### Fase 3: Interacción de Diseño Profesional

Mejorar `ParcelaDesigner3D.tsx`:
- Integrar `TransformControls` de drei correctamente (ya existe parcialmente) con switch entre translate/rotate/scale via teclas Q/W/E
- Raycasting para snap automático al terreno en Y al mover objetos
- Outline shader en objeto seleccionado (usando `Outlines` de drei)
- Panel de propiedades del objeto seleccionado (posición, rotación, escala, nombre)

Nuevo archivo `src/components/parcela/ObjectPropertiesPanel.tsx`:
- Panel lateral que muestra/edita propiedades del objeto seleccionado
- Inputs numéricos para posición X/Y/Z exacta
- Slider de rotación 0-360°
- Botones de alineación (centrar en lote, alinear a borde)

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/components/parcela/RealisticTerrain.tsx` | Modificar - terreno 128x128, clip a polígono, snap Y |
| `src/components/parcela/GLTFAssetLoader.tsx` | Crear - cargador dinámico de modelos GLB |
| `src/components/parcela/AssetCatalog.tsx` | Crear - catálogo visual con drag & drop |
| `src/components/parcela/ObjectPropertiesPanel.tsx` | Crear - panel de propiedades |
| `src/components/parcela/ParcelaDesigner3D.tsx` | Modificar - gizmos, raycasting, outline |
| `src/components/parcela/useParcelaState.ts` | Modificar - soporte GLB, modelUrl |
| Migración SQL | Bucket `3d-assets` para modelos GLB |

## Nota sobre CesiumJS

CesiumJS es una alternativa potente pero su bundle es de ~30MB y requiere workers dedicados, lo cual no es viable en el entorno Lovable. El enfoque con Mapbox Terrain-RGB + Three.js ya proporciona terreno real georreferenciado y es significativamente más liviano. Se mantiene este stack.

## Limitaciones Honestas

- Los modelos GLB deben ser proporcionados/subidos por el usuario (no se incluye una biblioteca precargada de cientos de modelos)
- La precisión del terreno depende del zoom level de Mapbox (zoom 14 = ~10m/pixel)
- No se implementa calibración manual tipo "arrastrar punto GPS a pixel" (demasiado complejo para esta iteración)

