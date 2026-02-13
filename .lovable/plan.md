
# Plan: Rediseño del Sistema de Exploración - Mapa Profesional

## Problema Principal

El mapa pierde el control cuando se interactúa con el sidebar porque:

1. **flyTo en cada hover**: Cuando pasas el mouse por una tarjeta del sidebar, el mapa ejecuta `map.flyTo()` con animación de 800ms, moviendo el viewport constantemente. Si mueves el mouse por varias tarjetas rápidamente, se encolan múltiples animaciones y el mapa "salta" sin control.

2. **fitBounds en cada cambio de filtro**: Al filtrar propiedades, el mapa recalcula los bounds y se mueve, perdiendo la vista que el usuario había elegido.

3. **Sin cancelación de animaciones**: No hay mecanismo para cancelar un flyTo previo antes de iniciar uno nuevo.

## Solución: Interacción Tipo Zillow/Idealista

La interacción correcta entre sidebar y mapa es:
- **Hover en sidebar**: resaltar el marcador en el mapa SIN mover la cámara
- **Click en sidebar**: centrar el mapa suavemente SOLO en el click, no en el hover
- **Hover en mapa**: resaltar la tarjeta en el sidebar con scroll automático
- **Filtrar**: actualizar marcadores sin mover la cámara

## Cambios Técnicos

### 1. `src/components/map/EnhancedMap.tsx` - Corregir interacción hover/click

**Hover del sidebar (líneas 1650-1701)**: Eliminar completamente el `flyTo` del efecto de hover. En su lugar:
- Solo destacar visualmente el marcador (cambiar estilo/escala)
- Mostrar popup en la posición del marcador SIN mover la cámara
- Si el marcador no está visible en el viewport, NO hacer nada (el usuario puede hacer click para centrar)

**Click del sidebar**: Agregar nuevo prop `selectedListing` separado de `hoveredListing`. Solo el click dispara `easeTo` (más suave que flyTo) con zoom controlado.

**fitBounds**: Cambiar para que solo se ejecute en la carga inicial (primera vez que hay listings), no en cada cambio de filtro. Usar un ref `initialFitDone` para controlarlo.

**Cancelar animaciones**: Llamar `map.stop()` antes de iniciar cualquier nueva animación para cancelar la anterior.

### 2. `src/pages/Explorar.tsx` - Separar hover de selección

Pasar tanto `hoveredListing` como `selectedListing` al mapa:
- `hoveredListing`: solo visual, sin movimiento de cámara
- `selectedListing` (click): dispara easeTo al marcador

Modificar `handleListingClick` para que setee `selectedListing` y dispare el centrado.

### 3. `src/components/map/EnhancedMap.tsx` - Marcadores con cluster mejorados

Cuando se usa clustering, agregar una capa de unclustered-point para que los marcadores individuales sean clickeables y hovereables:
- Agregar capa `unclustered-point` con evento de click que busca el listing y dispara `onListingClick`
- Agregar evento de hover que muestra popup y dispara `onListingHover`

### 4. `src/components/explore/ExploreListPanel.tsx` - Scroll automático bidireccional

Cuando el mapa dispara `onListingHover`, el sidebar debe hacer scroll automático a la tarjeta correspondiente. El `QuickPropertyCard` ya tiene `scrollIntoView` para `isSelected`, extenderlo para `isHovered` también (con comportamiento más suave).

### 5. `src/components/map/EnhancedMap.tsx` - Props interface actualizada

Agregar nuevo prop:
```text
selectedListing?: Listing | null  -- dispara easeTo al marcador
hoveredListing?: Listing | null   -- solo resalta visualmente, sin mover cámara
```

## Archivos a Modificar

### `src/components/map/EnhancedMap.tsx`
- Agregar prop `selectedListing` a la interface
- Reescribir efecto de hover (líneas 1650-1701): eliminar flyTo, solo resaltar marcador + popup estático
- Nuevo efecto para `selectedListing`: easeTo suave con `map.stop()` previo
- Agregar ref `initialFitDone` para que fitBounds solo ocurra una vez
- Agregar capa `unclustered-point` para marcadores individuales en modo cluster
- Agregar eventos de click/hover en unclustered-point

### `src/pages/Explorar.tsx`
- Pasar `selectedListing` como prop al mapa
- Cambiar `handleListingClick` para centrar mapa via `selectedListing`
- Cambiar `handleListingPreview` para abrir sheet sin mover mapa

### `src/components/explore/QuickPropertyCard.tsx`
- Extender scrollIntoView para que también funcione con `isHovered` (scroll suave cuando el mapa hover dispara highlight en sidebar)

## Resultado Esperado

- Hover en sidebar: marcador se resalta pero el mapa NO se mueve
- Click en tarjeta: mapa centra suavemente en la propiedad
- Filtrar: marcadores se actualizan sin mover la cámara
- Hover en marcador del mapa: sidebar hace scroll a la tarjeta
- Sin saltos, sin animaciones encadenadas, experiencia fluida tipo Zillow
