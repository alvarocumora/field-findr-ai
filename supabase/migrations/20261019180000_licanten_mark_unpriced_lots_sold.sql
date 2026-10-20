-- Gap #4 de la auditoría 2026-10-14: los lotes 1, 2, 3, 4, 75 y 76 de Valle
-- Escondido Licantén figuraban como "reserved" con price = null, mostrando
-- "Consultar"/"$0" y distorsionando el rango de precios del proyecto y los
-- filtros del explorador. Decisión del negocio: marcarlos como vendidos, sin
-- precio público (no hay valores reales de venta que cargar).
--
-- El trigger update_lot_counts (20260126170944) recalcula
-- projects.available_lots automáticamente al cambiar el status, no hace
-- falta tocar esa columna a mano.
update public.lots
set status = 'sold',
    price = null,
    sale_date = coalesce(sale_date, now())
where project_id = 'b4363fda-e99f-400d-ae95-2cbc8244b770'
  and lot_number in ('1', '2', '3', '4', '75', '76');
