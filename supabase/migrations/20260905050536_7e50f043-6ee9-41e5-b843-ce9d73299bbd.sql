CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = _org_id AND m.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_org_owner(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = _org_id AND o.owner_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Org members can view their org" ON public.organizations;
CREATE POLICY "Org members can view their org"
ON public.organizations FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR public.is_org_member(id));

DROP POLICY IF EXISTS "Org owners manage members" ON public.organization_members;
CREATE POLICY "Org owners manage members"
ON public.organization_members FOR ALL TO authenticated
USING (public.is_org_owner(organization_id))
WITH CHECK (public.is_org_owner(organization_id));

DROP POLICY IF EXISTS "Owners can view org members" ON public.organization_members;
CREATE POLICY "Owners can view org members"
ON public.organization_members FOR SELECT TO authenticated
USING (public.is_org_owner(organization_id));