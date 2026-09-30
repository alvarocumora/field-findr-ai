-- CRM scope hardening after post-merge review.
-- Fixes cross-tenant/contact reassignment and private-workspace subject access.

CREATE OR REPLACE FUNCTION public.crm_can_write_contact(
  _contact_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contacts contact
    WHERE contact.id = _contact_id
      AND (
        (
          contact.organization_id IS NULL
          AND _user_id IN (contact.created_by, contact.assigned_to)
        )
        OR (
          contact.organization_id IS NOT NULL
          AND public.organization_has_capability(
            contact.organization_id,
            'crm.write',
            _user_id
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.crm_can_write_opportunity(
  _opportunity_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.opportunities opportunity
    WHERE opportunity.id = _opportunity_id
      AND (
        (
          opportunity.organization_id IS NULL
          AND opportunity.project_id IS NULL
          AND _user_id IN (opportunity.created_by, opportunity.assigned_to)
        )
        OR (
          opportunity.organization_id IS NOT NULL
          AND public.organization_has_capability(
            opportunity.organization_id,
            'crm.write',
            _user_id
          )
        )
        OR (
          opportunity.project_id IS NOT NULL
          AND public.can_access_project(
            opportunity.project_id,
            'crm.write',
            _user_id
          )
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.crm_can_write_contact(uuid, uuid)
TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_can_write_opportunity(uuid, uuid)
TO authenticated, service_role;

-- Re-run opportunity scope synchronization whenever contact_id changes.
DROP TRIGGER IF EXISTS trg_crm_sync_opportunity_scope
  ON public.opportunities;
CREATE TRIGGER trg_crm_sync_opportunity_scope
BEFORE INSERT OR UPDATE OF organization_id, contact_id, project_id, lot_id, status
ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.crm_sync_opportunity_scope();

-- Prevent tenant moves that would strand child records under the old scope.
CREATE OR REPLACE FUNCTION public.crm_guard_contact_scope_move()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id
     AND (
       EXISTS (
         SELECT 1
         FROM public.opportunities opportunity
         WHERE opportunity.contact_id = OLD.id
       )
       OR EXISTS (
         SELECT 1
         FROM public.activities activity
         WHERE activity.contact_id = OLD.id
       )
     ) THEN
    RAISE EXCEPTION
      'CRM contact organization cannot change while opportunities or activities exist';
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.crm_guard_contact_scope_move()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_crm_guard_contact_scope_move
  ON public.contacts;
CREATE TRIGGER trg_crm_guard_contact_scope_move
BEFORE UPDATE OF organization_id
ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.crm_guard_contact_scope_move();

-- A private contact must be writable by the caller before it can become the
-- subject of an opportunity. Tenant/project checks still apply in parallel.
DROP POLICY IF EXISTS "CRM opportunities insert" ON public.opportunities;
CREATE POLICY "CRM opportunities insert"
ON public.opportunities FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.crm_can_write_contact(contact_id)
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
  public.crm_can_write_contact(contact_id)
  AND (
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
);

-- Activities must be writable through their actual subject. This closes the
-- null-organization private-workspace bypass for guessed subject UUIDs.
DROP POLICY IF EXISTS "CRM activities insert" ON public.activities;
CREATE POLICY "CRM activities insert"
ON public.activities FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (
    (
      opportunity_id IS NOT NULL
      AND public.crm_can_write_opportunity(opportunity_id)
    )
    OR (
      opportunity_id IS NULL
      AND contact_id IS NOT NULL
      AND public.crm_can_write_contact(contact_id)
    )
  )
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
    (
      opportunity_id IS NOT NULL
      AND public.crm_can_write_opportunity(opportunity_id)
    )
    OR (
      opportunity_id IS NULL
      AND contact_id IS NOT NULL
      AND public.crm_can_write_contact(contact_id)
    )
  )
  AND (
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
);
