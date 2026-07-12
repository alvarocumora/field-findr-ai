-- 1) Add expiration column to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_projects_featured_active
  ON public.projects (featured, featured_until)
  WHERE featured = true;

-- 2) Audit table
CREATE TABLE IF NOT EXISTS public.featured_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('activated', 'deactivated', 'extended', 'expired')),
  previous_featured boolean,
  new_featured boolean NOT NULL,
  previous_until timestamptz,
  new_until timestamptz,
  notes text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.featured_history TO authenticated;
GRANT ALL ON public.featured_history TO service_role;

ALTER TABLE public.featured_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view featured history" ON public.featured_history;
CREATE POLICY "Admins can view featured history"
  ON public.featured_history
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_featured_history_project_created
  ON public.featured_history (project_id, created_at DESC);

-- 3) Admin RPC to toggle / extend a project's featured slot
CREATE OR REPLACE FUNCTION public.admin_set_project_featured(
  p_project_id uuid,
  p_active boolean,
  p_until timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(project_id uuid, featured boolean, featured_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev_featured boolean;
  v_prev_until timestamptz;
  v_action text;
  v_new_until timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can manage featured projects';
  END IF;

  SELECT p.featured, p.featured_until
    INTO v_prev_featured, v_prev_until
  FROM public.projects p
  WHERE p.id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF p_active THEN
    v_new_until := p_until;
    IF COALESCE(v_prev_featured, false) = false THEN
      v_action := 'activated';
    ELSE
      v_action := 'extended';
    END IF;
  ELSE
    v_new_until := NULL;
    v_action := 'deactivated';
  END IF;

  UPDATE public.projects
     SET featured = p_active,
         featured_until = v_new_until,
         updated_at = now()
   WHERE id = p_project_id;

  INSERT INTO public.featured_history (
    project_id, action, previous_featured, new_featured,
    previous_until, new_until, notes, changed_by
  ) VALUES (
    p_project_id, v_action, v_prev_featured, p_active,
    v_prev_until, v_new_until, p_notes, auth.uid()
  );

  RETURN QUERY SELECT p_project_id, p_active, v_new_until;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_project_featured(uuid, boolean, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_project_featured(uuid, boolean, timestamptz, text) TO authenticated;

-- 4) Sweep function to auto-expire past deadlines (run via cron or on-demand)
CREATE OR REPLACE FUNCTION public.expire_featured_projects()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT id, featured_until
    FROM public.projects
    WHERE featured = true
      AND featured_until IS NOT NULL
      AND featured_until < now()
  LOOP
    UPDATE public.projects
       SET featured = false, updated_at = now()
     WHERE id = r.id;

    INSERT INTO public.featured_history (
      project_id, action, previous_featured, new_featured,
      previous_until, new_until, notes, changed_by
    ) VALUES (
      r.id, 'expired', true, false, r.featured_until, NULL,
      'Auto-expired by scheduler', NULL
    );
    affected := affected + 1;
  END LOOP;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_featured_projects() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_featured_projects() TO service_role;