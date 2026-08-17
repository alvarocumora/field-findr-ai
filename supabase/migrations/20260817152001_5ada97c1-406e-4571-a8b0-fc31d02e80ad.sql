CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'otro',
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  assigned_to uuid,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_tickets_category_check CHECK (category IN ('cuenta','comisiones','proyectos','publicacion','pagos','tecnico','otro')),
  CONSTRAINT support_tickets_status_check CHECK (status IN ('open','in_progress','waiting_user','resolved','closed')),
  CONSTRAINT support_tickets_priority_check CHECK (priority IN ('low','normal','high','urgent'))
);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Users create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and admins update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id, status);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status, last_message_at DESC);

CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read ticket messages" ON public.support_ticket_messages
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR (
      is_internal = false
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
         WHERE t.id = ticket_id AND t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Participants write ticket messages" ON public.support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.is_platform_admin()
      OR (
        is_internal = false
        AND EXISTS (
          SELECT 1 FROM public.support_tickets t
           WHERE t.id = ticket_id AND t.user_id = auth.uid()
             AND t.status <> 'closed'
        )
      )
    )
  );

CREATE INDEX idx_support_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_support_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  UPDATE public.support_tickets
     SET last_message_at = now(),
         updated_at = now(),
         status = CASE
           WHEN status = 'closed' THEN status
           WHEN NEW.is_internal THEN status
           WHEN NEW.sender_id = user_id THEN 'open'
           ELSE 'waiting_user'
         END
   WHERE id = NEW.ticket_id
   RETURNING user_id INTO v_owner;

  IF NOT NEW.is_internal AND v_owner IS NOT NULL AND NEW.sender_id <> v_owner THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (v_owner, 'support', 'Respuesta de soporte',
            left(NEW.body, 140), '/asesor/soporte');
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_support_ticket() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_touch_support_ticket
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_ticket();