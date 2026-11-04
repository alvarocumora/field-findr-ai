# Revisión de brokers, reservas y disponibilidad

## Alcance
Revisión del código actual de main: marketplace y asignaciones, kit de venta, inventario, formulario público, reserva con pago, gestor y RPC SQL. Validación local con datos simulados: no se usó una sesión autenticada real ni se crearon reservas, pagos o comunicaciones en producción.

## Primera entrega
- Los cambios de reservas e inventario invalidan una familia compartida de consultas: kit del broker, lotes públicos, proyectos, mapa, formularios, explorador y reservas de comprador/gestor. Las vistas activas se vuelven a consultar y las inactivas quedan obsoletas para su próxima apertura. Un fallo de creación también actualiza disponibilidad, útil si otro comprador tomó la parcela.
- Kit de venta inicia en disponibles, ofrece un filtro con precio para reservar, muestra resumen por estado y hora de consulta. Los lotes sin precio requieren confirmación y no generan enlaces de reserva. Un error de stock deja de pasar cifras anteriores como datos actuales al generador de copy.
- Enlaces canónicos a la ficha de transferencia existente, con proyecto/lote y código del broker, disponibles solo para un lote reservable. La visita al enlace no bloquea ni reserva el lote.
- El gestor consulta cada 30 segundos en primer plano y permite actualización manual. Búsqueda por comprador/email/teléfono/parcela/proyecto y mensaje específico para filtros sin resultados.
- Plazo vencido o inválido: se ocultan los enlaces de cobro y se desactiva confirmación manual. Los handlers de copiar/WhatsApp vuelven a revisar el plazo al ejecutarse. Confirmación condicionada a `pending_payment`, fecha futura y fila devuelta: una carrera o falta de permisos no produce éxito ficticio.
- Señas pagadas no se presentan como ingresos por venta; preparar/copiar un enlace no se llama envío confirmado. Error de portapapeles visible.

## Límites y prioridades siguientes
1. **P0 — Concurrencia y pagos tardíos:** pruebas de integración en staging con dos compradores simultáneos, vencimiento, webhook tardío y reintentos. El SQL de `create_public_reservation_form` bloquea el lote con `FOR UPDATE` y verifica reservas activas; esto se encontró en código, no certifica que esa versión esté desplegada ni que todos los canales utilicen el mismo bloqueo.
2. **P0 — Permisos y transiciones:** matriz servidor de broker asignado, propietario y administrador para confirmar/cancelar/extender/convertir; conciliar pagos tardíos con evidencia. Los filtros y botones de esta entrega no sustituyen autorización ni validación del reloj del servidor.
3. **P1 — Reservas paginadas:** el gestor todavía carga una consulta sin paginación explícita; límites PostgREST pueden truncar lista y agregados. Llevar búsqueda/filtros y totales al servidor antes de operar grandes volúmenes.
4. **P1 — Realtime confiable:** `RealtimeInventoryPanel` muestra LIVE antes de comprobar la suscripción y tiene un estado local independiente; unificar con el mismo inventario, reconexión y errores. Invalidar cachés solo sincroniza dentro del cliente actual; otras sesiones dependen de polling/realtime y del servidor.
5. **P1 — Formulario y cobro:** confirmar una única regla de importe, vigencia, transferencia y atribución entre el formulario público y el pago. No crear una tercera ruta comercial.

## Validación
Pruebas de sincronización con QueryClient real (vista abierta y cachés inactivas, sin vaciar auth), ventanas de pago, filtros/enlaces del kit y gestor con respuestas simuladas. La confirmación rechazada no emite un mensaje de éxito. TypeScript, lint, suite de pruebas y build; verificaciones de CI en el PR.
