
-- 1. Trigger: al crear un listing, encolarlo automáticamente para revisión
CREATE OR REPLACE FUNCTION public.enqueue_listing_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo encolar si viene marcado como 'pending_review' y no existe aprobación previa
  IF NEW.status = 'pending_review' THEN
    INSERT INTO public.property_approvals (listing_id, status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_listing_approval ON public.listings;
CREATE TRIGGER trg_enqueue_listing_approval
AFTER INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.enqueue_listing_approval();

-- 2. Trigger: sincronizar listing.status cuando cambia property_approvals.status
CREATE OR REPLACE FUNCTION public.sync_listing_status_from_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.listings
    SET status = 'active', updated_at = now()
    WHERE id = NEW.listing_id;

    -- Notificar al dueño
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    SELECT l.user_id, 'system', 'Publicación aprobada',
           'Tu propiedad "' || l.title || '" ya está publicada y visible en el marketplace.',
           '/propiedad/' || l.id,
           jsonb_build_object('listing_id', l.id, 'approval_id', NEW.id)
    FROM public.listings l WHERE l.id = NEW.listing_id;

  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    UPDATE public.listings
    SET status = 'rejected', updated_at = now()
    WHERE id = NEW.listing_id;

    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    SELECT l.user_id, 'system', 'Publicación rechazada',
           'Tu propiedad "' || l.title || '" fue rechazada. Motivo: ' || COALESCE(NEW.rejection_reason, 'No especificado'),
           '/propiedad/' || l.id,
           jsonb_build_object('listing_id', l.id, 'approval_id', NEW.id, 'reason', NEW.rejection_reason)
    FROM public.listings l WHERE l.id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_status_from_approval ON public.property_approvals;
CREATE TRIGGER trg_sync_listing_status_from_approval
AFTER INSERT OR UPDATE OF status ON public.property_approvals
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_status_from_approval();

-- 3. Permitir que el dueño lea su propio listing en cualquier estado (para ver banner "en revisión")
DROP POLICY IF EXISTS "Owners can view their own listings any status" ON public.listings;
CREATE POLICY "Owners can view their own listings any status"
ON public.listings FOR SELECT
TO authenticated
USING (user_id = auth.uid());
