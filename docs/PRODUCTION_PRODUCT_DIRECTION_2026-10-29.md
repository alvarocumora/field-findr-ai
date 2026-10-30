# Dirección de producto y ejecución para producción

## Visión

OfertaTerrenos debe convertir inventario verificable en operaciones comerciales trazables. El comprador avanza de descubrir a elegir parcela, consultar/visitar, reservar y seguir su compra. El vendedor trabaja sobre el mismo inventario, con próxima acción, atribución y condiciones explícitas. La empresa controla equipo, disponibilidad y cobros; administración resuelve excepciones y audita decisiones.

La diferencia de producto debe ser la continuidad de esa operación: el contexto y los datos acompañan al usuario. Mapa, tour, PDF, enlace de broker y reserva muestran la misma parcela. La IA puede preparar trabajo útil con fuentes identificables; su apariencia no sustituye datos, permisos ni confirmaciones comerciales.

## Decisiones de arquitectura

- Un inventario canónico: projects → lots, con lots.listing_id / listings.project_id. No agrupar proyectos por textos de etiquetas ni replicar stock en landings.
- Una ficha pública por proyecto y enlaces de parcela resueltos contra inventario actual; filtros y campaña conservados.
- Una identidad con contextos separados: comprador, broker, empresa y plataforma. Roles, plan y pertenencia a empresa se validan por separado; un selector no concede permisos.
- Un núcleo de datos privado con frontera de identidad/workspace. Cada operación lleva scope; cambio de cuenta no reutiliza respuestas de otra cuenta.
- RLS, RPC y Edge Functions son la frontera de servidor. El frontend facilita la operación autorizada y explica los errores; no define por sí solo la autorización.
- Reservas, pagos y cierres reutilizan los flujos existentes. Las acciones deben ser idempotentes y revalidar inventario/precio en servidor; compartir un formulario no equivale a reservar ni pagar.
- Integrar mejoras mediante PR pequeños con aceptación, verificación y despliegue explícitos. Merge no equivale a función migrada o build publicado.

## Secuencia de entregas

| Bloque | Resultado verificable | Estado al iniciar esta ejecución |
| --- | --- | --- |
| 1. Identidad y seguridad | Registro público sin privilegios globales autoconcedidos; sesión aislada; permisos con carga/error explícitos | Migración de allowlist y regresión real PostgreSQL preparadas en esta entrega. Sesión y bootstrap, siguientes PR |
| 2. Entornos y releases | Staging repetible, CI ejecutable, migraciones verificadas y comprobación del build publicado | Bloqueo previo de facturación Actions; no se certifica producción ni correo/OAuth sin pruebas del entorno |
| 3. Recorrido comercial | Ubicación/tipo/presupuesto → proyecto → parcela → consulta/visita → reserva/pago, con contexto conservado | Hero, búsqueda y kit conectados; falta certificar recorridos autenticados completos |
| 4. Operación diaria por perfil | Pendientes priorizados y siguiente acción para comprador, broker, comercial, operaciones, finanzas y admin | Menú y centro admin ordenados; faltan bootstrap fiable y composición por tareas en todos los perfiles |
| 5. Integridad comercial | Conteos completos, moneda explícita, documentos con evidencia, comisiones y cobros con estados reales | Correcciones parciales integradas; reportes/CSV y acciones sensibles tienen brechas documentadas |
| 6. Asistencia y automatización | Borradores de respuesta, material comercial y sugerencias sobre datos permitidos, con fuentes y resultado comprobable | Evaluar después de estabilizar permisos/datos. No prometer chat, alertas o resultados no implementados |
| 7. Rendimiento y operación | Carga pública rápida, inventario recuperable sin WebGL, alertas técnicas y trazabilidad de fallos | Preservar mapa único y carga diferida; establecer medidas antes de declarar mejoras cuantitativas |

Los bloques son una secuencia de validación, no una fecha prometida ni una declaración de funciones terminadas. Las auditorías de acceso y administración siguen siendo la lista de brechas comprobadas.

## Criterios de producto

- La portada explica qué se vende y permite buscar, sin garantías legales generales ni métricas comerciales inventadas.
- La ficha permite decidir: ubicación, superficie, precio, disponibilidad, condiciones y responsable. Tour/mapa son medios de evaluación con alternativa funcional.
- Broker: proyecto aprobado → kit → enlace atribuible → seguimiento → visita/reserva → comisión con estado. Una asignación pendiente no se presenta como autorización.
- Empresa: acciones por capacidad, scope por organización y un único estado de cada operación; el visor no tiene botones de mutación.
- Administración: pendientes, gestores canónicos y auditoría. Depósitos no se llaman GMV; consultas fallidas no se convierten en ceros.
- IA: debe reducir una tarea concreta y verificable. No publicará material inventado ni realizará cambios de rol, pagos o aprobaciones de forma implícita.

## Medición y aceptación

Embudo: búsqueda → selección de proyecto/parcela → consulta identificada → visita → reserva creada → depósito pagado → cierre registrado. Contar cada transición por su evento real; clic y venta no son intercambiables. Mantener atribución sin publicar datos privados del comprador ni credenciales en telemetría.

Objetivos iniciales propuestos, todavía no medidos: LCP público p75≤2,5s en el perfil móvil acordado; login→home utilizable p95≤3s en staging; ausencia de datos de otra cuenta/empresa en la matriz de aislamiento. Definir red/dispositivo/dataset y ventana de medición antes de evaluar esos tiempos.

Cierre de una entrega: pruebas pertinentes, TypeScript/lint/build cuando hay frontend, prueba SQL real cuando hay autorización en DB, escenarios negativos por rol/tenant, publicación verificable y limitaciones registradas. Para acciones críticas: actor, objeto, permiso, resultado e idempotencia. No registrar passwords, tokens ni PII innecesaria.

## Verdad operativa

El repositorio y las pruebas locales permiten implementar y revisar cambios. La aplicación de migraciones en Supabase, configuración de Auth/MFA, callbacks reales y publicación requieren acceso al entorno correspondiente. No se pedirán credenciales en el chat ni se certificarán esos pasos a partir de un merge.
