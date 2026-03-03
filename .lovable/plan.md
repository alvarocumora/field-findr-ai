

# Plan: Sistema de Mapa Estable

## Problemas Identificados

1. **Dependencia circular entre hooks**: `useMapInstance` recibe `onStyleLoaded` que llama a `layersHook.addInfoLayers()`, pero `layersHook` se define despues de `useMapInstance`. Esto causa que la referencia sea stale o undefined en el primer render.

2. **Recreacion excesiva de marcadores**: En `useMapMarkers`, cada cambio de hover ejecuta `replaceWith()` en el DOM, creando/destruyendo elementos continuamente en lugar de actualizar estilos CSS.

3. **Falta de guardas de ciclo de vida**: Operaciones sobre capas se ejecutan sin verificar consistentemente `map.current?.isStyleLoaded()`, causando errores silenciosos durante cambios de estilo.

4. **Controles superpuestos**: El `SearchAreaButton` (z-20, top-4) puede colisionar con controles mobiles. Los controles touch (z-20) y desktop (z-10) tienen z-index inconsistentes.

## Solucion

### 1. Eliminar dependencia circular en EnhancedMap.tsx

Cambiar la arquitectura para que `useMapInstance` emita un evento `style.load` que los otros hooks escuchen directamente del `mapRef`, en lugar de recibir un callback.

- `useMapInstance`: Ya no recibe `onStyleLoaded`. Internamente solo marca `styleLoadedRef = true` y hace `resize()`.
- `useMapLayers`: Escucha `map.current.on('style.load', ...)` internamente para re-agregar capas.
- `useMapMarkers`: Ya escucha `isLoading` correctamente, no necesita cambio aqui.

Esto rompe la dependencia circular y cada hook es autosuficiente.

### 2. Optimizar actualizacion de marcadores en useMapMarkers.ts

En lugar de `replaceWith()` que destruye y recrea el DOM:

- Guardar referencia al elemento actual de cada marcador
- En hover, solo actualizar `el.style.transform`, `el.style.zIndex` y `el.style.filter`
- Actualizar el contenido del pill (background, color, border) via `el.querySelector` y `style` updates
- Solo recrear el marcador completo cuando cambia el listing (precio, tipo, etc.)

### 3. Agregar guardas de ciclo de vida consistentes en useMapLayers.ts

- Cada `useEffect` y cada funcion (`addInfoLayers`, `addRealWMSLayers`, `setupLayerHoverEvents`) debe verificar `map.current && map.current.isStyleLoaded()` antes de operar.
- Envolver operaciones de `addLayer`/`addSource` en try-catch para evitar errores cuando la fuente ya existe despues de un cambio de estilo rapido.
- Registrar el listener `style.load` dentro del hook para re-agregar capas automaticamente.

### 4. Unificar z-index y posiciones de controles

Establecer una jerarquia clara:

```text
z-30: Paneles overlay (mobile layers panel)
z-20: SearchAreaButton, Drawing indicator
z-10: CompactMapControls (zoom, style, badge)
z-10: TouchMapControls (mobile)
```

- `SearchAreaButton`: `top-3` centrado, `z-20`
- `CompactMapControls` (derecha): `z-10`
- Badge propiedades (bottom-left): `bottom-14`, `z-10`
- Style toggles (bottom-right): `bottom-14`, `z-10`
- `TouchMapControls`: `bottom-24`, `z-20` (por encima de posibles tabs)

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useMapInstance.ts` | Eliminar prop `onStyleLoaded`, simplificar |
| `src/hooks/useMapMarkers.ts` | Optimizar hover (CSS-only, sin recrear DOM) |
| `src/hooks/useMapLayers.ts` | Agregar listener `style.load` interno, try-catch en add operations |
| `src/components/map/EnhancedMap.tsx` | Quitar `onStyleLoaded` callback, simplificar orquestacion |
| `src/components/map/CompactMapControls.tsx` | Ajustar bottom a `bottom-14` para consistencia |
| `src/components/explore/SearchAreaButton.tsx` | Confirmar `z-20 top-3` |

## Resultado Esperado

- Mapa no pierde capas al cambiar estilo (satellite/3d/streets)
- Hover sobre marcadores es instantaneo (sin flicker DOM)
- No hay errores de consola por operaciones sobre mapa no listo
- Controles nunca se superponen entre si ni con atribucion Mapbox

