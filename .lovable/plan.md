

# Plan Definitivo: Mapa Funcional y Limpio

## Problemas Identificados (del screenshot)

1. El badge "20 propiedades" en la esquina superior izquierda se superpone con el boton "Buscar en esta area" centrado arriba
2. Los controles de navegacion (zoom, GPS, etc.) en la derecha son demasiados y ocupan mucho espacio vertical
3. El popup de propiedad al hacer hover se superpone con los botones de estilo de mapa (abajo derecha)
4. Los controles de estilo de mapa (Calles/Satelite/3D) y el boton de Capas estan demasiado cerca de la atribucion de Mapbox
5. No hay separacion visual clara entre zonas de controles

## Solucion: Rediseno de Controles del Mapa

### Principio: Zonas de control sin superposicion

```text
+--------------------------------------------------+
|  [Buscar en esta area]  (centro, solo si se mueve)|
|                                                    |
|                                    [+]             |
|                                    [-]             |
|                                    [GPS]           |
|                                                    |
|                                                    |
|                                                    |
|                                                    |
|  20 propiedades                                    |
|  [Calles] [Sat] [3D]              [Capas]         |
+--------------------------------------------------+
```

- **Top center**: Solo el boton "Buscar en esta area" (aparece/desaparece)
- **Right center**: Solo 3 botones esenciales: Zoom+, Zoom-, GPS
- **Bottom left**: Badge de conteo de propiedades
- **Bottom right**: Toggle de estilo (Calles/Sat/3D) + boton Capas
- **Eliminados del mapa**: Fit All, Reset North, Reset View (se mueven al drawer de herramientas)

### Cambios por Archivo

#### 1. `src/components/map/CompactMapControls.tsx` (simplificar drasticamente)

Reducir de 6 botones de navegacion a solo 3 (Zoom In, Zoom Out, Locate). Los botones de Fit All, Reset North, Reset View se mueven al MapToolsDrawer.

Reorganizar zonas:
- **Bottom-left**: Badge "N propiedades" + area dibujada
- **Right (centrado vertical)**: Solo Zoom+, Zoom-, GPS (3 botones)
- **Bottom-right**: Estilo toggle (3 botones) + Capas (1 boton), con `bottom-12` para evitar la atribucion de Mapbox

#### 2. `src/components/explore/SearchAreaButton.tsx` (ajustar posicion)

Mover a `top-4` con z-index 20 (menor que controles), y asegurar que no colisione con nada.

#### 3. `src/components/map/EnhancedMap.tsx` (ajustes del popup)

- Cambiar el offset del popup para que aparezca arriba del marker (no a la derecha), evitando superposicion con controles
- Ajustar `popupRef` con `anchor: 'bottom'` y offset vertical de 15px
- Reducir `maxWidth` del popup a 260px para que no tape controles

#### 4. `src/components/map/MapToolsDrawer.tsx` (agregar botones movidos)

Agregar seccion "Navegacion" al drawer con los botones que se eliminaron del mapa:
- Fit All (ver todas las propiedades)
- Reset North (orientar al norte)
- Reset View (restablecer vista)

Esto mantiene la funcionalidad accesible pero fuera del mapa principal.

## Resultado Esperado

- Mapa limpio con solo 3 controles visibles (zoom + GPS)
- Sin superposiciones entre badge, buscar, popup y controles
- Todas las funciones avanzadas accesibles desde el drawer de Capas/Herramientas
- Popup de propiedad siempre visible arriba del marker, sin tapar botones

