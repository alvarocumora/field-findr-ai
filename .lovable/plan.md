

# Plan: Experiencia Explorar Mobile-First con Mapa Central

## Resumen

Rediseño completo de la página de exploración de terrenos con enfoque **mobile-first**, donde el mapa será la herramienta central de navegación. La experiencia en teléfono tendrá un mapa a pantalla completa con una barra de búsqueda flotante y un panel deslizable (bottom sheet) para ver los resultados.

---

## Diseño Visual

### Vista Móvil (Principal)
```text
+----------------------------------+
|  [Search Bar Flotante]    [≡]   |  <- Barra de búsqueda + filtros
+----------------------------------+
|                                  |
|                                  |
|         MAPA FULLSCREEN          |
|      (con marcadores)            |
|                                  |
|    [📍] [+] [-] [🧭]             |  <- Controles del mapa
|                                  |
+----------------------------------+
|  ◉ Drag handle                   |  <- Bottom Sheet
|  12 terrenos encontrados         |
|  +-----+  +-----+  +-----+       |
|  |Card1|  |Card2|  |Card3|       |  <- Scroll horizontal
|  +-----+  +-----+  +-----+       |
+----------------------------------+
```

### Estados del Bottom Sheet
1. **Colapsado**: Solo muestra contador de resultados y preview
2. **Expandido parcial** (50%): Muestra tarjetas en scroll horizontal
3. **Expandido completo** (90%): Lista vertical completa con más detalles

---

## Cambios Técnicos

### 1. Nueva Arquitectura de Componentes

**Componentes a crear:**
- `MobileExploreView.tsx` - Vista principal mobile con mapa fullscreen
- `ExplorBottomSheet.tsx` - Panel deslizable con resultados
- `CompactListingCard.tsx` - Tarjeta compacta para carousel horizontal
- `FloatingSearchBar.tsx` - Barra de búsqueda flotante glassmorphism

### 2. Modificaciones a `Explorar.tsx`

- Detección automática de viewport móvil con `useIsMobile()`
- Renderizado condicional: vista desktop actual vs nueva vista móvil
- Estado compartido para sincronización mapa-lista

### 3. Bottom Sheet con Vaul

Utilizando el componente `Drawer` existente (`vaul`):
- Snap points: `[0.1, 0.5, 0.9]` para los 3 estados
- Contenido dinámico según nivel de expansión
- Scroll horizontal de tarjetas en estado parcial
- Lista vertical completa en estado expandido

### 4. Barra de Búsqueda Flotante

- Posición absoluta sobre el mapa
- Diseño glassmorphism compacto
- Input de búsqueda + botón de filtros
- Chips de filtros activos con scroll horizontal
- Transición suave al hacer scroll

### 5. Tarjetas Compactas

Nueva `CompactListingCard`:
- Dimensiones: 160px x 180px
- Imagen cuadrada con overlay de precio
- Ubicación y área en texto mínimo
- Badge de estado (disponible/reservado)
- Touch targets de 44px mínimo

### 6. Sincronización Mapa-Lista

- Al tocar una tarjeta: centrar mapa en esa propiedad
- Al tocar un marcador: resaltar tarjeta y hacer scroll
- Animaciones suaves de transición

---

## Mejoras de UX Mobile

| Problema Actual | Solución |
|-----------------|----------|
| Vista split oculta en móvil | Mapa siempre visible como base |
| Cards ocupan pantalla completa | Bottom sheet con cards compactas |
| Filtros en Sheet lateral | Búsqueda flotante + Sheet de filtros optimizado |
| Toggle de vistas poco intuitivo | Transición fluida mapa↔lista con gestos |
| Información perdida en pantalla pequeña | Diseño compacto sin perder datos clave |

---

## Especificaciones de Diseño

### Colores y Estilos
- Glassmorphism: `bg-background/80 backdrop-blur-xl`
- Sombras suaves: `shadow-lg shadow-black/10`
- Bordes sutiles: `border border-white/10`
- Touch targets mínimos: 44px

### Animaciones
- Bottom sheet: spring animation de Vaul
- Transiciones: 300ms ease-out
- Scroll snapping para carousel

### Breakpoints
- Mobile: `< 768px` - Nueva experiencia mobile-first
- Tablet/Desktop: `≥ 768px` - Vista actual con mejoras menores

---

## Archivos a Modificar/Crear

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/pages/Explorar.tsx` | Modificar | Renderizado condicional mobile/desktop |
| `src/components/explore/MobileExploreView.tsx` | Crear | Vista móvil completa |
| `src/components/explore/ExploreBottomSheet.tsx` | Crear | Bottom sheet con resultados |
| `src/components/explore/CompactListingCard.tsx` | Crear | Tarjeta compacta para carousel |
| `src/components/explore/FloatingSearchBar.tsx` | Crear | Barra de búsqueda flotante |
| `src/components/explore/MobileFilterSheet.tsx` | Crear | Panel de filtros optimizado móvil |
| `src/index.css` | Modificar | Estilos adicionales para bottom sheet |

---

## Flujo de Usuario Mobile

1. **Entrada**: Usuario ve mapa a pantalla completa con marcadores
2. **Exploración**: Navega el mapa con gestos táctiles
3. **Descubrimiento**: Bottom sheet muestra preview de resultados
4. **Interés**: Desliza hacia arriba para ver más propiedades
5. **Detalle**: Toca una tarjeta para ver detalles completos
6. **Filtrado**: Usa barra flotante para refinar búsqueda

---

## Consideraciones de Accesibilidad

- Contraste adecuado en overlays
- Labels ARIA para controles del mapa
- Anuncio de cambios de estado
- Navegación por teclado funcional
- Touch targets de 44px mínimo

