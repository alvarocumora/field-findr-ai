update public.projects set landing_config = jsonb_build_object(
  'hero', jsonb_build_object(
    'title', 'Brisas de Caone',
    'subtitle', 'Parcelación rural en Hualañé, Región del Maule. Lotes con acceso consolidado, factibilidad eléctrica y entorno de valle.',
    'cta', 'Quiero información'
  ),
  'highlights', jsonb_build_array(
    'Subdivisión DL 3.516 con planos aprobados',
    'Acceso por camino público consolidado',
    'Factibilidad eléctrica y agua por proyecto',
    'Fichas por lote con plano y superficie oficial'
  ),
  'amenities', jsonb_build_array(
    jsonb_build_object('title','Vistas de valle','text','Topografía suave con miradores naturales.'),
    jsonb_build_object('title','Conectividad','text','Cercanía a Hualañé y ruta a la costa.'),
    jsonb_build_object('title','Plusvalía','text','Zona en consolidación de parcelaciones.')
  )
) where slug = 'brisas-de-caone';

update public.projects set landing_config = jsonb_build_object(
  'hero', jsonb_build_object(
    'title', 'Parque Mirador',
    'subtitle', 'Lotes con vista panorámica y masterplan interactivo. Cada parcela con su ficha, superficie oficial y estado en tiempo real.',
    'cta', 'Quiero información'
  ),
  'highlights', jsonb_build_array(
    'Masterplan interactivo con estado por lote',
    'Superficies validadas contra plano oficial',
    'Tour virtual y fichas descargables',
    'Reserva en línea disponible'
  ),
  'amenities', jsonb_build_array(
    jsonb_build_object('title','Miradores','text','Terrazas naturales con vista al valle.'),
    jsonb_build_object('title','Áreas comunes','text','Circulaciones y espacios de uso común.'),
    jsonb_build_object('title','Accesos','text','Red vial interna proyectada.')
  )
) where slug = 'parque-mirador';