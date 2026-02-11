
# Plan: Sistema de Exploracion Premium - Experiencia Inmobiliaria de Clase Mundial

## Vision

Transformar la pagina de exploracion actual en una experiencia inmobiliaria de nivel Zillow/Idealista, con tarjetas visualmente impactantes, interacciones fluidas, mejor uso del espacio y funcionalidades que conviertan visitantes en leads.

## Problemas Actuales

1. **Tarjetas demasiado compactas**: Las QuickPropertyCard muestran poca informacion visual - solo un thumbnail de 96x80px
2. **Panel flotante rigido**: Solo 3 estados (collapsed/normal/expanded) sin transicion suave
3. **Sin precio por m2 visible**: Dato clave para compradores ausente en la lista
4. **Sin indicadores de engagement**: No se ve cuantas vistas tiene cada propiedad
5. **Mapa sin clustering visual**: Los marcadores se superponen en zonas densas
6. **FilterBar ocupa espacio vertical**: Reduce el area util del mapa
7. **Sin feedback de carga progresiva**: Skeleton generico sin contexto

## Cambios a Implementar

### 1. Tarjetas de Propiedad Rediseñadas (QuickPropertyCard)

Redisenar la tarjeta con layout horizontal mejorado:
- Thumbnail mas grande (120x88px) con aspect-ratio consistente
- **Precio por m2** visible debajo del precio principal
- Badge de pais (bandera) junto al tipo de propiedad
- Indicador de vistas (ojo + numero) para social proof
- Animacion de entrada escalonada mas sutil
- Hover con preview de segunda imagen (si existe)
- Gradiente de precio: verde para buenos precios, naranja para caros (relativo al mercado)

### 2. Panel de Resultados Mejorado (FloatingResultsPanel)

- Header con resumen inteligente: "20 terrenos desde $50M en 3 regiones"
- Tabs rapidos: "Todos | Destacados | Nuevos" como filtro inline
- Seccion sticky de "Mejor oportunidad" que muestra la propiedad con mejor relacion precio/m2
- Footer con CTA: "No encuentras lo que buscas? Activar alertas"
- Transicion de ancho mas suave con CSS resize en lugar de estados discretos

### 3. Marcadores de Mapa con Precio (EnhancedMap)

Cambiar los marcadores circulares genericos por marcadores con precio visible:
- Mostrar precio abreviado en el marcador ($950M, $1.8B, 15 UF)
- Color segun tipo de propiedad (verde=rural, azul=urbano, naranja=agricola)
- Marcador activo con flecha apuntando hacia abajo (pin style)
- Cluster markers que muestran rango de precios del grupo

### 4. Barra de Filtros Compacta (FilterBar)

- Reducir altura: de 2 filas a 1 fila con scroll horizontal
- Chips de filtro activo inline (no separados)
- Contador de resultados integrado en la barra: "20 resultados"
- Boton de "Buscar en esta area" que aparece al mover el mapa

### 5. Preview Sheet Enriquecido (PropertyPreviewSheet)

- Galeria con swipe horizontal nativo
- Seccion de "Propiedades similares" al final (hasta 3)
- Boton de WhatsApp directo (ademas de llamar/contactar)
- Mini-mapa de ubicacion dentro del sheet
- Score de inversion (si existe match score)

### 6. Estado Vacio Mejorado

- Cuando no hay resultados: mostrar sugerencias de busqueda
- "Ampliar area de busqueda" como accion directa
- Mostrar propiedades cercanas como alternativa

## Detalle Tecnico

### Archivos a modificar:
- `src/components/explore/QuickPropertyCard.tsx` - Redisenar con precio/m2, vistas, banderas
- `src/components/explore/FloatingResultsPanel.tsx` - Header inteligente, tabs, CTA
- `src/components/explore/FilterBar.tsx` - Layout compacto de 1 fila
- `src/components/explore/PropertyPreviewSheet.tsx` - WhatsApp, similares, score
- `src/components/map/EnhancedMap.tsx` - Marcadores con precio abreviado
- `src/pages/Explorar.tsx` - Integrar nuevas props y estado de tabs
- `src/components/explore/MobileExploreView.tsx` - Adaptar mejoras a mobile
- `src/components/explore/CompactListingCard.tsx` - Actualizar para mobile cards

### Archivos nuevos:
- Ninguno - todas las mejoras se integran en componentes existentes

### Funciones helper nuevas (en useListings.ts):
- `formatPriceShort()` - Para marcadores: $950M, $1.8B, 15UF
- `getPricePerM2()` - Calculo inline reutilizable
- `getCountryFlag()` - Bandera por pais del listing

## Resultado

Una experiencia de exploracion premium donde cada interaccion esta optimizada para convertir: tarjetas informativas que muestran datos clave sin salir de la lista, marcadores de mapa con precio visible que eliminan clics innecesarios, y un flujo de preview-a-contacto que reduce la friccion para generar leads.
