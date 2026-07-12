CREATE OR REPLACE FUNCTION public.system_activate_featured(
  p_project_id uuid,
  p_days integer,
  p_payment_ref text DEFAULT NULL
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev_featured boolean;
  v_prev_until timestamptz;
  v_new_until timestamptz;
  v_action text;
BEGIN
  IF p_days IS NULL OR p_days < 1 OR p_days > 365 THEN
    RAISE EXCEPTION 'Duration out of range (1..365 days)';
  END IF;

  SELECT featured, featured_until INTO v_prev_featured, v_prev_until
  FROM public.projects WHERE id = p_project_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Stack duration on top of an existing active window if any.
  v_new_until := GREATEST(COALESCE(v_prev_until, now()), now()) + make_interval(days => p_days);

  UPDATE public.projects
     SET featured = true,
         featured_until = v_new_until,
         updated_at = now()
   WHERE id = p_project_id;

  v_action := CASE WHEN COALESCE(v_prev_featured, false) THEN 'extended' ELSE 'activated' END;

  INSERT INTO public.featured_history (
    project_id, action, previous_featured, new_featured,
    previous_until, new_until, notes, changed_by
  ) VALUES (
    p_project_id, v_action, v_prev_featured, true,
    v_prev_until, v_new_until,
    COALESCE('Activado por pago (' || p_payment_ref || ')', 'Activado por pago'),
    NULL
  );

  RETURN v_new_until;
END;
$$;

REVOKE ALL ON FUNCTION public.system_activate_featured(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.system_activate_featured(uuid, integer, text) TO service_role;