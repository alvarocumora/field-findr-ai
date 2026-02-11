
# Plan: Redisenar Explorar desde Cero - Layout Split-View Profesional

## Problema

La pagina actual tiene demasiadas capas visuales apiladas: header sticky, barra de busqueda, barra de filtros, y luego un panel flotante sobre el mapa. Esto comprime el mapa y crea una experiencia visualmente cargada. Los marcadores de precio flotan sobre un mapa reducido.

## Nuevo Enfoque: Split-View (Zillow/Airbnb Style)

En lugar de un mapa con panel flotante encima, implementar un layout de dos columnas:

```text
+------------------------------------------+----------------------------+
|         MAPA (60-65% del ancho)           |     LISTA (35-40%)         |
|                                          |  [Buscar...]               |
|  [Filtros flotantes sobre el mapa]       |  [Tipo] [Precio] [Region]  |
|                                          |  20 terrenos desde $45M    |
|     Marcadores con precio ($950M)        |  +----------------------+  |
|                                          |  | Tarjeta propiedad 1  |  |
|                                          |  +----------------------+  |
|                                          |  | Tarjeta propiedad 2  |  |
|                                          |  +----------------------+  |
|                                          |  | ...                  |  |
+------------------------------------------+----------------------------+
```

## Cambios a Implementar

### 1. Nuevo Layout en Explorar.tsx

Eliminar el header sticky con search + filters que consume espacio vertical. Reemplazar con:
- Layout split-view: mapa ocupa el lado izquierdo (65%), lista el derecho (35%)
- El mapa ocupa TODA la altura de la ventana (100vh - header height)
- La barra de busqueda y filtros se mueven al panel de lista (lado derecho)
- Sin PublicLayout wrapper para explorar desktop (solo StickyHeader directo)

### 2. Panel de Lista Rediseñado (reemplaza FloatingResultsPanel)

Crear un nuevo componente `ExploreListPanel` que reemplaza al FloatingResultsPanel:
- Input de busqueda integrado en la parte superior del panel
- Filtros como chips compactos debajo del search (scrollable horizontal)
- Resumen inteligente: "20 terrenos desde $45M"
- Lista de tarjetas con scroll vertical
- El panel es parte del layout, no flota sobre el mapa
- Borde izquierdo sutil para separar del mapa

### 3. Tarjetas Mejoradas para el Panel

Redisenar QuickPropertyCard para el contexto split-view:
- Layout vertical (en vez de horizontal): imagen arriba, contenido abajo
- Imagen mas grande (aspect-ratio 16/10, ancho completo del card)
- 2 columnas de tarjetas cuando el panel es lo suficientemente ancho
- Precio grande y prominente
- Precio/m2, ubicacion, area en una sola linea compacta
- Hover sincronizado con el mapa (marcador se activa)

### 4. Mapa Limpio sin Overlays Pesados

Simplificar la vista del mapa en el contexto explorar:
- Solo marcadores de precio y controles basicos (zoom, locate, layers)
- Eliminar la toolbar de dibujo del modo explorar
- Sin panel flotante sobre el mapa
- Marcadores de precio mas limpios y legibles
- Al hacer click en marcador: selecciona la tarjeta en el panel derecho (scroll to)

### 5. Interaccion Bidireccional Mejorada

- Hover en tarjeta -> marcador se agranda en el mapa + fly-to suave
- Click en marcador -> scroll a tarjeta en la lista + highlight
- Click en tarjeta -> abre PropertyPreviewSheet (se mantiene como esta)
- Resize handle entre mapa y lista (usando react-resizable-panels)

### 6. Filtros Integrados en el Panel

Mover los filtros al panel de lista como chips inline:
- Primera fila: [Tipo v] [Precio v] [Region v] [Mas filtros]
- Sin barra expandible separada - todo inline
- Los popover filters se mantienen pero son mas compactos
- Contador de resultados inline: "20 resultados" al lado de los filtros

## Detalle Tecnico

### Archivos nuevos:
- `src/components/explore/ExploreListPanel.tsx` - Panel lateral con search, filtros y lista de tarjetas

### Archivos a modificar:
- `src/pages/Explorar.tsx` - Reescribir con layout split-view usando react-resizable-panels
- `src/components/explore/QuickPropertyCard.tsx` - Layout vertical con imagen grande
- `src/components/explore/FilterBar.tsx` - Version compacta inline para el panel

### Archivos que se mantienen sin cambios:
- `src/components/map/EnhancedMap.tsx` - Se reutiliza tal cual
- `src/components/explore/PropertyPreviewSheet.tsx` - Se mantiene
- `src/components/explore/MobileExploreView.tsx` - Se mantiene para mobile

### Dependencia existente reutilizada:
- `react-resizable-panels` (ya instalado) - Para el resize entre mapa y lista

## Resultado

Una experiencia tipo Zillow/Airbnb Maps donde el mapa y la lista coexisten sin competir por espacio, los filtros estan integrados en el flujo natural de la lista, y cada interaccion (hover, click) conecta ambos paneles de forma fluida.
