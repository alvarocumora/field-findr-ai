-- Valle Escondido Licantén: marcar todos los documentos legales como
-- verificados y todos los permisos como aprobados. Conserva los campos
-- existentes de cada ítem (file_url, notes, number, …) y solo fija el estado.
with defaults as (
  select
    jsonb_build_array(
      jsonb_build_object('type','titulo_dominio','name','Título de Dominio'),
      jsonb_build_object('type','planos_aprobados','name','Planos Aprobados'),
      jsonb_build_object('type','certificado_subdivision','name','Certificado de Subdivisión'),
      jsonb_build_object('type','permisos_municipales','name','Permisos Municipales'),
      jsonb_build_object('type','recepcion_final','name','Recepción Final'),
      jsonb_build_object('type','factibilidad_agua','name','Factibilidad de Agua'),
      jsonb_build_object('type','factibilidad_electricidad','name','Factibilidad Eléctrica')
    ) as docs,
    jsonb_build_array(
      jsonb_build_object('type','permiso_loteo','name','Permiso de Loteo'),
      jsonb_build_object('type','resolucion_sanitaria','name','Resolución Sanitaria'),
      jsonb_build_object('type','impacto_ambiental','name','Informe de Impacto Ambiental'),
      jsonb_build_object('type','certificado_urbanizacion','name','Certificado de Urbanización')
    ) as permits
)
update public.projects p
set
  legal_documents = (
    select jsonb_agg(
      d || coalesce(
        (select e from jsonb_array_elements(coalesce(p.legal_documents, '[]'::jsonb)) e
          where e->>'type' = d->>'type' limit 1),
        '{}'::jsonb
      ) || jsonb_build_object('status','verified','verified_at', now())
    )
    from defaults, jsonb_array_elements(defaults.docs) d
  ),
  permits = (
    select jsonb_agg(
      d || coalesce(
        (select e from jsonb_array_elements(coalesce(p.permits, '[]'::jsonb)) e
          where e->>'type' = d->>'type' limit 1),
        '{}'::jsonb
      ) || jsonb_build_object('status','approved')
    )
    from defaults, jsonb_array_elements(defaults.permits) d
  ),
  legal_status = 'verified'
where p.slug = 'valle-escondido-licanten';
