
# Plan: Reconstruir la Pagina de Detalle de Proyecto

## Problemas Detectados

1. **Tab Master Plan vacio**: Tiene el boton de tab pero no tiene contenido (`TabsContent` faltante)
2. **Mapa muestra solo 1 poligono**: Los 47 lotes tienen datos de poligono pero solo se ve 1 en el mapa. Probablemente los poligonos son muy pequenos o mal generados por el KMZ
3. **Leyenda del mapa hardcodeada**: Muestra precios fijos ($15.990.000, $17.990.000, etc.) en lugar de valores dinamicos
4. **Tarjetas de lotes redundantes**: Muestran "Lote-1" como nombre debajo del numero "1", info excesiva para vista publica
5. **Rango de areas sin sentido**: "23 - 197.005 m2" refleja datos corruptos del KMZ (lotes de 23 m2 y 58 m2 son claramente erroneos)
6. **Sidebar ocupa mucho espacio**: En desktop la sidebar 1/4 comprime demasiado las 3 columnas de tarjetas

## Solucion

Reescribir `ProjectDetail.tsx` con una estructura mas limpia y funcional, y corregir los componentes dependientes.

## Cambios por Archivo

### 1. `src/pages/ProjectDetail.tsx` - Reestructuracion completa

**Layout**: Cambiar de grid `lg:grid-cols-4` (3+1) a layout de 2 secciones:
- Zona principal full-width para mapa y lotes
- Sidebar solo visible en desktop, mas compacta

**Tabs simplificados**: Reducir de 6 tabs a 3 tabs funcionales:
- **Mapa** (combina Mapa Interactivo + Master Plan en un solo tab con toggle satellite/masterplan)
- **Lotes** (grid de tarjetas simplificadas)
- **Info** (combina Legal + Galeria en un solo tab)
- Eliminar tab "Master Plan" vacio y tab "IA Analisis" (solo confunde al publico)

**Resumen movido arriba**: Las stats (disponibles/reservados/vendidos, precio, area) se muestran como barra horizontal compacta debajo del header, no en sidebar

**Contacto sticky**: El card de contacto se muestra como barra fija en la parte inferior en movil, y como sidebar sticky en desktop

### 2. `src/components/lots/LotMapView.tsx` - Leyenda dinamica

**Leyenda**: Reemplazar precios hardcodeados ($15.990.000, $17.990.000, etc.) con leyenda simplificada basada en status:
- Disponible (verde)
- Reservado (amarillo)
- Vendido (gris)

Eliminar la categorizacion por rangos de precio en la leyenda ya que es especifica de un solo proyecto.

**Altura del mapa**: Aumentar de `h-[500px]` a `h-[600px]` para mejor visualizacion

**MasterPlan hardcodeado**: Linea 157 aun referencia `/projects/brisas-de-caone-masterplan.jpg` cuando hay `kmzFileUrl`. Cambiar a `null` siempre (no hay imagen de master plan guardada en el proyecto).

### 3. `src/components/lots/EnhancedLotCard.tsx` - Simplificar tarjetas

Reducir las tarjetas para la vista publica:
- Eliminar campo "name" redundante ("Lote-1") que solo repite el numero
- Eliminar seccion de servicios (agua, luz, acceso) si no hay datos reales configurados
- Hacer el precio/m2 mas prominente solo cuando el area esta en rango razonable (500-100.000 m2)
- Ocultar precio/m2 cuando el area es sospechosa (evitar "$173.804/m2" por area de 92 m2)
- Reducir padding y espaciado para cards mas compactas

### 4. `src/pages/ProjectDetail.tsx` - Barra de stats horizontal

Reemplazar la sidebar Card "Resumen del Proyecto" con una barra horizontal compacta debajo del header:

```text
[22 disponibles] [1 reservado] [24 vendidos] | Desde $15.990.000 | 5.000 - 60.000 m2
```

Filtrar areas atipicas (< 500 m2) del calculo de rango de area para mostrar un rango mas representativo.

### 5. `src/pages/ProjectDetail.tsx` - Contacto mejorado

En movil: barra fija inferior con botones "Llamar" y "WhatsApp" siempre visibles
En desktop: card de contacto sticky en la parte superior derecha dentro del tab de lotes

## Seccion Tecnica

### Filtro de areas atipicas para estadisticas
```text
// Filtrar areas absurdas del rango mostrado
const reasonableAreas = areas.filter(a => a >= 500 && a <= 100000);
const areaRange = reasonableAreas.length > 0
  ? { min: Math.min(...reasonableAreas), max: Math.max(...reasonableAreas) }
  : null;
```

### Leyenda dinamica del mapa
```text
// Reemplazar leyenda hardcodeada con leyenda por status
<div className="flex items-center gap-2">
  <div className="w-4 h-4 rounded bg-emerald-500" />
  <span>Disponible</span>
</div>
<div className="flex items-center gap-2">
  <div className="w-4 h-4 rounded bg-amber-500" />
  <span>Reservado</span>
</div>
<div className="flex items-center gap-2">
  <div className="w-4 h-4 rounded bg-gray-400" />
  <span>Vendido</span>
</div>
```

### Correccion del masterPlanImageUrl
```text
// Antes (hardcodeado):
const masterPlanImageUrl = kmzFileUrl ? '/projects/brisas-de-caone-masterplan.jpg' : null;
// Despues:
const masterPlanImageUrl = null; // No hay master plan guardado
```

## Orden de Implementacion

1. Corregir `LotMapView.tsx` - leyenda dinamica, eliminar hardcode de masterplan, altura 600px
2. Simplificar `EnhancedLotCard.tsx` - eliminar nombre redundante, ocultar precio/m2 con area sospechosa
3. Reescribir `ProjectDetail.tsx` - nuevo layout con stats horizontal, tabs simplificados (3 en vez de 6), contacto sticky en movil, filtro de areas atipicas

## Resultado Esperado

- Mapa ocupa todo el ancho disponible con leyenda por status (no por precio)
- Stats compactas en barra horizontal debajo del header
- Solo 3 tabs funcionales (Mapa, Lotes, Info)
- Tarjetas de lotes mas limpias sin info redundante
- Contacto siempre accesible (sticky en movil)
- Rango de area filtrado para excluir valores absurdos del KMZ
