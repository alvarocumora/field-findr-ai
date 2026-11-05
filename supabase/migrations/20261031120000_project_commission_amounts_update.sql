-- OfertaTerrenos.com | Montos de comisión fijos por proyecto (CLP)
--   Valle de Hualañé:         venta $750.000   · captación $200.000 -> $350.000
--   Valle Escondido Licantén: venta $1.000.000 -> $1.200.000 · captación $350.000 -> $500.000
-- Solo afecta comisiones NUEVAS: normalize_commission_ledger() lee la regla al
-- insertar. No altera comisiones devengadas ni pagos históricos.
-- Requiere 20261030180000_project_fixed_commissions.sql (columna fixed_sale_amount).
DO $$
DECLARE
  r record;
  v_count int;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid,  750000::numeric, 350000::numeric, 'Valle de Hualañé'::text),
      ('b4363fda-e99f-400d-ae95-2cbc8244b770'::uuid, 1200000::numeric, 500000::numeric, 'Valle Escondido Licantén'::text)
    ) AS v(project_id, venta, captacion, nombre)
  LOOP
    SELECT count(*) INTO v_count
    FROM public.commission_rules
    WHERE scope = 'project' AND project_id = r.project_id AND is_active;
    IF v_count <> 1 THEN
      RAISE EXCEPTION '% tiene % reglas activas (se esperaba 1)', r.nombre, v_count;
    END IF;

    UPDATE public.commission_rules
       SET fixed_sale_amount     = r.venta,
           referral_fixed_amount = r.captacion,
           notes = 'OfertaTerrenos: venta fija CLP $'
                   || replace(to_char(r.venta, 'FM9,999,999'), ',', '.')
                   || ' y captación fija CLP $'
                   || replace(to_char(r.captacion, 'FM9,999,999'), ',', '.')
                   || ' por venta efectiva; pago sujeto a validación'
     WHERE scope = 'project' AND project_id = r.project_id AND is_active;
  END LOOP;
END;
$$;
