-- Serialize CRM child creation with contact tenant moves.
-- A FK only takes KEY SHARE, which is compatible with a non-key UPDATE on
-- contacts.organization_id. Explicit FOR UPDATE locks below make the two
-- operations mutually exclusive so children cannot commit in the old tenant.

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
  WHERE contact.id = NEW.contact_id
  FOR UPDATE;

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
    -- Serialize activity creation/reassignment with opportunity changes first.
    SELECT opportunity.contact_id,
           opportunity.project_id,
           opportunity.organization_id
      INTO v_contact_id, v_project_id, v_organization_id
    FROM public.opportunities AS opportunity
    WHERE opportunity.id = NEW.opportunity_id
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRM activity opportunity not found';
    END IF;

    -- Then take a conflicting contact lock so organization moves wait until
    -- the activity scope has been derived and committed/rolled back.
    SELECT contact.organization_id
      INTO v_contact_organization_id
    FROM public.contacts AS contact
    WHERE contact.id = v_contact_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRM activity contact not found';
    END IF;

    IF v_organization_id IS DISTINCT FROM v_contact_organization_id THEN
      RAISE EXCEPTION 'CRM activity opportunity and contact organization mismatch';
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
  ELSIF NEW.contact_id IS NOT NULL THEN
    SELECT contact.organization_id
      INTO v_contact_organization_id
    FROM public.contacts AS contact
    WHERE contact.id = NEW.contact_id
    FOR UPDATE;

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
