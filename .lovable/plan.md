
# Plan: Integrar KMZ en el Wizard + Mejoras Generales de la Plataforma

## 1. Integrar importacion KMZ como paso 5 del wizard

### Problema actual
Despues de crear un proyecto, el usuario debe volver a la lista, buscar el proyecto recien creado, y hacer click en "Importar KMZ". Es un flujo roto.

### Solucion
Agregar un paso opcional (paso 4) entre "Lotes" y "Resumen" en el `CreateProjectWizard`. Este paso permite:
- Cargar un archivo KMZ/KML (opcional, se puede saltar)
- Ver preview de lotes detectados (cantidad, nombres, areas)
- Configurar precio base para lotes nuevos
- Al crear el proyecto, importar los lotes automaticamente

### Archivos a modificar

**`src/components/projects/CreateProjectWizard.tsx`**:
- Agregar paso 4 "Importar KMZ" (el resumen pasa a ser paso 5)
- STEPS pasa de 4 a 5 items, con icono `FileArchive` para el nuevo paso
- Agregar estado para `kmzFile`, `parsedKMZ` (ParsedKMZ | null), y `skipKmz`
- En el paso 4: zona de drag-and-drop para KMZ, boton "Saltar este paso"
- Si se carga un KMZ: mostrar preview (cantidad de lotes detectados, areas)
- En `handleSubmit`: primero crear el proyecto, luego si hay KMZ parsado, insertar los lotes en batch usando el projectId retornado
- Reutilizar la logica de parseo de `parseKMZFile`/`parseKMLFile` del modulo `@/lib/kmz`
- La logica de insercion de lotes se extrae de `KMZImportDialog` (calcular centroides, crear poligonos GeoJSON, insertar en `lots`)

**`src/components/projects/CreateProjectWizard.tsx` - Paso Resumen (ahora paso 5)**:
- Mostrar resumen de KMZ importado si aplica (X lotes seran creados)
- Mantener el badge de "podras importar KMZ despues" solo si se salto el paso

## 2. Mejoras generales de usabilidad

### 2a. Empty states informativos en todas las secciones

**Archivos a modificar**: `ReservationsManager.tsx`, `CreditManager.tsx`, `ClosingManager.tsx`, `SalesManagement.tsx`

En cada seccion, cuando no hay datos, mostrar:
- Icono grande relevante
- Titulo explicativo ("No tienes reservas aun")
- Texto que explica como llegar ahi ("Las reservas se crean desde la pagina del proyecto cuando un comprador reserva un lote")
- Boton de accion primaria cuando aplique ("Ir a Proyectos" o "Crear Lead")

### 2b. Dashboard con accesos directos contextuales

**Archivo a modificar**: `DashboardAsesor.tsx`

Agregar seccion "Acciones rapidas" con botones grandes:
- "Crear Proyecto" -> abre dialog de wizard
- "Importar Lotes" -> navega a /asesor/projects
- "Ver Mapa" -> navega a /explorar
- "Agregar Lead" -> abre LeadFormDialog

### 2c. Navegacion mejorada con contadores

**Archivo a modificar**: `ModernSidebar.tsx`

Agregar badges con contadores en el sidebar:
- "Reservas" -> mostrar count de reservas pendientes
- "Leads" -> mostrar count de leads nuevos
- "Creditos" -> mostrar count de cuotas vencidas

Esto requiere un hook nuevo `useSidebarCounts` que haga queries ligeras para contar registros pendientes.

### 2d. Confirmacion de eliminacion de proyectos

**Archivo a modificar**: `ProjectsManagement.tsx`

Agregar boton de eliminar proyecto con AlertDialog de confirmacion que advierte sobre lotes asociados.

## Detalles tecnicos del paso KMZ en el wizard

La logica de importacion de lotes en el wizard sera mas simple que en `KMZImportDialog` porque no necesita sincronizar con lotes existentes (el proyecto es nuevo):

```text
1. Usuario carga archivo KMZ/KML
2. Se parsea con parseKMZFile() / parseKMLFile()
3. Se muestra preview: cantidad de lotes, area total estimada
4. Al hacer submit:
   a. Crear proyecto -> obtener projectId
   b. Para cada placemark: insertar lot con polygon, area, centroid
   c. Actualizar project con coordenadas centrales del KMZ
```

Para modo edicion (proyecto existente), el paso KMZ mostrara un boton "Importar KMZ" que abre el `KMZImportDialog` existente como dialog separado, ya que ese componente maneja la logica de sincronizacion con lotes existentes.

## Orden de implementacion

1. Modificar `CreateProjectWizard.tsx` - agregar paso KMZ (cambio principal)
2. Mejorar empty states en `ReservationsManager`, `CreditManager`, `ClosingManager`
3. Agregar acciones rapidas al `DashboardAsesor`
4. Agregar confirmacion de eliminacion en `ProjectsManagement`
5. Crear `useSidebarCounts` hook y actualizar `ModernSidebar`

## Resultado esperado

- Flujo completo de creacion de proyecto en un solo wizard (datos -> ubicacion -> lotes -> KMZ -> resumen)
- El loteador puede crear un proyecto con lotes importados en menos de 2 minutos
- Todas las secciones vacias guian al usuario sobre que hacer
- Dashboard con accesos directos utiles
- Sidebar con indicadores de items pendientes
