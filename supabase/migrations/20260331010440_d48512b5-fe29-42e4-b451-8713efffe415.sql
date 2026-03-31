
-- Tabla de eventos de usuario para analytics y retargeting
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events" ON public.user_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events" ON public.user_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all events" ON public.user_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_type ON public.user_events(event_type);
CREATE INDEX idx_user_events_created ON public.user_events(created_at DESC);

-- Campo video en proyectos
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_url text;
