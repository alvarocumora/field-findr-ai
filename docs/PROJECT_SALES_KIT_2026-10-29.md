# Kit de venta, inventario y formulario de reserva

## Accesos

- Broker: Proyectos para vender → Mis solicitudes → proyecto aprobado → Abrir kit de venta.
- Dueño/equipo: espacio del proyecto → Kit de venta. El equipo necesita pertenecer a la organización activa del proyecto y tener projects.read.
- Ruta privada: /asesor/kit-venta/:projectId. Un broker sin asignación aprobada conserva acceso a la ficha pública desde el catálogo, sin acceder al kit.

## Material comercial

El kit reúne enlaces a ficha pública, material/PDF existente, recorrido y parcelas/precios. Cada enlace usa el dominio canónico y el código de referencia disponible del broker; permite abrir y copiar, con confirmación solo cuando el portapapeles funciona. Si falta el código, no promete atribución.

La comisión acordada procede de la asignación aprobada. El acceso a comisiones conserva ?project y requiere capacidad/función correspondiente. No se altera el cálculo, la liquidación ni el programa de compensación. El módulo de comisiones mantiene sus hallazgos pendientes de la auditoría general.

## Inventario

Se consulta get_public_lots, sin campos privados de compradores. La consulta se pagina por ID para evitar el límite de respuesta estándar y se actualiza cada30s con vista activa, al recuperar foco o mediante botón. Los filtros por estado, número y nombre se aplican al conjunto recuperado. Un error no se presenta como inventario vacío.

El broker consulta disponibilidad. Dueño o miembro de la organización activa con inventory.write puede entrar a Administrar inventario, conservando el proyecto. La edición usa el gestor existente y sus controles de servidor; el kit no escribe lotes.

## Reserva

Cada parcela disponible con precio finito positivo ofrece Abrir formulario de reserva y Copiar formulario. El enlace público conserva lote, tab y ref, y solicita la apertura mediante reserva=1.

ProjectDetail espera éxito real de la consulta de inventario; una consulta deshabilitada mientras carga el proyecto todavía no es inventario vacío. Resuelve el lote dentro de ese proyecto, verifica disponibilidad/precio y abre el mismo LotReservationDialog existente. Consume la intención por replace conservando contexto; no reabre al cerrar o cambiar de modo. Una intención contradictoria de consulta se descarta a favor del formulario de reserva.

Un enlace desconocido, vendido, reservado o sin precio no abre el formulario de reserva. La disponibilidad se revalida al enviar al servidor. Abrir/copiar el formulario no bloquea inventario, crea una reserva ni genera un pago. El formulario conserva su flujo existente de comprador/autenticación/pago y ahora cabe en móvil con desplazamiento interno y tema rural.

Reservas y comprobantes enlaza al gestor existente, filtrado por proyecto. Allí se descarga el comprobante desde un registro real y con su estado. No se genera un certificado de reserva confirmada a partir de una ficha comercial o formulario sin enviar.

## Validación

- Suite completa: 513 pruebas en100 archivos, seguida de12 pruebas focalizadas finales de permisos/enlaces; TypeScript y build/PWA aprobados; lint de archivos afectados sin errores (advertencias existentes).
- Pruebas de enlaces canónicos/atribución, intención consumida, lotes inválidos, asignaciones pendientes y separación entre organizaciones.
- Chromium local con inventario público: encabezado exacto del formulario verificado, único diálogo, contexto conservado y cierre persistente al cambiar de modo. Se bloquearon escrituras; no se envió una reserva ni un correo y no se hizo un pago.
- Chromium con respuestas simuladas y retrasadas de proyecto/inventario: formulario correcto a320/390, límites del diálogo dentro de pantalla y bloqueo de parcela vendida. [Evidencia](audits/2026-10-29-sales-kit/delayed-inventory.json).
- Regresión Playwright añadida para apertura después de cargar inventario y límites móviles. La nueva especificación no se ejecutó con el runner de CI aquí; su comportamiento equivalente se comprobó en Chromium/Python.

La inspección visual detectó y corrigió una primera falsa identificación del inspector de lote como formulario. La validación final exige el encabezado Reservar con Depósito; ver [captura final](audits/2026-10-29-sales-kit/reservation-mobile.png).

No se certifican cuentas reales, RLS desplegadas, liquidación, configuración de pagos ni publicación de este build. Siguen pendientes los hallazgos de identidad/sesión de la auditoría general. La CI remota tiene un bloqueo de facturación previo.
