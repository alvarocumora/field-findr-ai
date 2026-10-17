WITH base AS (
  SELECT -35.000831368::float8 AS lat0, -71.654506223::float8 AS lng0, 350::float8 AS alt
), v AS (
  SELECT l.id, l.lot_number, l.status, ord, (pt->>0)::float8 AS lng, (pt->>1)::float8 AS lat,
         count(*) OVER (PARTITION BY l.id) AS cnt
  FROM public.lots l, jsonb_array_elements(l.polygon) WITH ORDINALITY AS t(pt, ord)
  WHERE l.project_id = '761e73ed-cc0d-5605-a06a-4a4348523b4b' AND jsonb_typeof(l.polygon) = 'array'
), en AS (
  SELECT v.*, (lng - b.lng0) * 111320 * cos(radians(b.lat0)) AS e, (lat - b.lat0) * 110540 AS n, b.alt
  FROM v, base b WHERE ord < cnt
), c AS (SELECT atan2(avg(e), avg(n)) AS yaw0 FROM en
), ang AS (
  SELECT en.id, en.lot_number, en.status, en.ord,
    round(((atan2(e, n) - c.yaw0 + pi())::numeric % (2*pi())::numeric + (2*pi())::numeric) % (2*pi())::numeric - pi()::numeric, 5) AS yaw,
    round((-atan2(alt, sqrt(e*e + n*n)))::numeric, 5) AS pitch
  FROM en, c
), ov AS (
  SELECT jsonb_agg(jsonb_build_object(
    'id', 'lot-' || lot_number, 'name', 'Parcela ' || lot_number, 'lot_id', id,
    'points', pts,
    'color', CASE status WHEN 'reserved' THEN '#f59e0b' WHEN 'sold' THEN '#64748b' ELSE '#10b981' END,
    'opacity', 0.18)) AS j
  FROM (SELECT id, lot_number, status, jsonb_agg(jsonb_build_object('yaw', yaw, 'pitch', pitch) ORDER BY ord) AS pts
        FROM ang GROUP BY id, lot_number, status) s
)
UPDATE public.tour_scenes SET polygon_overlays = ov.j, yaw_default = 0, pitch_default = -0.6
FROM ov WHERE project_id = '761e73ed-cc0d-5605-a06a-4a4348523b4b';