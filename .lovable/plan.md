
# Plan: Sistema de Exploracion Limpio y Funcional

## Problemas Actuales (visible en screenshot)

1. **Barra lateral izquierda con ~12 botones** apilados verticalmente -- ocupa demasiado espacio visual
2. **Marcadores de precio se superponen** entre si cuando hay muchos en zoom bajo
3. **Elementos redundantes**: badge de modo (centro-arriba), contador de propiedades (derecha-arriba), leyenda (izquierda-abajo), indicador de capas (derecha-abajo) -- 4 cards flotantes compitiendo por atencion
4. **Controles duplicados**: la barra lateral izquierda renderiza manualmente los mismos botones que ya existen como componentes (MapControlsToolbar, MapModeSelector) pero no los usa
5. **Vista general desordenada**: demasiada informacion compitiendo por la atencion del usuario

## Solucion: Interfaz Minimalista Inspirada en Apps Modernas de Mapas

### Principio de Diseno
Reducir los controles visibles al minimo necesario. Agrupar funciones secundarias detras de un solo boton. Los marcadores deben ser legibles sin superponer.

### 1. Controles del Mapa Simplificados

Reemplazar los ~12 botones individuales por 3 grupos compactos:

```text
Antes (izquierda del mapa):          Despues:
+--------+                           Esquina inferior-derecha:
| Zoom + |                           +--------+
| Zoom - |                           | Zoom + |
|--------|                           | Zoom - |
| Ubicar |                           +--------+
| Ver All|                           | Estilos| (streets/satellite/3D toggle)
| Norte  |                           +--------+
| Reset  |
|--------|                           Esquina superior-derecha:
| Calles |                           +------------------+
| Satel. |                           | 20 propiedades   |
| 3D     |                           +------------------+
|--------|
| Capas  |                           Todo lo demas: oculto o accesible
|--------|                           desde menu contextual
| Dibujar|
| Borrar |
+--------+
```

### 2. Marcadores de Precio con Anti-Colision

- A zoom bajo (< 7): mostrar solo clusters con conteo
- A zoom medio (7-10): mostrar marcadores pero limitar a los N mas cercanos al viewport
- A zoom alto (> 10): mostrar todos los marcadores con precio

### 3. Eliminar Elementos Redundantes

- **Quitar**: Badge de modo de mapa (centro-arriba) -- el usuario ya sabe que modo eligio
- **Quitar**: Leyenda de disponible/reservado/vendido (abajo-izquierda) -- raramente util en exploracion
- **Quitar**: Indicador de capas activas (abajo-derecha) -- redundante con el boton de capas
- **Quitar**: Indicador de modo 3D (abajo-derecha)
- **Mantener**: Solo el contador de propiedades (arriba-derecha), simplificado

### 4. Selector de Estilo Compacto

Reemplazar los 3 botones separados de estilo (Calles/Satelite/3D) por un toggle horizontal compacto en la esquina inferior derecha, debajo del zoom.

### 5. Capas y Herramientas Avanzadas

Mover las capas GIS y herramientas de dibujo a un panel lateral que se abre con un solo boton, en lugar de mostrarlos siempre en la barra izquierda.

## Archivos a Modificar

### `src/components/map/EnhancedMap.tsx`
- Eliminar toda la seccion de controles manuales (lineas 1908-2052) que renderiza botones inline
- Reemplazar con un layout limpio:
  - Esquina superior-derecha: contador compacto de propiedades
  - Esquina inferior-derecha: zoom +/- y selector de estilo compacto
  - Boton flotante para capas/herramientas avanzadas
- Eliminar badges redundantes (modo, leyenda, capas activas, 3D indicator)
- Agregar logica de clustering nativo de Mapbox para evitar superposicion de marcadores a zoom bajo

### `src/components/map/CompactMapControls.tsx` (nuevo)
- Componente con zoom +/-, selector de estilo (3 iconos inline), y boton de capas
- Diseno compacto y glassmorphism consistente

### `src/components/map/MapToolsDrawer.tsx` (nuevo)
- Panel lateral que agrupa: capas GIS, herramientas de dibujo, configuracion de opacidad
- Se abre desde un solo boton en el mapa
- Reemplaza la barra vertical de 12 botones

### `src/pages/Explorar.tsx`
- Sin cambios estructurales, el layout split-view se mantiene

## Detalle Tecnico

### Clustering nativo de Mapbox para marcadores
En lugar de crear marcadores DOM individuales que se superponen, usar una fuente GeoJSON con clustering habilitado:

```text
Zoom < 7:  Circulos con numero "12 terrenos"
Zoom 7-10: Marcadores de precio individuales (los mas grandes primero)
Zoom > 10: Todos los marcadores visibles
```

Esto se implementa con `map.addSource('listings', { type: 'geojson', cluster: true })` y capas de tipo `circle` + `symbol`.

### Layout de controles final
```text
+------------------------------------------+
|                              [20 terrenos]|
|                                           |
|                                           |
|              MAPA LIMPIO                  |
|                                           |
|                                           |
|                          [+]              |
|                          [-]              |
|                          [Calles|Sat|3D]  |
|                          [Capas]          |
+------------------------------------------+
```

### Resultado esperado
- Mapa limpio con maximo espacio para visualizacion
- Controles agrupados y no intrusivos
- Marcadores legibles sin superposicion
- Herramientas avanzadas accesibles pero no visibles por defecto
