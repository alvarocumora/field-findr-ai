# Revisión del panel de administración y funciones

Fecha local: 29 de octubre de2026 (Chile). Base anterior a esta entrega: main296bc13.

## Resultado

Se revisó la estructura de25 entradas admin y una muestra dirigida de sus pantallas, consultas y acciones. El inicio tenía tablas y filtros duplicados de los gestores, botones de notificaciones/configuración sin acción, usuarios con estado activo inventado en el resumen y una métrica «GMV» que sumaba depósitos de reservas. Esa cifra no acreditaba volumen de ventas.

La entrega convierte el inicio en un centro operativo: pendientes, cuatro métricas verificables y accesos a los gestores canónicos. No reemplaza los módulos de operación ni ejecuta sus acciones sensibles durante la revisión.

## Cambios aplicados

- Inicio organizado en usuarios/empresas, aprobaciones/brokers, operación comercial, ventas/comisiones y atención/auditoría. Los botones llevan a rutas existentes; se eliminan controles sin implementación del inicio anterior.
- Los usuarios y sus roles se gestionan desde /admin/users; reservas, documentos y auditoría desde sus módulos, sin una segunda interfaz simplificada dentro del dashboard.
- El resumen usa cuatro consultas HEAD paralelas con count exact: perfiles, publicaciones activas no demo, proyectos activos y documentos transaccionales por revisar. No descarga filas privadas para esos conteos ni suma depósitos como ventas.
- Un error o ausencia de count invalida el resumen; cero se acepta únicamente como conteo verificado. El resto de la navegación permanece disponible con reintento. La caché del resumen incluye la identidad del administrador.
- Documentos por revisar cuenta pending/uploaded/under_review de transaction_documents, la fuente del gestor de documentos operativos. No mezcla archivos de otra tabla con ese indicador.
- Accesos antiguos /admin/dashboard?tab=… redirigen al gestor correspondiente y conservan los parámetros restantes y hash. properties conduce a aprobaciones de publicaciones; no promete ser un listado completo de todas las publicaciones.
- Colas de aprobación de propiedades/loteos distinguen fallo de consulta de ausencia de pendientes. Su encabezado distingue carga de un conteo vacío.
- La gestión de brokers espera ambas fuentes (postulaciones/perfiles) y muestra reintento ante fallo, sin cifras cero ni acciones sobre datos incompletos.

## Mapa funcional

Todas estas rutas quedan bajo el guard admin del manifiesto. Eso no sustituye RLS/RPC ni certifica permisos desplegados.

| Grupo y rutas | Función / resultado de revisión |
| --- | --- |
| /admin/dashboard | Centro operativo corregido; TodayPanel conserva su consulta de pendientes y sus errores recuperables |
| /admin/users, /admin/agents, /admin/brokers, /admin/profile | Gestores de identidad, agentes, postulaciones y cuenta. Se evita el editor duplicado del inicio; errores de brokers corregidos. Acciones de rol necesitan QA autenticado |
| /admin/inmobiliarias, /admin/inmobiliarias/:id, /admin/suscripciones | Organizaciones, detalle y planes existentes. Revisar carga incompleta, límites y efecto real de cambios de plan antes de certificar |
| /admin/projects, /admin/featured | Proyectos/inventario y destacados existentes. Pendiente verificar alcance global, publicación y auditoría de mutaciones |
| /admin/approvals, /admin/project-approvals | Revisión de publicaciones y loteos. Recuperación de consultas corregida; aprobación/rechazo real no ejecutados |
| /admin/captaciones, /admin/commercial-leads | Revisión de terrenos ofrecidos y consultas comerciales. Este último ya tiene error/reintento; no se verificaron transiciones reales de gerencia |
| /admin/reservations, /admin/documents | Reservas/comprobantes y documentación de operaciones. Se reutilizan gestores existentes. Atención: el gestor de reservas tiene un barrido de expiración al montar, por lo que una inspección autenticada no debe considerarse de solo lectura automáticamente |
| /admin/comisiones, /admin/ventas, /admin/credits | Ajustes de comisión, reglas, ventas manuales y créditos. Existen mutaciones; no se invocaron ni se certificaron su atomicidad/autoría |
| /admin/financial, /admin/analytics | Reportes compartidos con el área comercial: brechas de definición y alcance pendientes; ver prioridades |
| /admin/soporte, /admin/audit | Tickets y registro/exportación de eventos. Existen; alcance de indicadores y exportación requieren corrección |
| /admin/visual-scenarios, /admin/branding-fichas | Gestores de contenido/escenarios y presentación de fichas. No se certifica su publicación ni persistencia global |

