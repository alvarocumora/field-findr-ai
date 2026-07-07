
-- Fix: republicar tras rechazo debe re-encolar en property_approvals.
-- 1) El trigger antes solo corría en INSERT. Ahora corre también en UPDATE
--    cuando el status transiciona a 'pending_review'.
-- 2) Evitar duplicados: si ya existe una fila 'pending' para el listing,
--    no insertar; si hay otra (rejected/approved) se crea una nueva pending.
CREATE OR REPLACE FUNCTION public.enqueue_listing_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending_review'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.property_approvals
      WHERE listing_id = NEW.id AND status = 'pending'
    ) THEN
      INSERT INTO public.property_approvals (listing_id, status)
      VALUES (NEW.id, 'pending');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_listing_approval() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_listing_approval ON public.listings;
CREATE TRIGGER trg_enqueue_listing_approval
AFTER INSERT OR UPDATE OF status ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_listing_approval();
