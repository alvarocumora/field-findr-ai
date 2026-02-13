

# Plan: Mejorar Landing Page y Explorar con Mapa Funcional

## Estado Actual

**Landing Page:**
- Hero con busqueda funcional pero sin diferenciacion visual fuerte
- Stats muestran 0 valores (los counts de la DB son correctos pero `totalLots` cuenta todos los lotes, no solo disponibles)
- Seccion "Terrenos Destacados" + MiniMap funciona bien con 20 listings reales
- Seccion "Como Funciona" orientada solo a desarrolladores (sube proyecto, configura lotes) - excluye compradores
- "Proyectos Destacados" solo muestra 1 proyecto activo (datos reales limitados)
- TrustBadges son genericos y estaticos
- FloatingCTA dice "47 lotes disponibles" pero usa totalLots sin filtrar por status

**Explorar:**
- Mapa muestra un poligono azul gigante en vez de marcadores de propiedades (posible problema de capa GIS activa)
- Split view funcional con panel de filtros
- "Nuevos 0" porque ningun listing tiene menos de 7 dias
- "Mejor oportunidad" calcula bien el precio/m2 mas bajo ($350/m2 para Aysen de 1M m2)

## Problemas Criticos

### 1. Mapa de Explorar muestra poligono azul en vez de marcadores
El mapa muestra lo que parece ser una capa de zonificacion demo (poligono azul grande) sobre los marcadores. Las capas GIS demo (`generateDemoZoningData`) se inicializan automaticamente. Los marcadores de propiedades quedan detras o no se ven.

### 2. Stats de landing calculan mal
`useLandingStats` cuenta `totalLots` sin filtrar por `status = 'available'`, mostrando 47 (incluye vendidos y reservados). `totalReservations` filtra por `status = 'paid'` pero las reservaciones reales usan el enum `reservation_status`.

### 3. "Como Funciona" excluye al comprador
Los 4 pasos (Sube proyecto, Configura lotes, Recibe reservas, Cierra ventas) solo hablan al desarrollador/vendedor. La mayoria de visitantes del landing son compradores.

### 4. FloatingCTA usa dato incorrecto
Muestra "47 lotes disponibles" sin filtrar por status available.

## Solucion

### Archivo 1: `src/hooks/useLandingStats.ts`
- Filtrar `totalLots` por `status = 'available'` para mostrar solo disponibles
- Calcular `totalReservations` correctamente o reemplazar por metrica mas util (ej: totalSold)

### Archivo 2: `src/pages/Index.tsx` - Landing mejorada
- Reemplazar seccion "Como Funciona" con version dual: para compradores (Explora, Compara, Reserva, Compra) y para vendedores (Sube, Configura, Vende, Cierra)
- Agregar seccion de regiones populares con cards clickables que lleven a /explorar con filtro
- Mejorar la seccion de featured listings: mostrar 6 en grid 3x2 sin mini-map (el mapa va en explorar) para mayor impacto visual

### Archivo 3: `src/components/landing/HowItWorks.tsx` - Orientado a compradores
- Cambiar los 4 pasos a la perspectiva del comprador:
  1. Explora el mapa (Search)
  2. Compara terrenos (BarChart3)
  3. Reserva online (CreditCard)
  4. Cierra tu compra (CheckCircle2)
- Agregar un toggle o subtexto que mencione "Para desarrolladores" con link a /pricing

### Archivo 4: `src/components/landing/RegionCards.tsx` (NUEVO)
- Grid de cards con las regiones mas populares (basado en datos reales: O'Higgins 3, Metropolitana 3, Valparaiso 2, etc.)
- Cada card muestra: nombre de region, cantidad de terrenos, rango de precios
- Click navega a `/explorar?region=X`

### Archivo 5: `src/components/map/EnhancedMap.tsx` - Fix del mapa de Explorar
- Revisar la inicializacion de capas info (zoning, risk, etc.) - asegurarse que estan desactivadas por defecto
- Verificar que los marcadores de propiedades se renderizan SOBRE cualquier capa activa (z-index)
- El estado inicial `infoLayers` ya tiene todo en `false`, pero hay que verificar que `addInfoLayers` no se ejecuta sin que el usuario lo active

### Archivo 6: `src/components/landing/FloatingCTA.tsx`
- Cambiar de `totalLots` a dato filtrado (lotes available)

### Archivo 7: `src/components/landing/HeroStats.tsx`
- Cambiar "Lotes disponibles" para usar el count filtrado
- Reemplazar "Publicaciones activas" (poco util para el visitante) por "Hectareas disponibles" calculando la suma de areas

## Seccion Tecnica

### Fix de useLandingStats
```text
// Agregar filtro de status a la query de lots
supabase.from('lots').select('id', { count: 'exact', head: true }).eq('status', 'available')

// Agregar query de hectareas totales
supabase.from('listings').select('area_ha').eq('status', 'active').not('area_ha', 'is', null)
```

### Fix del mapa de Explorar
El mapa inicializa con `infoLayers` todo en false, pero la funcion `addInfoLayers` podria estar ejecutandose en el evento `style.load`. Hay que verificar que los poligonos demo de zonificacion no se agregan automaticamente.

### Regiones populares - query
```text
// Reutilizar datos existentes de listings para calcular regiones
const regionData = listings.reduce((acc, l) => {
  if (l.region) {
    acc[l.region] = (acc[l.region] || 0) + 1;
  }
  return acc;
}, {});
```

## Orden de Implementacion

1. `useLandingStats.ts` - Fix de conteos (lots available, hectareas)
2. `EnhancedMap.tsx` - Verificar y corregir renderizado de marcadores vs capas
3. `HowItWorks.tsx` - Reorientar a compradores
4. `HeroStats.tsx` - Metricas relevantes para visitantes
5. `FloatingCTA.tsx` - Dato correcto
6. `RegionCards.tsx` - Nueva seccion de regiones
7. `Index.tsx` - Integrar RegionCards, mejorar grid de featured

