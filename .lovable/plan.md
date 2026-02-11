
# Plan: Conectar Todo el Sistema a Datos Reales y Preparar para Ventas

## Diagnostico

Varios componentes criticos del sistema usan **datos mock hardcodeados** en lugar de la base de datos real:

| Componente | Estado Actual | Accion |
|---|---|---|
| SalesManagement | 100% mock (oportunidades, contratos, pagos) | Conectar a DB |
| PropertyInventory | 100% mock (propiedades hardcodeadas) | Conectar a useListings |
| LeadManagement | 100% mock (leads hardcodeados) | Conectar a useLeads |
| BusinessIntelligence | 100% mock (KPIs, graficos) | Conectar a queries reales |
| CRMSystem | Ya conectado a DB real | Sin cambios |
| DashboardAsesor | Ya conectado a DB real | Eliminar Layout duplicado |
| DashboardAdmin | Ya conectado a DB real | Eliminar Layout duplicado |

Ademas, DashboardAsesor y DashboardAdmin envuelven su contenido en el componente `Layout` legacy (que agrega un sidebar duplicado), cuando ya estan envueltos en `DashboardLayout` desde App.tsx.

## Cambios a Implementar

### 1. PropertyInventory - Conectar a datos reales

Reescribir para usar el hook `useListings` existente con filtro por `user_id` del agente:
- Reemplazar array `properties` hardcodeado por query real a tabla `listings`
- Mantener filtros de busqueda, tipo y estado pero contra datos reales
- Agregar acciones de editar/eliminar con mutaciones reales
- Incluir stats reales (total, activas, vendidas, vistas totales)

### 2. LeadManagement - Conectar a datos reales

Reescribir para usar el hook `useLeads` existente:
- Reemplazar `mockLeads` por datos de la tabla `leads`
- Conectar filtros de busqueda y estado a queries reales
- Habilitar acciones de crear/editar/eliminar lead con mutaciones
- Mostrar stats reales (total leads, por estado, tasa de conversion)

### 3. SalesManagement - Conectar a datos reales

Conectar el pipeline de ventas a datos de las tablas `reservations`, `lots` y `leads`:
- Pipeline visual: calcular conteos reales por estado de lead
- Oportunidades: mostrar leads con sus datos reales (presupuesto, proyecto asociado, estado)
- Contratos: mostrar reservaciones con estado `paid` o `converted`
- Stats: calcular pipeline total, deal promedio y tasa de conversion desde DB

### 4. BusinessIntelligence - Conectar a datos reales

Reemplazar KPIs y graficos hardcodeados:
- Ingresos totales: sumar precios de lotes vendidos
- Unidades vendidas: contar lotes con status `sold`
- Leads activos: contar leads no perdidos/convertidos
- Tendencias: calcular variacion mes a mes
- Grafico por region: agrupar ventas/listings por region desde DB

### 5. Eliminar Layout duplicado de Dashboards

DashboardAsesor y DashboardAdmin ya estan envueltos en `DashboardLayout` (que incluye sidebar), pero internamente tambien usan `<Layout>` que agrega OTRO sidebar. Esto causa un sidebar doble.

Cambios:
- `DashboardAsesor`: eliminar wrapper `<Layout>`, dejar solo el contenido
- `DashboardAdmin`: eliminar wrapper `<Layout>`, dejar solo el contenido
- `ProjectsManagement`: eliminar wrapper `<Layout>`, dejar solo el contenido

### 6. Sidebar mejorado para ejecutivos

Agregar items de navegacion faltantes al sidebar de agente:
- Reservas (`/asesor/reservations`) - nueva ruta
- Documentos (link a gestion de documentos)

Agregar al sidebar de admin:
- Reservas (`/admin/reservations`) - nueva ruta
- Listings (`/admin/listings`) - ya existe la ruta

### 7. Ruta de Reservas para Agente

Crear ruta `/asesor/reservations` que muestre el `ReservationsManager` filtrado por proyectos del agente, para que pueda gestionar las reservas de sus propios lotes.

## Detalle Tecnico

### Archivos a modificar:
- `src/components/PropertyInventory.tsx` - Reescribir con useListings + useAuth
- `src/components/LeadManagement.tsx` - Reescribir con useLeads real
- `src/components/SalesManagement.tsx` - Conectar a reservations/lots/leads
- `src/components/BusinessIntelligence.tsx` - Conectar a queries reales
- `src/pages/dashboard/DashboardAsesor.tsx` - Eliminar `<Layout>` wrapper
- `src/pages/dashboard/DashboardAdmin.tsx` - Eliminar `<Layout>` wrapper
- `src/components/ProjectsManagement.tsx` - Eliminar `<Layout>` wrapper
- `src/components/ModernSidebar.tsx` - Agregar items de Reservas y Documentos
- `src/App.tsx` - Agregar ruta `/asesor/reservations`

### Hooks existentes reutilizados (no se crean nuevos):
- `useListings` - para PropertyInventory
- `useLeads` - para LeadManagement y SalesManagement
- `useAuth` - para filtrar por usuario
- `useDashboardStats` - para BusinessIntelligence (ampliar)

### Hook a ampliar:
- `useDashboardStats.ts` - Agregar `useBusinessIntelligence()` que calcule KPIs reales desde lots, leads y reservations

## Resultado

Un sistema SaaS profesional donde TODOS los componentes de gestion muestran datos reales de la base de datos, sin mock data, listo para demostracion y venta a clientes.
