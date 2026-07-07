
-- 1. Ampliar estados válidos del proyecto.
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check CHECK (
    status = ANY (ARRAY[
      'draft', 'planning', 'pending_review', 'active',
      'rejected', 'sold_out', 'inactive', 'completed'
    ])
  );

-- 2. Tabla de aprobaciones de proyectos.
CREATE TABLE IF NOT EXISTS public.project_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_approvals_project_id_idx ON public.project_approvals(project_id);
CREATE INDEX IF NOT EXISTS project_approvals_status_idx ON public.project_approvals(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_approvals TO authenticated;
GRANT ALL ON public.project_approvals TO service_role;

ALTER TABLE public.project_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage project approvals" ON public.project_approvals;
CREATE POLICY "Admins manage project approvals"
ON public.project_approvals
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owners can view their project approvals" ON public.project_approvals;
CREATE POLICY "Owners can view their project approvals"
ON public.project_approvals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_approvals.project_id AND p.user_id = auth.uid()
  )
);

-- 3. Trigger: encolar cuando el proyecto entra en 'pending_review'.
CREATE OR REPLACE FUNCTION public.enqueue_project_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending_review'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.project_approvals
      WHERE project_id = NEW.id AND status = 'pending'
    ) THEN
      INSERT INTO public.project_approvals (project_id, status)
      VALUES (NEW.id, 'pending');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_project_approval() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_project_approval ON public.projects;
CREATE TRIGGER trg_enqueue_project_approval
AFTER INSERT OR UPDATE OF status ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.enqueue_project_approval();

-- 4. Trigger: sincronizar el estado del proyecto y notificar al dueño.
CREATE OR REPLACE FUNCTION public.sync_project_status_from_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_id UUID;
  _project_name TEXT;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.projects
      SET status = 'active', updated_at = now()
      WHERE id = NEW.project_id
      RETURNING user_id, name INTO _owner_id, _project_name;

    IF _owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
      VALUES (
        _owner_id,
        'system',
        'Loteo aprobado',
        'Tu loteo "' || COALESCE(_project_name, '') || '" fue aprobado y ya está publicado en el marketplace.',
        '/asesor/projects',
        jsonb_build_object('project_id', NEW.project_id, 'approval_id', NEW.id)
      );
    END IF;

  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    UPDATE public.projects
      SET status = 'rejected', updated_at = now()
      WHERE id = NEW.project_id
      RETURNING user_id, name INTO _owner_id, _project_name;

    IF _owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
      VALUES (
        _owner_id,
        'system',
        'Loteo rechazado',
        'Tu loteo "' || COALESCE(_project_name, '') || '" fue rechazado. Motivo: ' || COALESCE(NEW.rejection_reason, 'No especificado'),
        '/asesor/projects',
        jsonb_build_object('project_id', NEW.project_id, 'approval_id', NEW.id, 'reason', NEW.rejection_reason)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_project_status_from_approval() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_project_status_from_approval ON public.project_approvals;
CREATE TRIGGER trg_sync_project_status_from_approval
AFTER INSERT OR UPDATE OF status ON public.project_approvals
FOR EACH ROW EXECUTE FUNCTION public.sync_project_status_from_approval();
