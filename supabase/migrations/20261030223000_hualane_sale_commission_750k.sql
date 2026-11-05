-- OfertaTerrenos.com | Actualización comercial Valle de Hualañé
-- Comisión por venta: 500.000 -> 750.000 CLP
-- Comisión por captación: se mantiene en 200.000 CLP
-- No altera Licantén, comisiones devengadas ni pagos históricos.
-- Requiere haber ejecutado 20261030180000_project_fixed_commissions.sql.
DO $$
DECLARE
  v_count integer;
  v_before numeric;
  v_capture numeric;
BEGIN
  SELECT count(*), max(fixed_sale_amount), max(referral_fixed_amount)
    INTO v_count, v_before, v_capture
  FROM public.commission_rules
  WHERE scope = 'project'
    AND project_id = '761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid
    AND is_active = true;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active Valle de Hualañé rule, found %', v_count;
  END IF;
  IF v_before NOT IN (500000, 750000) THEN
    RAISE EXCEPTION 'Unexpected current Hualañé sale commission: %', v_before;
  END IF;
  IF v_capture IS DISTINCT FROM 200000 THEN
    RAISE EXCEPTION 'Captación Hualañé differs from confirmed $200.000: %', v_capture;
  END IF;

  UPDATE public.commission_rules
     SET fixed_sale_amount = 750000,
         notes = 'OfertaTerrenos: venta fija CLP $750.000 y captación fija CLP $200.000 por venta efectiva; pago sujeto a validación'
   WHERE scope = 'project'
     AND project_id = '761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid
     AND is_active = true;
END;
$$;
