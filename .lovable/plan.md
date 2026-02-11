
# Plan: Sistema de Explorar Robusto - Fix del Mapa

## Problema Principal

El mapa en `/explorar` falla porque el `useEffect` de inicializacion del mapa (linea 1740) tiene dependencias inestables que causan que el mapa se destruya y recree constantemente:

```
// Linea 1740 - PROBLEMATICO
[mapboxToken, tokenLoading, getCenter, getMapStyle, mapMode, showDrawTools, addInfoLayers, setupLayerHoverEvents]
```

- `getCenter` depende de `listings` -- cada vez que llegan datos, el mapa se reinicia
- `addInfoLayers` depende de `infoLayers`, `layerConfig`, y `listings` -- cada toggle de capa reinicia el mapa
- `getMapStyle` depende de `mapMode` (OK pero ya esta `mapMode` en el array)

Esto crea un ciclo destructivo: datos llegan -> mapa se destruye -> mapa se recrea -> los tiles no alcanzan a cargar -> pantalla gris.

## Solucion

Refactorizar `EnhancedMap.tsx` para estabilizar el ciclo de vida del mapa:

### 1. Estabilizar el useEffect de inicializacion

Cambiar las dependencias del useEffect de inicializacion para que solo se ejecute cuando cambia el token. Mover `getCenter`, `addInfoLayers`, y `setupLayerHoverEvents` fuera del array de dependencias usando refs.

### 2. Usar refs para funciones que cambian frecuentemente

Almacenar `addInfoLayers`, `setupLayerHoverEvents`, y `getCenter` en refs para que el useEffect de inicializacion no dependa de ellas:

```text
Antes:                              Despues:
useEffect(init, [                   useEffect(init, [
  mapboxToken,                        mapboxToken,
  tokenLoading,                       tokenLoading,
  getCenter,        <-- inestable   ]);
  getMapStyle,      <-- redundante
  mapMode,          <-- movido
  showDrawTools,
  addInfoLayers,    <-- inestable
  setupLayerHoverEvents <-- inest.
]);
```

### 3. Manejar cambios de modo de mapa sin reiniciar

En lugar de incluir `mapMode` en el useEffect de init (que destruye el mapa), usar el metodo `changeMapMode` existente que ya maneja el cambio de estilo con `setStyle` + `style.load`.

### 4. Mover datos GeoJSON demo a archivos separados

Extraer las ~300 lineas de datos GeoJSON demo (generateDemoZoningData, generateRiskZonesData, etc.) a un archivo separado para reducir el tamano del componente.

### 5. Agregar error boundary al mapa

Envolver el mapa en un error boundary para que si falla, muestre el `MapErrorState` en lugar de romper toda la pagina.

## Archivos a Modificar

- `src/components/map/EnhancedMap.tsx` - Fix principal: estabilizar dependencias del useEffect, usar refs
- `src/components/map/demoGeoData.ts` (nuevo) - Extraer datos GeoJSON demo
- `src/components/map/MapErrorBoundary.tsx` (nuevo) - Error boundary para el mapa
- `src/pages/Explorar.tsx` - Envolver mapa con error boundary

## Detalle Tecnico

### Fix del useEffect de inicializacion:

El cambio clave es:

1. Crear refs para funciones inestables:
   - `addInfoLayersRef` = useRef que siempre apunta a la version actual de `addInfoLayers`
   - `getCenter` se calcula una sola vez al init, no reactivamente

2. El useEffect de init solo depende de `[mapboxToken, tokenLoading]`

3. Mover la logica de `mapMode` a un useEffect separado que use `map.current.setStyle()` sin destruir el mapa

4. Llamar `addInfoLayers` desde un useEffect separado que se ejecute en `style.load`

### Error Boundary:
```text
<MapErrorBoundary fallback={<MapErrorState />}>
  <EnhancedMap ... />
</MapErrorBoundary>
```

Esto previene que un crash del mapa (WebGL, token, etc.) deje la pagina en blanco.
