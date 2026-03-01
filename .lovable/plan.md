

# Plan de Remake: Sistema de Mapa y Exploracion

## Diagnostico del Problema Raiz

El archivo `EnhancedMap.tsx` es un **monolito de 2,141 lineas** que maneja todo: inicializacion de Mapbox, marcadores DOM, popups, capas GIS (zonificacion, riesgos, infraestructura, heatmap, isocronas), controles de dibujo, clusters, cambio de estilo, geolocalizacion, y sincronizacion bidireccional. Cada intento de arreglar controles superpuestos falla porque todo esta acoplado y los efectos secundarios se interfieren entre si.

## Arquitectura Propuesta: Descomponer en Modulos

```text
EnhancedMap.tsx (2141 lineas)
        |
        v  DESCOMPONER EN:
+-------+-------+-------+-------+
|       |       |       |       |
v       v       v       v       v
useMap  Markers Layers  Controls Popup
Hook    Manager Manager (limpio) System
(~200)  (~150)  (~400)  (~80)   (~100)
```

### Fase 1: Extraer hook `useMapInstance`
Nuevo archivo `src/hooks/useMapInstance.ts` (~200 lineas)
- Gestiona la creacion/destruccion de la instancia de Mapbox
- Maneja el token, estilo inicial, resize
- Expone `mapRef`, `isLoaded`, `changeStyle(mode)`
- Toda la logica de inicializacion (lineas 1330-1498 actuales) se mueve aqui
- Previene re-creaciones innecesarias del mapa

### Fase 2: Extraer `useMapMarkers`
Nuevo archivo `src/hooks/useMapMarkers.ts` (~200 lineas)
- Gestiona creacion/actualizacion/limpieza de marcadores DOM
- `createMarkerElement()` y `attachMarkerEvents()` se mueven aqui
- Maneja la sincronizacion hover (visual highlight sin mover camara)
- Maneja la sincronizacion selected (easeTo + popup)
- Recibe `mapRef`, `listings`, `hoveredListing`, `selectedListing`

### Fase 3: Extraer `useMapLayers`
Nuevo archivo `src/hooks/useMapLayers.ts` (~400 lineas)
- Toda la logica de capas GIS: zoning, risk, infrastructure, water, green, roads, heatmap
- Capas WMS (IDE Chile, MINVU, DGA, etc.)
- Toggle demo/real data
- Opacity management
- Layer hover tooltips (`generateLayerTooltipHTML`)
- Isochrone rendering

### Fase 4: Reescribir `CompactMapControls.tsx`
Simplificar radicalmente (~80 lineas):
- **Derecha (centrado vertical)**: Solo 3 botones apilados: Zoom+, Zoom-, GPS
- **Abajo-izquierda**: Badge "N propiedades" (fuera de la zona del logo Mapbox)
- **Abajo-derecha**: 3 botones de estilo (Calles/Sat/3D) + boton Capas, posicionados en `bottom-14` para no tapar la atribucion de Mapbox
- **Sin badge de area** en el mapa principal (solo visible en el drawer)
- Quitar las props `onFitAll`, `onResetNorth`, `onResetView` del componente - esas acciones viven solo en el drawer

### Fase 5: Reescribir `EnhancedMap.tsx`
Reducir a ~300 lineas de orquestacion:
- Importa y usa los 3 hooks nuevos
- Renderiza `mapContainer` + `CompactMapControls` + `MapToolsDrawer`
- Ya no tiene logica de capas, marcadores ni inicializacion inline
- Mantiene la misma interfaz publica (props) para no romper consumidores

### Fase 6: Ajustar `ExploreMapPanel.tsx`
- El `SearchAreaButton` se renderiza con `z-10` (menor que controles) y `pointer-events-auto`
- Posicion: `top-3 left-1/2 -translate-x-1/2` (centrado arriba, no interfiere con controles de la derecha)

### Fase 7: Ajustar `Explorar.tsx`
- Asegurar que el panel izquierdo es exactamente `w-[420px]` (reducir de 440px para dar mas espacio al mapa)
- El mapa usa `flex-1` con `min-w-0` para evitar overflow
- Verificar que `pt-16` coincide con la altura real del StickyHeader

## Resultado Esperado

- **EnhancedMap.tsx**: De 2,141 lineas a ~300 lineas
- **Sin superposiciones**: Cada zona de control tiene su espacio asignado sin colisiones
- **Mantenible**: Cada hook tiene una responsabilidad unica
- **Mismo comportamiento**: La interfaz publica no cambia, los consumidores (ExploreMapPanel, LotMapView, etc.) no se tocan
- **Rendimiento**: Los hooks usan refs y dependencias estables, evitando re-renders del mapa

## Seccion Tecnica: Archivos Afectados

| Archivo | Accion |
|---------|--------|
| `src/hooks/useMapInstance.ts` | NUEVO - Ciclo de vida del mapa |
| `src/hooks/useMapMarkers.ts` | NUEVO - Gestion de marcadores |
| `src/hooks/useMapLayers.ts` | NUEVO - Capas GIS y WMS |
| `src/components/map/EnhancedMap.tsx` | REESCRIBIR - Orquestador ligero |
| `src/components/map/CompactMapControls.tsx` | REESCRIBIR - Controles minimos |
| `src/components/explore/ExploreMapPanel.tsx` | AJUSTAR - z-index del SearchAreaButton |
| `src/pages/Explorar.tsx` | AJUSTAR - Ancho del panel |

## Riesgos y Mitigacion

- **Riesgo**: Romper la inicializacion del mapa durante la refactorizacion
- **Mitigacion**: Los hooks nuevos se prueban individualmente; el mapRef compartido asegura que todos los hooks operan sobre la misma instancia
- **Riesgo**: Perder funcionalidad de capas GIS al mover codigo
- **Mitigacion**: Se mueve codigo existente sin modificar logica, solo cambia la ubicacion

