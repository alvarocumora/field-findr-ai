

# Plan: Compilacion y Mejoras Criticas de la Plataforma

## Diagnostico Completo

Tras revisar la base de datos, el codigo y la vista en vivo del proyecto, estos son los problemas reales encontrados:

### Problema 1: Mapa muestra solo 1 poligono de 47 lotes (CRITICO)

**Causa raiz**: De 47 lotes, solo el Lote 3 tiene un poligono real (80 puntos). Los otros 46 lotes tienen "poligonos" de 1 solo punto (son centroides, no poligonos). El algoritmo de reconstruccion del KMZ fallo para casi todos los lotes.

**Impacto**: El mapa es inutil - solo se ve 1 rectangulo blanco flotando.

**Solucion**: Cuando los lotes no tienen poligonos validos (menos de 3 puntos), el mapa debe generar rectangulos de grilla como fallback visual. Actualmente el codigo ya tiene esta logica pero la condicion `lotsWithPolygons.length > 0` se activa con los poligonos de 1 punto, saltandose el fallback de grilla.

Cambio en `LotMapView.tsx` (`generateLotGeoJSON`): filtrar poligonos que tengan al menos 3 puntos reales antes de decidir usar "poligonos reales" vs "grilla generada".

### Problema 2: Botones de admin visibles para todos los usuarios

**Causa raiz**: El usuario logueado es el dueno del proyecto, por lo que `readOnly` es `false` y se muestran botones de administracion (Master Plan, Dibujar Lotes, Importar KMZ, Regenerar). Pero estos botones no deberian mostrarse en la vista publica `/proyecto/:id` - solo en el panel de gestion `/asesor/projects`.

**Solucion**: Pasar una nueva prop `showAdminControls` que sea `false` por defecto en la pagina publica. Los botones de importar KMZ, regenerar y dibujar solo se muestran cuando `showAdminControls` es true.

### Problema 3: Rango de area incluye outliers (696 m2)

**Estado actual**: El filtro usa 500 m2 como minimo, pero algunos lotes con areas como 696 m2 o 956 m2 son probablemente erroneos tambien (para un proyecto de parcelas rurales).

**Solucion**: Usar el percentil 10-90 para calcular el rango mostrado, o subir el umbral minimo a 1000 m2 dado que es un proyecto de parcelas rurales. La solucion mas simple: ajustar el filtro a >= 2000 m2 para este tipo de proyecto.

Mejor aun: calcular el rango excluyendo outliers usando IQR (rango intercuartilico) para que funcione automaticamente con cualquier proyecto.

### Problema 4: Tarjetas de lotes vendidos muestran "8 dias en venta"

**Causa raiz**: El indicador de tiempo muestra "dias en venta" para todos los lotes, incluidos los vendidos. Para lotes vendidos deberia ocultarse o mostrar "Vendido".

**Solucion**: Ocultar el indicador de tiempo para lotes vendidos.

### Problema 5: Boton de contacto flotante tapa contenido

**Estado actual**: El boton "Llamar / WhatsApp" esta fijo en la esquina inferior derecha y tapa contenido del mapa y las tarjetas.

**Solucion**: Mover el contacto flotante a dentro del header como botones inline, eliminando el elemento fijo que tapa contenido. En movil, mantener la barra inferior pero agregar padding-bottom al contenido.

### Problema 6: Lote 3 tiene area de 59.939 m2 pero su poligono real solo ocupa una fraccion

El area reportada no coincide con el poligono visible. Esto es un problema de datos del KMZ que no se puede arreglar con codigo, pero se puede mejorar la experiencia.

## Archivos a Modificar

### 1. `src/components/lots/LotMapView.tsx`

**generateLotGeoJSON** - Corregir la logica de deteccion de poligonos validos:
- Cambiar `lot.polygon.length > 0` a `lot.polygon.length >= 3` en la verificacion de `lotsWithPolygons`
- Esto hara que los 46 lotes con 1 punto caigan al fallback de grilla, mostrando rectangulos organizados
- Mantener el Lote 3 con su poligono real si tiene 3+ puntos, pero generar grilla para los demas (modo mixto)

**Botones de admin** - Agregar prop `showAdminControls`:
- Mover los botones de Master Plan, Dibujar Lotes, Importar KMZ, Regenerar detras de `showAdminControls`
- Solo dejar visible el toggle Satelite/Calles para todos los usuarios

### 2. `src/pages/ProjectDetail.tsx`

**Contacto flotante** - Mover a inline en header:
- Eliminar el card flotante fijo en desktop
- Agregar botones "Llamar" y "WhatsApp" al lado de la ubicacion en el header
- En movil: mantener barra inferior pero agregar `pb-20` al contenido principal

**Rango de areas** - Mejorar filtro de outliers:
- Usar mediana y desviacion como referencia: excluir areas que sean menores al 10% de la mediana
- Mas simple: filtrar `>= 2000` para excluir lotes claramente erroneos del KMZ

**Pasar showAdminControls=false** al LotMapView en la pagina publica

### 3. `src/components/lots/EnhancedLotCard.tsx`

**Indicador de tiempo** - Ocultar para lotes vendidos:
- No mostrar "X dias en venta" cuando `status === 'sold'`
- Para lotes reservados, mantener "Reservado hace X dias"

## Seccion Tecnica

### Correccion de deteccion de poligonos validos

```text
// ANTES (linea 42):
const lotsWithPolygons = lots.filter(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length > 0);

// DESPUES:
const lotsWithPolygons = lots.filter(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length >= 3);
```

Esto es el cambio mas critico: con esta correccion, los 46 lotes con poligonos de 1 punto seran tratados como "sin poligono" y se generara una grilla visual funcional.

Para los lotes que SI tienen poligonos validos (como Lote 3), se necesita un enfoque mixto:

```text
// Generar features mezclando poligonos reales y grilla
lots.forEach((lot, index) => {
  const hasValidPolygon = lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length >= 3;
  
  if (hasValidPolygon) {
    // Usar poligono real
    features.push({ ... polygon real ... });
  } else {
    // Generar rectangulo en grilla
    features.push({ ... grilla generada ... });
  }
});
```

### Filtro de outliers mejorado

```text
// Calcular mediana de areas
const sortedAreas = [...areas].sort((a, b) => a - b);
const median = sortedAreas[Math.floor(sortedAreas.length / 2)];
// Excluir areas menores al 5% de la mediana o mayores a 10x la mediana
const reasonableAreas = areas.filter(a => a >= median * 0.05 && a <= median * 10);
```

### Prop showAdminControls

```text
interface LotMapViewProps {
  // ... existing props ...
  showAdminControls?: boolean; // new prop, default false
}
```

## Orden de Implementacion

1. **LotMapView.tsx** - Corregir deteccion de poligonos (cambiar `> 0` a `>= 3`), implementar modo mixto (real + grilla), agregar prop `showAdminControls`
2. **EnhancedLotCard.tsx** - Ocultar "dias en venta" para lotes vendidos
3. **ProjectDetail.tsx** - Pasar `showAdminControls={false}`, mover contacto a header inline, mejorar filtro de outliers con mediana, agregar padding bottom para movil

## Resultado Esperado

- Mapa muestra 47 lotes en grilla organizada (en vez de 1 poligono solitario)
- No se muestran botones de admin en la vista publica
- Rango de areas muestra valores representativos (ej: "10.000 - 71.180 m2")
- Lotes vendidos no muestran "dias en venta"
- Botones de contacto no tapan contenido

