# Main: ventas y SaaS

Base revisada: `f33e454` (#267). No hubo commits nuevos en origin/main al iniciar la revisión. Revisión del repositorio y pruebas locales; no acredita publicación en Lovable, migraciones desplegadas ni cobros reales.

## Avances existentes
- #259: comisión definida por dueño/proyecto; registro de venta deja de pedir una tasa arbitraria.
- #260/#261: fichas comerciales PDF y material de proyecto; #264: reservas propias del broker y recorrido de cierre.
- #265: rol SII de la parcela en ficha/PDF; esto no sustituye revisión legal.
- #266: proyectos y simulación con tasa nominal anual fija del 9% en el código actual.
- #267: sincronización de reservas/inventario, kit con disponibles y formularios con atribución, búsqueda operativa y protección frente a cobros vencidos.

## Primera mejora de esta revisión
**Problema SaaS:** `usePlanLimits` descartaba errores de consultas HEAD y transformaba un conteo desconocido en cero. También concedía capacidad antes de terminar la lectura del plan. Esto podía habilitar publicación cuando el uso real era desconocido; los mensajes confundían el error con la necesidad de pagar un upgrade.

Ahora se comprueban errores y presencia de los conteos. Para habilitar capacidad se requiere usuario, uso leído, plan resuelto y ausencia de errores. La resolución de organización se propaga como carga/error a la suscripción; un fallo no dispara una lectura personal como sustituto. Reintento de contexto en ese caso. La tarjeta presenta el error sin ceros ni upgrade, y los controles de publicación distinguen cupo sin verificar de límite real. Esta es una protección de UX: las autorizaciones/cuotas de servidor siguen siendo necesarias.

**Problema ventas:** el pipeline ignoraba el error de `useLeads` y mostraba cero leads y cero conversión. Ahora ofrece error/reintento sin esas métricas. Se amplía la búsqueda local por teléfono y se recortan espacios. No se modifica una venta ni un lead durante la revisión.

## Próximos PR priorizados
| Prioridad | Brecha comprobada o validación pendiente | Resultado requerido |
| --- | --- | --- |
| P0 | Retorno de suscripción consulta por usuario, independiente del workspace de facturación, sin identificar un checkout específico | Confirmación del checkout exacto desde servidor, organización correcta, error/reintento y tiempo de espera; nunca activar por URL ni por una suscripción anterior |
| P0 | Cupos SaaS contados por `user_id` mientras existen planes y equipos de organización | Medición por tenant, cuotas de servidor y pruebas entre owner, administrador, agente y organizaciones diferentes |
| P0 | Reservas concurrentes, webhook tardío, cancelación y cierre | Integración aislada/staging: dos compradores, pago duplicado/tardío y matriz de permisos. SQL en repo no prueba despliegue |
| P1 | Destacadas mensuales basadas en `updated_at`; super destacadas devuelve cero sin medición persistente | Registro de consumo por periodo y recurso; no inferir créditos consumidos de una edición del anuncio |
| P1 | Pipeline/reservas sin paginación y agregados exhaustivos explícitos | Filtros, paginación y métricas del servidor sobre el conjunto autorizado |
| P1 | Suscripciones históricas: selección de última fila no valida por sí sola vigencia/entitlements | Regla única de estado, periodo, cancelación y cambios de plan compartida con servidor y panel |

## Validación
Pruebas con QueryClient real: cero verificado frente a error/conteo ausente; capacidad cerrada mientras carga el plan o falla la organización. Prueba del pipeline con error y reintento, sin métricas de cero. Suite completa, TypeScript, lint y build de producción; CI del PR. No se contrataron planes ni se hicieron cambios de permisos, pagos o comunicaciones reales.
