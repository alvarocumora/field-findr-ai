-- Canonical CRM foundation
-- Additive migration: existing leads/CRM screens keep working while new
-- contacts, opportunities and activities become the target data model.

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  national_id text,
  source text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_organization_created_idx
  ON public.contacts(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contacts_created_by_idx
  ON public.contacts(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS contacts_assigned_to_idx
  ON public.contacts(assigned_to, created_at DESC);
CREATE INDEX IF NOT EXISTS contacts_org_email_idx
  ON public.contacts(organization_id, lower(email))
  WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS contacts_org_phone_idx
  ON public.contacts(organization_id, phone)
  WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES public.lots(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  legacy_lead_id uuid UNIQUE REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new',
      'qualified',
      'quoted',
      'visit_scheduled',
      'negotiating',
      'reserved',
      'won',
      'lost'
    )),
  source text,
  budget_min numeric,
  budget_max numeric,
  next_follow_up timestamptz,
  stage_changed_at timestamptz NOT NULL DEFAULT now(),
  lost_reason text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opportunities_budget_order_check
    CHECK (
      budget_min IS NULL
      OR budget_max IS NULL
      OR budget_min <= budget_max
    )
);

CREATE INDEX IF NOT EXISTS opportunities_organization_status_idx
  ON public.opportunities(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunities_contact_idx
  ON public.opportunities(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunities_project_idx
  ON public.opportunities(project_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunities_lot_idx
  ON public.opportunities(lot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunities_assigned_to_idx
  ON public.opportunities(assigned_to, status, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunities_follow_up_idx
  ON public.opportunities(next_follow_up)
  WHERE next_follow_up IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  actor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL
    CHECK (activity_type IN (
      'note',
      'call',
      'email',
      'whatsapp',
      'meeting',
      'visit',
      'quote',
      'reservation',
      'status_change',
      'task',
      'other'
    )),
  channel text,
  title text,
  body text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activities_subject_check
    CHECK (contact_id IS NOT NULL OR opportunity_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS activities_organization_occurred_idx
  ON public.activities(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activities_contact_occurred_idx
  ON public.activities(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activities_opportunity_occurred_idx
  ON public.activities(opportunity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activities_project_occurred_idx
  ON public.activities(project_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activities_actor_occurred_idx
  ON public.activities(actor_id, occurred_at DESC);

-- Keep opportunity tenant/project/lot relationships internally consistent.
CREATE OR REPLACE FUNCTION public.crm_sync_opportunity_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_project_id uuid;
  v_organization_id uuid;
  v_contact_organization_id uuid;
BEGIN
  SELECT contact.organization_id
    INTO v_contact_organization_id
  FROM public.contacts AS contact
  WHERE contact.id = NEW.contact_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CRM opportunity contact not found';
  END IF;

  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := v_contact_organization_id;
  ELSIF NEW.organization_id IS DISTINCT FROM v_contact_organization_id THEN
    RAISE EXCEPTION 'CRM opportunity organization does not match contact';
  END IF;

  IF NEW.lot_id IS NOT NULL THEN
    SELECT lot.project_id
      INTO v_project_id
    FROM public.lots AS lot
    WHERE lot.id = NEW.lot_id;

    IF v_project_id IS NULL THEN
      RAISE EXCEPTION 'CRM opportunity lot not found or has no project';
    END IF;

    IF NEW.project_id IS NULL THEN
      NEW.project_id := v_project_id;
    ELSIF NEW.project_id <> v_project_id THEN
      RAISE EXCEPTION 'CRM opportunity lot does not belong to project';
    END IF;
  END IF;

  IF NEW.project_id IS NOT NULL THEN
    SELECT project.organization_id
      INTO v_organization_id
    FROM public.projects AS project
    WHERE project.id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRM opportunity project not found';
    END IF;

    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := v_organization_id;
    ELSIF NEW.organization_id IS DISTINCT FROM v_organization_id THEN
      RAISE EXCEPTION 'CRM opportunity organization does not match project';
    END IF;
  END IF;

  IF NEW.organization_id IS DISTINCT FROM v_contact_organization_id THEN
    RAISE EXCEPTION 'CRM opportunity contact and project must share organization scope';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.stage_changed_at := now();
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.crm_sync_opportunity_scope()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_crm_sync_opportunity_scope
  ON public.opportunities;
CREATE TRIGGER trg_crm_sync_opportunity_scope
BEFORE INSERT OR UPDATE OF organization_id, project_id, lot_id, status
ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.crm_sync_opportunity_scope();

-- Activities inherit canonical subject scope from their opportunity/project.
CREATE OR REPLACE FUNCTION public.crm_sync_activity_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_contact_id uuid;
  v_project_id uuid;
  v_organization_id uuid;
  v_contact_organization_id uuid;
BEGIN
  IF NEW.opportunity_id IS NOT NULL THEN
    SELECT opportunity.contact_id,
           opportunity.project_id,
           opportunity.organization_id
      INTO v_contact_id, v_project_id, v_organization_id
    FROM public.opportunities AS opportunity
    WHERE opportunity.id = NEW.opportunity_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRM activity opportunity not found';
    END IF;

    IF NEW.contact_id IS NULL THEN
      NEW.contact_id := v_contact_id;
    ELSIF NEW.contact_id <> v_contact_id THEN
      RAISE EXCEPTION 'CRM activity contact does not match opportunity';
    END IF;

    IF NEW.project_id IS NULL THEN
      NEW.project_id := v_project_id;
    ELSIF NEW.project_id IS DISTINCT FROM v_project_id THEN
      RAISE EXCEPTION 'CRM activity project does not match opportunity';
    END IF;

    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := v_organization_id;
    ELSIF NEW.organization_id IS DISTINCT FROM v_organization_id THEN
      RAISE EXCEPTION 'CRM activity organization does not match opportunity';
    END IF;
  END IF;

  IF NEW.contact_id IS NOT NULL AND NEW.opportunity_id IS NULL THEN
    SELECT contact.organization_id
      INTO v_contact_organization_id
    FROM public.contacts AS contact
    WHERE contact.id = NEW.contact_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRM activity contact not found';
    END IF;

    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := v_contact_organization_id;
    ELSIF NEW.organization_id IS DISTINCT FROM v_contact_organization_id THEN
      RAISE EXCEPTION 'CRM activity organization does not match contact';
    END IF;
  END IF;

  IF NEW.project_id IS NOT NULL THEN
    SELECT project.organization_id
      INTO v_organization_id
    FROM public.projects AS project
    WHERE project.id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRM activity project not found';
    END IF;

    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := v_organization_id;
    ELSIF NEW.organization_id IS DISTINCT FROM v_organization_id THEN
      RAISE EXCEPTION 'CRM activity organization does not match project';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.crm_sync_activity_scope()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_crm_sync_activity_scope
  ON public.activities;
CREATE TRIGGER trg_crm_sync_activity_scope
BEFORE INSERT OR UPDATE OF organization_id, contact_id, opportunity_id, project_id
ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.crm_sync_activity_scope();

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.contacts, public.opportunities, public.activities TO service_role;

DROP POLICY IF EXISTS "CRM contacts read" ON public.contacts;
CREATE POLICY "CRM contacts read"
ON public.contacts FOR SELECT TO authenticated
USING (
  (
    organization_id IS NULL
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.read')
  )
);

DROP POLICY IF EXISTS "CRM contacts insert" ON public.contacts;
CREATE POLICY "CRM contacts insert"
ON public.contacts FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    organization_id IS NULL
    OR public.organization_has_capability(organization_id, 'crm.write')
  )
);

DROP POLICY IF EXISTS "CRM contacts update" ON public.contacts;
CREATE POLICY "CRM contacts update"
ON public.contacts FOR UPDATE TO authenticated
USING (
  (
    organization_id IS NULL
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
)
WITH CHECK (
  (
    organization_id IS NULL
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
);

DROP POLICY IF EXISTS "CRM contacts delete" ON public.contacts;
CREATE POLICY "CRM contacts delete"
ON public.contacts FOR DELETE TO authenticated
USING (
  (
    organization_id IS NULL
    AND created_by = auth.uid()
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
);

DROP POLICY IF EXISTS "CRM opportunities read" ON public.opportunities;
CREATE POLICY "CRM opportunities read"
ON public.opportunities FOR SELECT TO authenticated
USING (
  (
    organization_id IS NULL
    AND project_id IS NULL
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.read')
  )
  OR (
    project_id IS NOT NULL
    AND public.can_access_project(project_id, 'crm.read')
  )
);

DROP POLICY IF EXISTS "CRM opportunities insert" ON public.opportunities;
CREATE POLICY "CRM opportunities insert"
ON public.opportunities FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    (organization_id IS NULL AND project_id IS NULL)
    OR (
      organization_id IS NOT NULL
      AND public.organization_has_capability(organization_id, 'crm.write')
    )
    OR (
      project_id IS NOT NULL
      AND public.can_access_project(project_id, 'crm.write')
    )
  )
);

DROP POLICY IF EXISTS "CRM opportunities update" ON public.opportunities;
CREATE POLICY "CRM opportunities update"
ON public.opportunities FOR UPDATE TO authenticated
USING (
  (
    organization_id IS NULL
    AND project_id IS NULL
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
  OR (
    project_id IS NOT NULL
    AND public.can_access_project(project_id, 'crm.write')
  )
)
WITH CHECK (
  (
    organization_id IS NULL
    AND project_id IS NULL
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
  OR (
    project_id IS NOT NULL
    AND public.can_access_project(project_id, 'crm.write')
  )
);

DROP POLICY IF EXISTS "CRM opportunities delete" ON public.opportunities;
CREATE POLICY "CRM opportunities delete"
ON public.opportunities FOR DELETE TO authenticated
USING (
  (
    organization_id IS NULL
    AND project_id IS NULL
    AND created_by = auth.uid()
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
  OR (
    project_id IS NOT NULL
    AND public.can_access_project(project_id, 'crm.write')
  )
);

DROP POLICY IF EXISTS "CRM activities read" ON public.activities;
CREATE POLICY "CRM activities read"
ON public.activities FOR SELECT TO authenticated
USING (
  (
    organization_id IS NULL
    AND project_id IS NULL
    AND actor_id = auth.uid()
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.read')
  )
  OR (
    project_id IS NOT NULL
    AND public.can_access_project(project_id, 'crm.read')
  )
);

DROP POLICY IF EXISTS "CRM activities insert" ON public.activities;
CREATE POLICY "CRM activities insert"
ON public.activities FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (
    (organization_id IS NULL AND project_id IS NULL)
    OR (
      organization_id IS NOT NULL
      AND public.organization_has_capability(organization_id, 'crm.write')
    )
    OR (
      project_id IS NOT NULL
      AND public.can_access_project(project_id, 'crm.write')
    )
  )
);

DROP POLICY IF EXISTS "CRM activities update" ON public.activities;
CREATE POLICY "CRM activities update"
ON public.activities FOR UPDATE TO authenticated
USING (
  (
    organization_id IS NULL
    AND project_id IS NULL
    AND actor_id = auth.uid()
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
  OR (
    project_id IS NOT NULL
    AND public.can_access_project(project_id, 'crm.write')
  )
)
WITH CHECK (
  (
    organization_id IS NULL
    AND project_id IS NULL
    AND actor_id = auth.uid()
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
  OR (
    project_id IS NOT NULL
    AND public.can_access_project(project_id, 'crm.write')
  )
);

DROP POLICY IF EXISTS "CRM activities delete" ON public.activities;
CREATE POLICY "CRM activities delete"
ON public.activities FOR DELETE TO authenticated
USING (
  (
    organization_id IS NULL
    AND project_id IS NULL
    AND actor_id = auth.uid()
  )
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'crm.write')
  )
  OR (
    project_id IS NOT NULL
    AND public.can_access_project(project_id, 'crm.write')
  )
);

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER trg_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.contacts IS
  'Canonical CRM identity record. One person/company may have multiple opportunities.';
COMMENT ON TABLE public.opportunities IS
  'Canonical commercial opportunity linked to a contact and optionally a project/lot.';
COMMENT ON COLUMN public.opportunities.legacy_lead_id IS
  'Transition link to the legacy leads table; legacy UI remains authoritative until migrated.';
COMMENT ON TABLE public.activities IS
  'Appendable CRM timeline for calls, messages, meetings, visits, quotes, reservations and notes.';
