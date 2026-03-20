

# Plan: Sistema Mejorado de Visualización de Lotes con Vista 3D y Reserva

## Resumen

Rediseñar la experiencia de ProjectDetail para que al seleccionar un lote, el usuario vea una ficha expandida con vista 3D del terreno real (usando la georeferencia/polígono existente), documentos del proyecto, y botones prominentes de "Reservar" y "Diseñar Parcela". Mejorar las cards de lotes con miniatura 3D y mejor jerarquía visual.

---

## Cambios

### 1. Nuevo componente: `LotDetailSheet` (Sheet/Drawer lateral)

**Archivo:** `src/components/lots/LotDetailSheet.tsx`

Cuando el usuario hace clic en un lote (desde el mapa o la grilla de cards), se abre un Sheet lateral con:

- **Header**: Número de lote, estado (badge), precio, superficie, precio/m2
- **Vista 3D embebida**: `ParcelaDesigner3D` (ya existe) con el polígono del lote, usando `RealisticTerrain` si tiene lat/lng. Tamaño compacto (~350px alto)
- **Sección de servicios**: Agua, luz, acceso (badges existentes)
- **Sección de documentos**: Lista de documentos legales del proyecto (reutilizando datos de `LegalTab`)
- **Topografía**: Elevación promedio y categoría de pendiente (datos de `elevation_avg` y `slope_category`)
- **Botones de acción prominentes**:
  - "Reservar este Lote" → abre `LotReservationDialog`
  - "Diseñar Mi Parcela" → navega a vista 3D completa o abre `ParcelaDesigner3D` en fullscreen
  - "Simular Financiamiento" → abre `FinancingCalculator`

### 2. Cards de lotes mejoradas

**Archivo:** `src/components/lots/EnhancedLotCard.tsx` (modificar)

- Agregar indicador visual de pendiente/topografía (ícono montaña + slope_category)
- Botón "Ver en 3D" que abre el `LotDetailSheet`
- Miniatura del polígono del lote como SVG inline (si tiene polygon data)
- Reorganizar acciones: "Ver 3D" prominente para disponibles, "Reservar" como CTA primario

### 3. Integración en ProjectDetail

**Archivo:** `src/pages/ProjectDetail.tsx` (modificar)

- Reemplazar el "Selected Lot Quick View" actual (card bajo el mapa, líneas 470-511) por el nuevo `LotDetailSheet`
- Cuando se clickea un lote en el mapa o en la grilla, abrir el Sheet con la data completa
- Conectar el botón "Diseñar Parcela" con `ParcelaDesigner3D` en un Dialog fullscreen
- Pasar documentos legales del proyecto al Sheet

### 4. Vista 3D fullscreen para diseño

**Archivo:** `src/components/lots/LotDesigner3DDialog.tsx` (crear)

- Dialog fullscreen que envuelve `ParcelaDesigner3D`
- Recibe el polígono, lat/lng, y datos del lote
- Botón de guardar diseño (ya soportado via `onSave` → `parcel_design` en reservations)
- Incluye `HouseSimulator` integrado para colocar casa sobre terreno real

---

## Archivos a Crear
1. `src/components/lots/LotDetailSheet.tsx` — Sheet lateral con vista 3D + acciones
2. `src/components/lots/LotDesigner3DDialog.tsx` — Dialog fullscreen para diseño 3D

## Archivos a Modificar
1. `src/components/lots/EnhancedLotCard.tsx` — Miniatura SVG del polígono, botón "Ver 3D", topografía
2. `src/pages/ProjectDetail.tsx` — Integrar LotDetailSheet, reemplazar quick view

## Sin cambios de base de datos
Todos los datos necesarios (polygon, lat/lng, elevation_avg, slope_category) ya existen en la tabla `lots`.

---

## Flujo del Usuario

```text
[Grilla de Lotes] o [Mapa] 
  → Click en lote
  → LotDetailSheet se abre (lateral)
     ├── Vista 3D compacta del terreno real
     ├── Info: precio, área, servicios, topografía
     ├── Documentos del proyecto
     └── Botones:
         ├── [Reservar] → LotReservationDialog
         ├── [Diseñar Parcela] → LotDesigner3DDialog (fullscreen)
         └── [Simular] → FinancingCalculator
```

