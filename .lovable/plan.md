
# Plan: Redisenar /explorar - Tarjetas como elemento principal, mapa secundario

## Problema
El mapa de Mapbox ha sido inestable y problematico en la pagina /explorar. Los marcadores no se renderizan correctamente, hay problemas con capas GIS, y la experiencia depende de un componente fragil (EnhancedMap con 1400+ lineas). El usuario quiere que las tarjetas de propiedades sean el contenido principal y el mapa pase a ser un elemento secundario opcional.

## Nueva Arquitectura

La pagina /explorar se convierte en un layout tipo "catalogo inteligente" con:

```text
+----------------------------------------------------------+
| StickyHeader                                             |
+----------------------------------------------------------+
| SearchBar + FilterBar (tipo, region, pais, precio, area) |
+----------------------------------------------------------+
| Stats bar: "20 terrenos desde $15M en 5 regiones"       |
| [Todos] [Destacados] [Mejor precio/m2] | Ordenar: v     |
+----------------------------------------------------------+
|                                                          |
|  [Card] [Card] [Card] [Card]    <- Grid responsive       |
|  [Card] [Card] [Card] [Card]       3-4 columnas desktop  |
|  [Card] [Card] [Card] [Card]       2 columnas mobile     |
|                                                          |
|  [Ver en mapa ->] boton flotante esquina inferior        |
|                                                          |
+----------------------------------------------------------+
| PropertyPreviewSheet (side sheet al click)               |
+----------------------------------------------------------+
```

El mapa se accede opcionalmente via un toggle/boton que muestra un mini-mapa colapsable o un dialog de pantalla completa.

## Cambios por Archivo

### 1. `src/pages/Explorar.tsx` - REESCRIBIR
- Eliminar ResizablePanelGroup y split-view
- Eliminar diferenciacion mobile/desktop (un solo layout responsivo)
- Layout vertical: StickyHeader > FilterBar > Stats/Sort bar > Grid de tarjetas > PropertyPreviewSheet
- El mapa se muestra como un boton flotante "Ver en mapa" que abre un Dialog con EnhancedMap
- Mantener toda la logica de filtros, search, sorting existente
- Mantener PropertyPreviewSheet para la vista previa lateral

### 2. `src/components/explore/ExploreGrid.tsx` - NUEVO
- Grid responsivo de tarjetas: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Reutiliza `QuickPropertyCard` en layout vertical
- Incluye "Mejor oportunidad" highlight card al inicio
- Loading skeletons
- Empty state
- Animacion de entrada escalonada

### 3. `src/components/explore/ExploreToolbar.tsx` - NUEVO
- Barra compacta con: conteo de resultados, tabs (Todos/Destacados/Mejor precio), selector de ordenamiento, boton "Ver en mapa"
- Resumen inteligente: "20 terrenos desde $15M en 5 regiones"

### 4. `src/components/explore/MapDialog.tsx` - NUEVO
- Dialog de pantalla completa (o lateral) con EnhancedMap
- Se abre al presionar "Ver en mapa"
- Pasa los listings filtrados y permite seleccionar una propiedad desde el mapa
- Al seleccionar, cierra el dialog y abre PropertyPreviewSheet

### 5. `src/components/explore/MobileExploreView.tsx` - ELIMINAR
- Ya no se necesita una vista mobile separada, el nuevo layout es responsivo por defecto

### 6. `src/components/explore/ExploreBottomSheet.tsx` - Ya no se usa desde Explorar
- Se puede mantener por si se usa en otro lugar, pero no se importa en Explorar

### 7. Archivos que se mantienen sin cambios:
- `FilterBar.tsx` - se reutiliza tal cual
- `QuickPropertyCard.tsx` - se reutiliza tal cual (layout vertical)
- `PropertyPreviewSheet.tsx` - se reutiliza tal cual
- `useListings.ts` - sin cambios

## Seccion Tecnica

### Explorar.tsx - Estructura nueva
```text
PublicLayout
  StickyHeader
  main (max-w-7xl mx-auto px-4 pt-20)
    FilterBar (search + filtros)
    ExploreToolbar (stats + tabs + sort + map button)
    ExploreGrid (grid de QuickPropertyCard vertical)
    MapDialog (dialog con mapa, abierto via boton)
    PropertyPreviewSheet (side sheet al click)
```

### ExploreGrid - Responsivo
```text
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
```

### MapDialog - Dialog fullscreen
```text
Dialog con EnhancedMap envuelto en MapErrorBoundary
- Pasa filteredListings como prop
- onListingClick cierra dialog y abre PropertyPreviewSheet
```

### Mobile
- El mismo layout funciona en mobile: grid 1-2 columnas, FilterBar con scroll horizontal, boton de mapa flotante
- Sin bottom sheet ni mapa fullscreen por defecto

## Orden de Implementacion

1. Crear `ExploreToolbar.tsx`
2. Crear `ExploreGrid.tsx`
3. Crear `MapDialog.tsx`
4. Reescribir `Explorar.tsx` con el nuevo layout
5. Eliminar import de `MobileExploreView` (el archivo se puede mantener)
