

# Plan: Nuevo Sistema de Listado, Explorador y Herramientas para Operadores

## Estado Actual

La plataforma tiene una base solida: landing cinematic con hero parallax, explorador split-view con mapa Mapbox, sistema de listings con CRUD basico, dashboards para agentes/admin, y herramientas IA. Sin embargo hay areas criticas que mejorar:

1. **Listing Form incompleto**: `ListingFormDialog` usa tipos incorrectos (`parcela`, `terreno`) que no coinciden con los tipos reales del sistema (`parcela_rural`, `sitio_industrial`, etc.). No incluye subida de imagenes, ubicacion en mapa, tags ni servicios.
2. **PropertyInventory basico**: Vista de tabla simple sin metricas de rendimiento por propiedad, sin acciones en lote, sin vista de kanban.
3. **ExploreListPanel**: Las tarjetas `QuickPropertyCard` son compactas pero falta un modo grid alternativo y filtros visuales mas intuitivos.
4. **Herramientas para operadores**: Faltan herramientas especificas para desarrolladores de loteos como: analisis de factibilidad, generador de fichas de venta, pipeline visual de ventas, y tablero de avance de proyecto.

---

## Mejoras a Implementar

### 1. Nuevo Formulario de Publicacion Mejorado (ListingFormDialog v2)

Reescribir `ListingFormDialog` como un wizard multi-paso:
- **Paso 1**: Datos basicos (titulo, tipo correcto `parcela_rural`/etc, descripcion con generador IA)
- **Paso 2**: Ubicacion con mapa picker (reutilizar `LocationPicker` existente)
- **Paso 3**: Precio, area, moneda, servicios (agua, luz, camino), tags
- **Paso 4**: Imagenes (reutilizar `ImageUploader` existente) + preview

**Archivo**: `src/components/listings/ListingFormDialog.tsx` (reescribir)

### 2. PropertyInventory Mejorado con Vista Kanban

Redisenar `PropertyInventory` con:
- **Vista tabla** mejorada con columnas: imagen thumbnail, titulo, precio, area, status, vistas, fecha, acciones
- **Vista kanban** con columnas por status (Activa, Reservada, Vendida, Inactiva)
- Acciones en lote: cambiar status, eliminar multiples
- Metricas rapidas: total activas, reservadas, vendidas, vistas totales

**Archivo**: `src/components/PropertyInventory.tsx` (reescribir)

### 3. Explorador con Modo Grid/Lista Toggle

Agregar toggle en `ExploreListPanel` para alternar entre:
- **Vista compacta** (actual - tarjetas horizontales)
- **Vista grid** (tarjetas verticales tipo ListingCard en 2 columnas)

**Archivo**: `src/components/explore/ExploreListPanel.tsx` (modificar)

### 4. Panel de Herramientas para Operadores/Desarrolladores

Crear nueva seccion en el sidebar del asesor con herramientas especializadas:

- **Pipeline de Ventas** (`/asesor/pipeline`): Vista kanban del embudo de ventas (Lead > Contactado > Interesado > Negociando > Reserva > Cierre) con drag conceptual
- **Fichas de Venta PDF** (`/asesor/listings` mejorado): Boton "Generar ficha" en cada propiedad que use `propertyPdfGenerator` existente
- **Tablero de Avance** (`/asesor/projects` mejorado): Progress bars por proyecto (lotes disponibles vs vendidos vs reservados)
- **Calculadora de Rentabilidad** en Tools: ROI estimado, TIR, costo por m2 de desarrollo

**Archivos nuevos**:
- `src/pages/dashboard/SalesPipeline.tsx` - Pipeline visual de ventas

**Archivos a modificar**:
- `src/components/ModernSidebar.tsx` - Agregar link a Pipeline
- `src/App.tsx` - Agregar ruta `/asesor/pipeline`
- `src/components/ProjectsManagement.tsx` - Agregar barra de progreso por proyecto

---

## Detalle Tecnico

### ListingFormDialog v2 - Cambios Clave
- Corregir tipos: usar `parcela_rural`, `sitio_industrial`, `campo_agricola`, `terreno_urbano`, `terreno_costero`, `terreno_montana`
- Integrar `ImageUploader` para subida a storage bucket `property-images`
- Integrar `LocationPicker` para lat/lng
- Agregar campo de tags con checkboxes (agua, luz, camino, riego, bosque, vista, playa, lago)
- Agregar campo utilities (JSON)
- Wizard de 4 pasos con Tabs o stepper

### PropertyInventory v2
- Agregar toggle vista tabla/kanban
- En kanban: columnas `active`, `reserved`, `sold`, `inactive` con cards draggables (visual, sin dnd-kit)
- Stats bar: 4 KPI cards (total, activas, reservadas, vendidas)
- Boton "Generar Ficha PDF" por propiedad

### SalesPipeline
- Query leads del usuario agrupados por status
- Columnas visuales: new > contacted > interested > negotiating > converted
- Cada card muestra: nombre, telefono, proyecto, lead score badge
- Click abre lead detail

### Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `src/components/listings/ListingFormDialog.tsx` | Reescribir como wizard 4 pasos |
| `src/components/PropertyInventory.tsx` | Agregar vista kanban + stats + PDF |
| `src/components/explore/ExploreListPanel.tsx` | Agregar toggle grid/lista |
| `src/pages/dashboard/SalesPipeline.tsx` | Crear pipeline visual de leads |
| `src/components/ModernSidebar.tsx` | Agregar enlace Pipeline |
| `src/App.tsx` | Agregar ruta /asesor/pipeline |

No se requieren migraciones SQL - toda la data ya existe en las tablas `listings`, `leads`, `projects`, `lots`.

