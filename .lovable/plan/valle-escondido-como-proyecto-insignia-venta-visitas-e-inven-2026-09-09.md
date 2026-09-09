# Valle Escondido como proyecto insignia: venta, visitas e inventario en un solo ecosistema

Objetivo: dejar Valle Escondido Licantén como el estándar de calidad de la plataforma (página pública, agendamiento de visitas, reserva y control de inventario), y luego aplicar ese mismo estándar al resto de proyectos con un motor único.

## 1. Página pública del proyecto (nivel referencia)

- Portada con el plano en primer plano: superficie, parcelas disponibles, precio desde y estado en vivo.
- Plano maestro mejorado: buscador de parcela por número, filtros por precio/superficie/estado, resaltado al pasar el mouse, y sincronía plano ↔ lista.
- Ficha de parcela con panel lateral: superficie, servidumbre, precio, cuota estimada, distancias, plano con la parcela destacada y dos acciones fijas: "Agendar visita" y "Reservar".
- Recorrido virtual y galería integrados: la sección aparece sola cuando existan fotos y panorámicas cargadas; mientras tanto se muestra el plano y el satélite.
- Descargables ya existentes (dossier, lista de precios, plano) en un solo bloque visible.
- Bloque de confianza con los datos reales del registro (inscripción CBR y plano), sin cifras inventadas.

## 2. Agendamiento de visitas de punta a punta

- Botón "Agendar visita" en el proyecto y en cada parcela, con selección de día y franja horaria, y datos de contacto.
- La solicitud entra al panel como visita programada, vinculada al proyecto, a la parcela y al interesado; queda también registrada como interesado nuevo si no existía.
- Confirmación inmediata en pantalla y aviso al equipo; recordatorio y cambio de estado (programada, realizada, no asistió) desde el panel.
- Vista de agenda por semana en el panel de visitas, con filtro por proyecto y por asesor.

## 3. Reserva y venta continuas

- Desde la parcela: reservar deja la parcela como reservada con vencimiento, avisa al equipo y crea el interesado.
- Recorrido completo visible en un solo lugar por comprador: interesado → visita → reserva → cierre → comisión.
- Los cambios de estado se reflejan al instante en el plano público y en la lista de parcelas.

## 4. Control de inventario del loteo

- Centro de control del proyecto: tablero con disponibles, reservadas, vendidas, monto vendido, monto disponible y avance en porcentaje.
- Edición rápida de parcelas: cambiar estado, precio y notas desde el plano o desde la tabla, con acciones masivas por selección.
- Historial de cambios de precio y estado por parcela.
- Alertas: reservas por vencer, parcelas sin precio, parcelas sin publicar.

## 5. Generalización al resto de proyectos

- Todo lo anterior vive en el motor único de landings y en los componentes compartidos, de modo que cualquier proyecto nuevo lo hereda con solo cargar sus datos.
- Lista de comprobación de publicación: fotos mínimas, plano con polígonos, precios, documentos y textos, con indicador de completitud por proyecto.

## Detalle técnico

1. **Página**: extender `src/pages/valleEscondidoLicanten` (`VelMasterplan`, `VelLotsGrid`, `VelFicha`) con estado compartido en `state/VelContext` para filtros y selección; ficha de parcela como panel lateral reutilizable en `src/components/lots/`. Datos en vivo desde `useVelLots` + RPC `get_public_lots` (nunca lectura directa de `lots` como anónimo).
2. **Visitas**: nuevo RPC `SECURITY DEFINER` `create_public_visit_request` (search_path fijo) que inserta en `leads` + `visits` en una sola transacción, sin `RETURNING` sobre tablas con RLS restrictiva. GRANT explícito a `anon`/`authenticated` solo sobre la función. UI: `VisitScheduleDialog` reutilizable junto a `LotReserveDialog`.
3. **Agenda**: vista semanal en `src/pages/dashboard/VisitsManager.tsx` sobre `useVisits`, con filtros por proyecto/asesor y cambio de estado.
4. **Inventario**: ampliar `LoteoControlCenter.tsx` e `InventoryMap.tsx` con KPIs, edición en línea y acciones masivas (reutilizando `adjust_lot_prices`); historial vía `price_history` y una tabla ligera de eventos de estado si hace falta (migración con GRANT + RLS por dueño/organización).
5. **Realtime**: suscripción a cambios de `lots` del proyecto para refrescar plano público y panel sin recargar.
6. **Reglas fijas**: rutas solo en `src/routes/routeManifest.tsx`; landings solo por `/p/:slug`; polígonos con `normalizePolygon`; PDFs con el shell único; sin tocar comisiones ni flujos de pago existentes.
7. **Verificación**: `navLinks.test.ts`, typecheck, build, y recorrido con navegador: agendar visita anónima, reservar parcela, ver ambos en el panel y confirmar el estado en el plano público.

## Fuera de alcance

- Fotografías reales y panorámicas 360 del terreno (las cargas tú; la web ya queda preparada).
- Cambios en precios, comisiones o pasarela de pago.
