# Catálogo comercial para brokers

La entrada Proyectos para vender se ordena en buscar, solicitar aprobación, revisar material y compartir el enlace de venta. Solicitudes pendientes, aprobadas, rechazadas y revocadas tienen nombres y siguientes pasos explícitos. La aprobación no se presenta como venta realizada.

La búsqueda de proyecto/comuna/región se aplica en servidor con debounce, antes de paginar30 filas; ya no se filtran solamente los primeros200 proyectos. Hay carga adicional y conteo de proyectos cargados, sin presentarlo como total global. La pestaña y búsqueda se conservan en la URL. El buscador permanece montado durante la carga de resultados.

Los proyectos de solicitudes se consultan por sus IDs, independientemente de las páginas, búsqueda o estado activo del catálogo, siempre sujetos a RLS. La clave de asignaciones incorpora el usuario autenticado. Esto no reemplaza la corrección global de caché/sesión pendiente en la auditoría.

Las condiciones de comisión proceden de reglas activas o de una asignación aprobada. Las reglas son referencias sujetas a acuerdo; no se inventa un3% ni un mínimo fijo en la vitrina. El valor propuesto por el RPC existente se muestra como propuesta en solicitudes pendientes; no se cambió el cálculo de comisión del servidor ni el programa de compensación.

La disponibilidad se consulta en la ficha canónica y no se presenta el contador agregado del proyecto como inventario en vivo. Compartir desde el módulo requiere asignación aprobada, conserva el código de referencia y usa URL canónica. Copiar confirma éxito solo al resolverse el portapapeles. Los errores se explican y permiten reintentar; no se sustituyen por catálogo vacío o comisiones ficticias.

Las solicitudes recibidas quedan visibles cuando existen; sus acciones se bloquean durante la mutación. La autorización final permanece en las políticas y RPC existentes. Los accesos a consultas, reservas y comisiones reutilizan la política de navegación/capacidades.

Verificación: pruebas de estados comerciales, solicitud por ID, recuperación, persistencia de pestaña/búsqueda y búsqueda fuera de primera página; TypeScript, lint sin errores y build/PWA locales. La suite completa pasó con502 pruebas en98 archivos. Las pruebas usan respuestas simuladas, sin solicitar asignaciones, aprobar brokers ni compartir mensajes reales. Pendiente certificación de recorridos con perfiles autenticados en staging y comprobación de publicación.

Límites: no se corrigen aquí los hallazgos de alta de roles o sesión, no se certifican políticas desplegadas y no se implementa paginación completa del histórico de asignaciones. El histórico aún depende de la respuesta del endpoint existente.
