# Experiencia de brokers, vendedores y captadores

Primera entrega del recorrido comercial sobre el plan de experiencia de plataforma.

## Cambios

- Inicio del asesor y Mi negocio presentan tareas: proyectos, clientes, visitas, captaciones y comisiones. Se usa el manifiesto de rutas con contexto, capacidades y funciones contratadas; las opciones no disponibles no se ofrecen como accesos operativos.
- El índice del dashboard conserva el contexto broker/empresa.
- Mi negocio distingue carga, fallo de consulta y ausencia confirmada de perfil. El fallo permite reintentar las consultas, sin mostrar cifras parciales ni una invitación incorrecta a postular.
- El contador comercial identifica comisiones ganadas, aprobadas o pagadas; las potenciales y reservadas no se cuentan como ventas. El importe no pagado indica que incluye potenciales y no se presenta como deuda exigible.
- Copiar un enlace confirma éxito solo después de resolver el portapapeles; en caso de fallo permite copia manual desde el campo.
- Mis captaciones explica el siguiente paso según el estado persistido. Las publicadas enlazan al listing_id exacto; publicar no acredita venta ni pago.
- Los fallos de captaciones no se presentan como una lista vacía. El envío no promete notificaciones automáticas no comprobadas.

## Verificación y próximos pasos

Pruebas de componentes cubren carga y reintento del broker, errores de captaciones, acceso al anuncio exacto y separación entre publicación y pago. La suite completa pasó con 481 pruebas en 93 archivos. TypeScript pasó; lint terminó con cero errores y 546 advertencias. El build/PWA se verificó localmente.

La validación autenticada de extremo a extremo requiere staging con cuentas broker, vendedor y captador: asignación de proyecto, alta de captación, seguimiento del cliente, visita y liquidación de comisión. No se ejecutaron escrituras sobre clientes, terrenos ni pagos reales. El despliegue y los avisos automáticos no se certifican con este merge.

Próximas entregas: filtros y búsqueda del catálogo comercial, onboarding con acciones por etapa, seguimiento de clientes por próxima acción y recuperación de formularios. Se deben probar sus transiciones y permisos antes de declararlas operativas.
