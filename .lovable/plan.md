
# Plan: Wizard Multi-Paso para Creacion de Proyectos

## Problema Actual

El formulario de creacion de proyectos en `ProjectsManagement.tsx` es un dialog simple con solo 4 campos (nombre, ubicacion texto libre, total lotes, descripcion). No aprovecha los campos disponibles en la tabla `projects` (latitude, longitude, region, city, address, total_area, rol_number) ni ofrece mapa interactivo.

## Solucion

Crear un componente `CreateProjectWizard` con 4 pasos que reemplaza el dialog actual, reutilizando el `LocationPicker` existente para seleccion de ubicacion con mapa.

## Pasos del Wizard

### Paso 1: Datos Basicos
- Nombre del proyecto (requerido)
- Descripcion
- Estado inicial (planning/active)
- ROL SII del terreno

### Paso 2: Ubicacion con Mapa
- Mapa interactivo con `LocationPicker` (click para colocar marcador, arrastrar para ajustar)
- Selector de Region (usando `CHILE_REGIONS` de `latam.ts`)
- Campo de Ciudad/Comuna
- Direccion (auto-completada por reverse geocoding del mapa)
- Coordenadas lat/lng se guardan automaticamente al hacer click en el mapa

### Paso 3: Configuracion de Lotes
- Total de lotes
- Superficie total (m2)
- Precio base por lote (opcional)
- Precio por m2 (opcional, calculado automaticamente)

### Paso 4: Resumen y Confirmacion
- Vista previa de todos los datos ingresados
- Indicador de que puede importar KMZ despues de crear
- Boton de crear proyecto

## Archivos a Crear

### `src/components/projects/CreateProjectWizard.tsx`
Componente wizard de 4 pasos con:
- Barra de progreso con iconos por paso
- Navegacion atras/adelante con validacion por paso
- Reutiliza `LocationPicker` para el paso 2
- Usa `CHILE_REGIONS` de `latam.ts` para el selector de region
- Al completar, llama a `createProject.mutateAsync()` con todos los campos

## Archivos a Modificar

### `src/components/ProjectsManagement.tsx`
- Reemplazar el `Dialog` simple de creacion (lineas 105-162) por el nuevo `CreateProjectWizard` dentro de un `Dialog` mas amplio (`max-w-3xl`)
- Eliminar el estado `newProject` y la funcion `handleCreateProject` (la logica se mueve al wizard)
- Mantener todo lo demas igual (stats, cards, KMZ import, search)

## Detalles Tecnicos

- El wizard es un componente controlado con estado interno de paso y datos del formulario
- Paso 2 usa `LocationPicker` que ya implementa reverse geocoding con Mapbox
- Al recibir callback de `onLocationSelect`, se auto-completan address, city, region
- La validacion por paso previene avanzar sin datos requeridos (paso 1: nombre obligatorio)
- El wizard no necesita migracion SQL porque todos los campos ya existen en la tabla `projects`

## Resultado

El boton "Nuevo Proyecto" abre un wizard profesional de 4 pasos con mapa interactivo, selector de region chilena, y configuracion de lotes, en lugar del formulario basico actual.
