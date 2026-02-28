

# Explorador Unificado Mapa + Lista (Split-View)

## Problema Actual
- El explorador actual muestra solo un grid de tarjetas. El mapa es un popup secundario (dialog) que se abre aparte.
- La vista mobile (`MobileExploreView`) existe pero no se usa en ninguna parte.
- No hay sincronizacion bidireccional real entre mapa y lista porque viven en contextos separados.

## Solucion: Vista Split Integrada (estilo Airbnb/Idealista)

Redisenar `/explorar` con un layout split-view donde mapa y lista conviven permanentemente:

```text
+------------------------------------------------------------+
| StickyHeader                                                |
+------------------------------------------------------------+
| SearchBar + FilterChips (horizontal scroll)                 |
+------------------------------------------------------------+
|                    |                                        |
|   Lista de         |          Mapa Mapbox                   |
|   Propiedades      |          (fullscreen right)             |
|   (scroll vertical)|                                        |
|                    |    [markers con precio]                 |
|   - Card           |    [hover sync bidireccional]           |
|   - Card           |    [cluster auto]                       |
|   - Card           |                                        |
|                    |    Boton: "Buscar en esta area"         |
|                    |                                        |
+------------------------------------------------------------+
```

**Mobile**: Mapa fullscreen + bottom sheet con resultados (usa MobileExploreView existente).

## Cambios por Archivo

### 1. `src/pages/Explorar.tsx` (reescribir layout principal)
- Detectar mobile con `useIsMobile()`
- **Desktop**: Layout flex con 2 columnas: lista (40%) + mapa sticky (60%)
- **Mobile**: Renderizar `MobileExploreView` directamente
- Eliminar `MapDialog` (el mapa ahora es inline permanente)
- Agregar estado `mapBounds` para filtrar "Buscar en esta area"
- Mantener todos los filtros, sort, tabs existentes

### 2. `src/components/explore/ExploreListPanel.tsx` (nuevo - panel izquierdo)
- Scroll area vertical con las property cards
- Contiene: toolbar (count + sort + tabs) + grid vertical de 1-2 columnas
- Hover en card resalta marker en mapa (ya existe esta logica)
- Click en card centra mapa con flyTo

### 3. `src/components/explore/ExploreMapPanel.tsx` (nuevo - panel derecho)
- Wrapper sticky de `EnhancedMap` con position sticky
- Boton flotante "Buscar en esta area" que aparece al mover el mapa
- Usa `useMapViewport` (ya existe) para detectar movimiento
- Al hacer click en marker, scroll automatico a la card correspondiente

### 4. `src/components/explore/MobileExploreView.tsx` (activar)
- Conectar las props faltantes (countries, sort, tabs)
- Importar y usar en `Explorar.tsx` cuando `isMobile`

### 5. `src/components/explore/SearchAreaButton.tsx` (ya existe, verificar/integrar)
- Boton flotante "Buscar en esta area" sobre el mapa
- Se muestra cuando el usuario mueve el mapa manualmente
- Click actualiza los bounds del query de listings

### 6. `src/hooks/useListings.ts` (agregar filtro por bounds)
- Agregar parametros opcionales `bounds: { north, south, east, west }`
- Filtrar server-side con `lat/lng` dentro del viewport del mapa

## Interacciones Clave

1. **Hover bidireccional**: Hover en card destaca marker, hover en marker destaca card (ya funciona con props existentes)
2. **Click en marker**: Scroll suave a la card en el panel izquierdo + resalta
3. **Click en card**: `flyTo` en el mapa al marker correspondiente
4. **Mover mapa**: Muestra boton "Buscar en esta area", click re-filtra listings por bounds
5. **Filtros**: Afectan tanto lista como markers simultaneamente (ya funciona)

## Secuencia de Implementacion

1. Crear `ExploreListPanel` y `ExploreMapPanel` como wrappers
2. Reescribir layout de `Explorar.tsx` con split-view desktop + mobile branch
3. Conectar `MobileExploreView` con todas las props
4. Agregar "Buscar en esta area" con filtrado por bounds
5. Verificar sincronizacion bidireccional hover/click

## Detalles Tecnicos

- El mapa derecho usa `position: sticky; top: 64px; height: calc(100vh - 64px)` para quedarse fijo mientras la lista scrollea
- `react-resizable-panels` (ya instalado) se puede usar opcionalmente para resize del split, pero un layout fijo 40/60 es mas estable
- No se necesitan cambios de base de datos
- No se necesitan edge functions nuevas
