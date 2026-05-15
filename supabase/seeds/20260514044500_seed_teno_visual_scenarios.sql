-- Seed: Teno visual scenarios
-- Purpose: populate initial real persisted scenarios for the Teno industrial listing.
-- Safe to re-run: uses fixed ids and ON CONFLICT DO UPDATE.

insert into public.visual_scenarios (
  id,
  property_id,
  scenario_type,
  status,
  title,
  subtitle,
  description,
  base_image_url,
  overlay_image_url,
  thumbnail_url,
  model_registry_keys,
  map_center_lng,
  map_center_lat,
  map_bearing,
  map_pitch,
  map_zoom,
  metrics,
  assumptions,
  risks,
  tags,
  estimated_capex,
  estimated_revenue,
  created_by
) values
(
  '11111111-1111-4111-8111-111111111111',
  '4f5bca9a-22df-4afd-85cb-0fbda3667a84',
  'industrial_packing',
  'concept',
  'Packing frutícola con cámaras de frío',
  'Escenario conceptual para operación agroindustrial',
  'Propuesta visual preliminar para un packing frutícola con galpón principal, cámaras de frío, patio de maniobras, oficinas y áreas de circulación interior.',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  array['warehouse', 'street_lamp', 'tree_pine'],
  -71.1031,
  -34.8386,
  12,
  48,
  16,
  '[
    {"key":"site_area","label":"Superficie predial referencial","value":7.2,"unit":"ha"},
    {"key":"built_area","label":"Superficie construida conceptual","value":4200,"unit":"m2"},
    {"key":"maneuver_yard","label":"Patio de maniobras","value":9500,"unit":"m2"}
  ]'::jsonb,
  '[
    {"id":"industrial-access","label":"Acceso vial apto para camiones por validar","source":"platform_estimate"},
    {"id":"cold-storage","label":"Cámaras de frío consideradas como volumen conceptual","source":"platform_estimate"}
  ]'::jsonb,
  '[
    {"id":"permits","label":"Permisos sectoriales no verificados","severity":"high"},
    {"id":"utilities","label":"Factibilidad eléctrica y sanitaria pendiente","severity":"medium"}
  ]'::jsonb,
  array['Industrial', 'Agroindustria', 'Packing', 'Conceptual'],
  1850000000,
  null,
  null
),
(
  '22222222-2222-4222-8222-222222222222',
  '4f5bca9a-22df-4afd-85cb-0fbda3667a84',
  'warehouse_logistics',
  'concept',
  'Bodegaje y patio logístico',
  'Escenario conceptual para bodegas y operación de distribución',
  'Propuesta preliminar de bodegaje con nave modular, patio de maniobras, estacionamientos operacionales y zonas de carga/descarga.',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  array['warehouse', 'street_lamp'],
  -71.1031,
  -34.8386,
  -6,
  45,
  16,
  '[
    {"key":"warehouse_area","label":"Superficie bodega conceptual","value":5200,"unit":"m2"},
    {"key":"maneuver_yard","label":"Patio logístico","value":11000,"unit":"m2"},
    {"key":"truck_bays","label":"Andenes referenciales","value":8,"unit":"count"}
  ]'::jsonb,
  '[
    {"id":"modular-warehouse","label":"Bodega modular considerada como layout conceptual","source":"platform_estimate"},
    {"id":"truck-access","label":"Acceso de camiones pendiente de revisión técnica","source":"platform_estimate"}
  ]'::jsonb,
  '[
    {"id":"road-access","label":"Capacidad de acceso vial no verificada","severity":"medium"},
    {"id":"permits","label":"Permisos de operación no verificados","severity":"high"}
  ]'::jsonb,
  array['Logística', 'Bodegaje', 'Distribución', 'Conceptual'],
  1450000000,
  null,
  null
),
(
  '33333333-3333-4333-8333-333333333333',
  '4f5bca9a-22df-4afd-85cb-0fbda3667a84',
  'solar_energy',
  'draft',
  'Autoconsumo solar industrial',
  'Borrador para evaluación energética preliminar',
  'Escenario preliminar para evaluar generación solar de apoyo a operación industrial. Requiere análisis de radiación, conexión eléctrica, sombras y normativa.',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  array[]::text[],
  -71.1031,
  -34.8386,
  0,
  40,
  15,
  '[
    {"key":"useful_area","label":"Área útil preliminar","value":2.4,"unit":"ha"},
    {"key":"reference_power","label":"Potencia referencial","value":1.2,"unit":"mw"},
    {"key":"self_consumption","label":"Uso esperado","value":"Autoconsumo industrial","unit":"text"}
  ]'::jsonb,
  '[
    {"id":"solar-area","label":"Área solar estimada de forma preliminar","source":"platform_estimate"},
    {"id":"connection","label":"Conexión eléctrica no verificada","source":"platform_estimate"}
  ]'::jsonb,
  '[
    {"id":"grid","label":"Factibilidad de conexión a red pendiente","severity":"high"},
    {"id":"shading","label":"Sombras y orientación no verificadas","severity":"medium"}
  ]'::jsonb,
  array['Solar', 'Energía', 'Autoconsumo', 'Borrador'],
  980000000,
  null,
  null
)
on conflict (id) do update set
  property_id = excluded.property_id,
  scenario_type = excluded.scenario_type,
  status = excluded.status,
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  base_image_url = excluded.base_image_url,
  overlay_image_url = excluded.overlay_image_url,
  thumbnail_url = excluded.thumbnail_url,
  model_registry_keys = excluded.model_registry_keys,
  map_center_lng = excluded.map_center_lng,
  map_center_lat = excluded.map_center_lat,
  map_bearing = excluded.map_bearing,
  map_pitch = excluded.map_pitch,
  map_zoom = excluded.map_zoom,
  metrics = excluded.metrics,
  assumptions = excluded.assumptions,
  risks = excluded.risks,
  tags = excluded.tags,
  estimated_capex = excluded.estimated_capex,
  estimated_revenue = excluded.estimated_revenue,
  updated_at = now();
