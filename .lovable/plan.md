# Paneles internos por rol: una sola experiencia coherente

Objetivo: que cada tipo de usuario entre a **un solo panel** que le muestre lo que tiene que hacer hoy, con datos reales y sin menús duplicados.

## Problemas que se ven hoy

- El menú lateral repite "ADMINISTRACIÓN" dos veces (una del asesor, otra del admin) y mezcla 10+ grupos; con perfil admin se ven ~40 enlaces a la vez.
- Hay tres paneles distintos (asesor, inmobiliaria, admin) con tarjetas parecidas pero cálculos distintos; algunos indicadores quedan en 0 aunque sí existan datos (ventas del mes, visitas totales).
- El consultor/referido no tiene una vista propia: usa la de asesor, y su negocio real (referidos, comisiones, saldo) está repartido en varias páginas.
- El cliente comprador tiene `/comprador` pero no está conectado desde el resto del recorrido.

## Lo que se construye

### 1. Un menú por rol, no acumulado
- Un solo bloque de navegación según el rol activo (comprador / asesor / inmobiliaria / admin plataforma), con un selector de contexto arriba cuando alguien tiene más de un rol.
- Máximo 5 grupos visibles: Hoy, Proyectos, Ventas, Red comercial, Configuración. Administración de plataforma queda en un contexto aparte, no mezclado.
- Los enlaces que el plan contratado no incluye se muestran bloqueados con invitación a mejorar plan, en vez de desaparecer sin explicación.

### 2. Pantalla "Hoy" común, con contenido por rol
Una misma estructura (tarjetas de acción + pendientes + actividad) alimentada por rol:
- **Asesor/consultor**: leads sin contactar, visitas de hoy, reservas por vencer, comisiones por cobrar.
- **Consultor referido**: su código, referidos activos, comisiones ganadas/pagadas y saldo.
- **Inmobiliaria**: uso del plan, proyectos y unidades activas, ventas del mes del equipo, ranking de asesores.
- **Admin plataforma**: aprobaciones pendientes, nuevas inmobiliarias, pagos y suscripciones, incidencias de soporte.

### 3. Indicadores que cuadran
- Un único origen de cálculo para ventas, reservas, visitas, leads y comisiones, respetando el alcance del equipo (no solo proyectos propios).
- Cada tarjeta indica el periodo y enlaza a la lista filtrada que la origina, para poder auditar el número.
- Estados vacíos con acción clara ("aún no hay visitas — agendar la primera") en vez de un 0 sin contexto.

### 4. El cliente ve su avance
- `/comprador` enlazado desde reserva, correo de confirmación y ficha: línea de tiempo reserva → documentos → promesa → escritura, con su asesor a la vista.

### 5. Inmobiliarias que contratan el servicio
- Panel de empresa con equipo, asientos del plan, proyectos asignados, comisiones internas y reportes exportables, sin acceso a datos de otras empresas.

## Detalles técnicos

- Navegación: seguir usando `src/routes/routeManifest.tsx` como fuente única; agregar contexto de rol en `navGroupsFor` y reescribir `ModernSidebar` para renderizar un solo contexto a la vez.
- Métricas: consolidar `useDashboardData`, `useDashboardStats`, `useMultiProjectMetrics` y `useAgentPerformance` en un hook por alcance (`self` | `team` | `platform`) con `teamScope`.
- Paneles: `DashboardAsesor`, `DashboardInmobiliaria`, `DashboardAdmin` y el hub del broker pasan a componer bloques compartidos (`TodayPanel`, `KPIGrid`, `PipelineCard`, `ActivityFeed`).
- Sin cambios de esquema salvo índices si alguna consulta de equipo resulta lenta; se mantienen las RLS y funciones `SECURITY DEFINER` actuales.
- Verificación: `tsgo --noEmit`, `navLinks.test.ts`, build y recorrido con navegador por rol (comprador, asesor, inmobiliaria, admin).

## Orden de trabajo

1. Menú y contexto por rol (elimina la duplicación visible).
2. Hook único de métricas + pantalla "Hoy" para asesor e inmobiliaria.
3. Vista de consultor referido (comisiones y saldo) y panel de empresa.
4. Recorrido del comprador conectado y panel de admin plataforma.
