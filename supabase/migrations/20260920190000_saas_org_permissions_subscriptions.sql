-- Phase 2 SaaS: organization-owned billing and capability-based access.
-- Additive and backwards compatible: legacy user-owned rows remain valid.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id
  ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id
  ON public.payments(organization_id);

-- Associate legacy billing with the owner's first organization when possible.
UPDATE public.subscriptions AS subscription
SET organization_id = (
  SELECT organization.id
  FROM public.organizations AS organization
  WHERE organization.owner_id = subscription.user_id
  ORDER BY organization.created_at ASC
  LIMIT 1
)
WHERE subscription.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organizations AS organization
    WHERE organization.owner_id = subscription.user_id
  );

UPDATE public.payments AS payment
SET organization_id = COALESCE(
  (
    SELECT subscription.organization_id
    FROM public.subscriptions AS subscription
    WHERE subscription.user_id = payment.user_id
      AND subscription.organization_id IS NOT NULL
    ORDER BY subscription.created_at DESC
    LIMIT 1
  ),
  (
    SELECT organization.id
    FROM public.organizations AS organization
    WHERE organization.owner_id = payment.user_id
    ORDER BY organization.created_at ASC
    LIMIT 1
  )
)
WHERE payment.organization_id IS NULL;

CREATE OR REPLACE FUNCTION public.organization_role(
  _organization_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = _organization_id AND owner_id = _user_id
    ) THEN 'owner'
    ELSE (
      SELECT role
      FROM public.organization_members
      WHERE organization_id = _organization_id AND user_id = _user_id
      LIMIT 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.organization_has_capability(
  _organization_id uuid,
  _capability text,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE public.organization_role(_organization_id, _user_id)
    WHEN 'owner' THEN true
    WHEN 'admin' THEN true
    WHEN 'org_admin' THEN true
    WHEN 'commercial_manager' THEN _capability = ANY (ARRAY[
      'projects.read','projects.write','inventory.read','inventory.write',
      'crm.read','crm.write','reservations.read','reservations.write',
      'sales.read','reports.read','team.read'
    ])
    WHEN 'sales_agent' THEN _capability = ANY (ARRAY[
      'projects.read','inventory.read','crm.read','crm.write',
      'reservations.read','reservations.write','sales.read','commissions.read'
    ])
    WHEN 'member' THEN _capability = ANY (ARRAY[
      'projects.read','inventory.read','crm.read','crm.write',
      'reservations.read','reservations.write','sales.read','commissions.read'
    ])
    WHEN 'operations' THEN _capability = ANY (ARRAY[
      'projects.read','projects.write','inventory.read','inventory.write',
      'reservations.read','reservations.write','documents.read','documents.write'
    ])
    WHEN 'finance' THEN _capability = ANY (ARRAY[
      'sales.read','payments.read','payments.write',
      'commissions.read','commissions.write','reports.read'
    ])
    WHEN 'viewer' THEN _capability = ANY (ARRAY[
      'projects.read','inventory.read','crm.read','reservations.read',
      'sales.read','payments.read','commissions.read','reports.read','team.read'
    ])
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.organization_role(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.organization_has_capability(uuid, text, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Organization members can view subscriptions" ON public.subscriptions;
CREATE POLICY "Organization members can view subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (
  organization_id IS NOT NULL
  AND public.organization_has_capability(organization_id, 'payments.read')
);

DROP POLICY IF EXISTS "Organization members can view payments" ON public.payments;
CREATE POLICY "Organization members can view payments"
ON public.payments FOR SELECT TO authenticated
USING (
  organization_id IS NOT NULL
  AND public.organization_has_capability(organization_id, 'payments.read')
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'external_broker',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can view their assignments" ON public.project_members;
CREATE POLICY "Project members can view their assignments"
ON public.project_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.projects AS project
    WHERE project.id = project_members.project_id
      AND project.organization_id IS NOT NULL
      AND public.organization_has_capability(project.organization_id, 'team.read')
  )
);

DROP POLICY IF EXISTS "Organization admins manage project members" ON public.project_members;
CREATE POLICY "Organization admins manage project members"
ON public.project_members FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects AS project
    WHERE project.id = project_members.project_id
      AND project.organization_id IS NOT NULL
      AND public.organization_has_capability(project.organization_id, 'team.write')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects AS project
    WHERE project.id = project_members.project_id
      AND project.organization_id IS NOT NULL
      AND public.organization_has_capability(project.organization_id, 'team.write')
  )
);

CREATE OR REPLACE FUNCTION public.can_access_project(
  _project_id uuid,
  _capability text DEFAULT 'projects.read',
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
    FROM public.projects AS project
    WHERE project.id = _project_id
      AND (
        project.user_id = _user_id
        OR (
          project.organization_id IS NOT NULL
          AND public.organization_has_capability(project.organization_id, _capability, _user_id)
        )
        OR EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_id = _project_id AND user_id = _user_id
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_project(uuid, text, uuid) TO authenticated, service_role;