Inventario reproducible: [25 entradas de administración](audits/2026-10-29-admin/routes.json). La matriz documenta rutas y código revisados; no significa25 recorridos autenticados aprobados.

## Hallazgos que siguen abiertos

| Prioridad | Brecha comprobada por fuente / límite | Siguiente corrección |
| --- | --- | --- |
| P0 | El SQL versionado de alta aún admite rol desde metadata del cliente, descrito en la auditoría de acceso. No se verificó definición desplegada | Inspeccionar/corregir trigger con allowlist y probar en base aislada; admin debe asignarse por operación privilegiada. Este cambio de UI no lo resuelve |
| P1 | Sesión/caché privada global sigue sin frontera completa al cambiar identidad | Aplicar plan de sesión/aislamiento de PLATFORM_ACCESS_AUDIT; cambiar solo la clave del resumen no es solución global |
| P1 | BrokersAdmin busca cuenta por correo sin consumir el error ni descartar respuestas antiguas. onApprove usa Number(rate) ||3, que sustituye0 | Probar lookup lento/cierre/reapertura y fallo de red; validar UUID, tasa finita/rango y permitir0 si el contrato lo permite; no atribuir fallo a «cuenta inexistente» |
| P1 | /admin/analytics monta BusinessIntelligence, cuyo código filtra lotes/leads por user.id; no es un agregado global de plataforma | Definir alcance explícito y consulta admin agregada, con pruebas de separación de roles |
| P1 | useFinancialDashboard llama totalRevenue a la suma de depósitos y lee currency sin separar importes por moneda; ignora errores de algunas respuestas | Separar depósitos, precio de venta y cobros de crédito; agrupar monedas y mostrar fallos recuperables. Retirar el GMV del inicio no corrige ese reporte |
| P1 | AdminUsers carga perfiles/roles/suscripciones sin paginación explícita. useAllCommissions limita500 filas. Los totales/exportaciones pueden corresponder solo a la respuesta recibida | Paginación y agregados explícitos; exportación completa o alcance visible y probado. No declarar totales globales a partir de arrays limitados |
| P1 | AuditLog limita100 y construye CSV con join(',') sin escapar separadores/comillas/nuevas líneas; no consume el error del hook en la UI | Exportación correcta de selección/paginación, alcance visible, error y reintento; no presentar ausencia de respuesta como historial vacío |
| P1 | Acciones sensibles existentes (rol, plan, comisión, anulación/venta manual, aprobación) no fueron ejecutadas en staging | Matriz actor/permiso, confirmación con resumen, bloqueo mientras envía, idempotencia, registro de auditoría y verificación RLS/RPC. No sustituir esas pruebas por visibilidad de botones |
| P2 | SupportAdmin calcula sus tarjetas desde tickets que ya vienen filtrados por estado/categoría | Aclarar selección o usar conteos globales separados; evitar que otro filtro parezca cero tickets abiertos globales |
| P2 | No hay un gestor admin dedicado al inventario completo de publicaciones equivalente a la antigua lista de lectura del home | Definir listado/paginación/filtros y acciones autorizadas; aprobaciones y proyectos no equivalen al mismo universo |

Estas brechas proceden de lectura de fuente, no de una explotación o modificación de cuentas reales. No se afirma que hayan producido incidentes.

## Plan siguiente

1. Corregir y verificar P0 de registro/roles y frontera de sesión antes de certificar administración.
2. Endurecer aprobaciones de brokers y acciones sensibles con pruebas de errores, concurrencia e identidad objetivo.
3. Unificar semántica y alcance de reportes financieros/analytics; consultas agregadas completas y monedas explícitas.
4. Paginación/exportación de usuarios, comisiones y auditoría; recuperación en los demás gestores.
5. Validación autenticada en staging: admin global vs dueño/admin de empresa vs agente/buyer, acciones permitidas y denegadas, auditoría y efectos de cada transición. Comprobar MFA/configuración real y publicación del build.

## Validación de esta entrega

Pruebas nuevas verifican conteo cero válido, fallo de una fuente y ausencia de count, aislamiento de clave admin, enlaces a gestores reales, reintento, métricas ocultas ante fallo y retorno legado con proyecto/hash. Se prueba también el fallo de consultas de brokers sin exponer aprobación.

La suite completa pasó con521 pruebas en103 archivos; TypeScript y build/PWA local pasaron y lint de archivos afectados terminó sin errores. No se inició sesión con el perfil real del usuario ni se enviaron aprobaciones, cambios de rol/plan, ventas o pagos. No se montó el gestor real de reservas contra producción. El guard admin existe por fuente y pruebas de rutas; RLS, MFA, correo, CI remota y despliegue requieren verificación externa. El bloqueo de facturación previo de Actions impide tomar sus checks como aprobados.
