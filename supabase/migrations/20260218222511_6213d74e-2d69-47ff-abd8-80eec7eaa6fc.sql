
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'reservation', 'payment', 'lead', 'message', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT, -- optional deep link
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers with SECURITY DEFINER)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- TRIGGER: Notify agent on new reservation
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_new_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_owner_id UUID;
  _lot_number TEXT;
  _project_name TEXT;
BEGIN
  SELECT p.user_id, p.name, l.lot_number
  INTO _project_owner_id, _project_name, _lot_number
  FROM lots l JOIN projects p ON p.id = l.project_id
  WHERE l.id = NEW.lot_id;

  IF _project_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      _project_owner_id,
      'reservation',
      'Nueva reserva recibida',
      'Se ha creado una reserva para el lote ' || COALESCE(_lot_number, 'N/A') || ' en ' || COALESCE(_project_name, 'tu proyecto') || ' por ' || NEW.buyer_name,
      '/asesor/reservations',
      jsonb_build_object('reservation_id', NEW.id, 'lot_id', NEW.lot_id, 'buyer_name', NEW.buyer_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_reservation
AFTER INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_reservation();

-- ============================================
-- TRIGGER: Notify agent on reservation paid
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_reservation_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_owner_id UUID;
  _project_name TEXT;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    SELECT p.user_id, p.name
    INTO _project_owner_id, _project_name
    FROM lots l JOIN projects p ON p.id = l.project_id
    WHERE l.id = NEW.lot_id;

    IF _project_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
      VALUES (
        _project_owner_id,
        'payment',
        'Pago de reserva confirmado',
        'El pago de ' || NEW.buyer_name || ' por $' || NEW.reservation_amount || ' ha sido confirmado en ' || COALESCE(_project_name, 'tu proyecto'),
        '/asesor/reservations',
        jsonb_build_object('reservation_id', NEW.id, 'amount', NEW.reservation_amount)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_reservation_paid
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_reservation_paid();

-- ============================================
-- TRIGGER: Notify agent on new lead
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    NEW.user_id,
    'lead',
    'Nuevo lead registrado',
    NEW.first_name || ' ' || COALESCE(NEW.last_name, '') || ' se ha registrado como lead' || 
    CASE WHEN NEW.source IS NOT NULL THEN ' desde ' || NEW.source ELSE '' END,
    '/asesor/leads',
    jsonb_build_object('lead_id', NEW.id, 'source', NEW.source)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_lead();

-- ============================================
-- TRIGGER: Notify agent on new visit request
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_visit_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    NEW.listing_owner_id,
    'system',
    'Solicitud de visita',
    NEW.requester_name || ' ha solicitado una visita para tu propiedad',
    '/asesor/listings',
    jsonb_build_object('visit_request_id', NEW.id, 'listing_id', NEW.listing_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_visit_request
AFTER INSERT ON public.visit_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_visit_request();
