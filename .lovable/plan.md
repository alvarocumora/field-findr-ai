
# Plan: Hacer la Plataforma de Proyectos Real y Funcional

## Problemas Identificados

### 1. Mapa Interactivo no carga (CRITICO)
El tab "Mapa Interactivo" muestra una pantalla de autenticacion de Lovable ("Authenticating... Setting up your access to the project") en lugar del mapa. Esto ocurre porque el proyecto tiene un `embed_map_url` que apunta a otro proyecto Lovable (`5c2c49b8...lovableproject.com`), y la condicion `isOwner && embed_map_url` carga ese iframe en lugar del `LotMapView` interno con Mapbox.

**Solucion**: Eliminar la logica de embed_map_url y siempre usar `LotMapView` para el mapa interactivo. El mapa embed no es funcional y bloquea al dueño del proyecto de ver sus propios lotes en el mapa.

### 2. Sidebar con datos hardcodeados (IMPORTANTE)
La seccion lateral del proyecto muestra valores fijos:
- "Rango de precios: $15.990.000 - $29.990.000" (hardcodeado)
- "Area por lote: 5.000 - 12.500 m2" (hardcodeado)

Los datos reales son: precios entre $15.990.000 y $29.990.000 (coincide por casualidad), pero las areas van de 23 m2 a 197.005 m2 (el hardcodeado esta muy lejos de la realidad).

**Solucion**: Calcular rango de precios y areas dinamicamente desde los lotes reales.

### 3. Galeria de imagenes hardcodeada
El tab "Galeria" usa `GALLERY_IMAGES` hardcodeadas que apuntan a `/projects/brisas-gallery-*.jpg`. No funciona para otros proyectos.

**Solucion**: Si el proyecto no tiene imagenes configuradas, mostrar un empty state con opcion de subir imagenes (para el owner). Para visitantes, ocultar el tab si no hay imagenes.

### 4. Lotes con datos de area incorrectos
Varios lotes tienen areas absurdas provenientes del KMZ (23 m2, 58 m2, 92 m2 o 197.005 m2). Esto afecta el precio/m2 mostrado (ej: Lote 11 muestra $173.804/m2 porque tiene 92 m2 de area).

**Solucion**: No se corregiran los datos existentes automaticamente (podrian ser intencionales), pero se agregara un indicador visual de advertencia en lotes con areas fuera de un rango razonable para loteos (< 500 m2 o > 100.000 m2).

### 5. Master Plan tab no es dinamico
El tab "Master Plan" no se mostro en la vista, pero el `masterPlanImageUrl` en `LotMapView` esta hardcodeado a `brisas-de-caone-masterplan.jpg`.

**Solucion**: Usar la imagen del proyecto si existe, o mostrar un empty state para subir master plan.

### 6. Lotes no se ordenan correctamente
Los lotes se muestran en orden 1, 10, 11, 12... en vez de 1, 2, 3, 4... porque `lot_number` es texto y el ordenamiento es alfabetico.

**Solucion**: Ordenar los lotes numericamente en el frontend.

### 7. Botones de contacto no funcionales
Los botones "Llamar ahora" y "Enviar mensaje" en la sidebar no hacen nada.

**Solucion**: Agregar acciones basicas - "Llamar" abre tel: con el telefono del owner (desde perfil), "Enviar mensaje" abre WhatsApp o un formulario de contacto simple.

## Archivos a Modificar

### `src/pages/ProjectDetail.tsx`
- Eliminar logica de `embed_map_url` - siempre usar `LotMapView`
- Calcular rango de precios y areas desde los datos reales de `lots`
- Ordenar lotes numericamente para el tab "Lotes"
- Reemplazar galeria hardcodeada con empty state dinamico
- Hacer funcionales los botones de contacto (tel: y mailto:)
- Agregar query para obtener el perfil del dueño del proyecto (telefono, email)

### `src/components/lots/EnhancedLotCard.tsx`
- Agregar indicador visual de area sospechosa (< 500 m2 o > 100.000 m2)
- Formatear area con separador de miles

### `src/components/lots/LotMapView.tsx`
- Eliminar hardcode de `masterPlanImageUrl`
- Recibir URL de master plan como prop desde el proyecto

## Seccion Tecnica

### Calculo dinamico de estadisticas
```text
const availableLots = lots.filter(l => l.status === 'available');
const prices = lots.filter(l => l.price).map(l => l.price);
const areas = lots.map(l => Number(l.area));
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const minArea = Math.min(...areas);
const maxArea = Math.max(...areas);
```

### Ordenamiento numerico de lotes
```text
const sortedLots = [...lots].sort((a, b) => {
  const numA = parseInt(a.lot_number) || 0;
  const numB = parseInt(b.lot_number) || 0;
  return numA - numB;
});
```

### Contacto del dueño
Se agregara una query al perfil del owner del proyecto para obtener telefono y email, usados en los botones de contacto.

## Orden de Implementacion
1. Arreglar mapa interactivo (eliminar embed_map_url)
2. Calcular estadisticas dinamicas en sidebar
3. Ordenar lotes numericamente
4. Hacer botones de contacto funcionales
5. Reemplazar galeria hardcodeada
6. Agregar indicador de area sospechosa en lotes
