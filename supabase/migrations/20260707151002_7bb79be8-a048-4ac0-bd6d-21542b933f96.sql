
-- 1) Revoke EXECUTE on SECURITY DEFINER RPCs that must not be callable by anon
REVOKE EXECUTE ON FUNCTION public.adjust_lot_prices(uuid, text, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.extend_reservation(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_commission_paid(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.register_sale(uuid, numeric, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2) organization_members: eliminate self-referencing subquery in SELECT policy
DROP POLICY IF EXISTS "Members can view their org members" ON public.organization_members;

CREATE POLICY "Members can view their own membership"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners can view org members"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_members.organization_id
        AND o.owner_id = auth.uid()
    )
  );

-- 3) tasaciones_publicadas: restrict sensitive columns from public read
REVOKE SELECT ON public.tasaciones_publicadas FROM anon, authenticated;

GRANT SELECT (
  id, listing_id, comuna, region, direccion, rol,
  valor_uf, valor_clp, valor_m2_uf, superficie_m2,
  fecha_emision, tasador_nombre, lang,
  pdf_path, pdf_sha256, pdf_final_path, pdf_final_sha256,
  payload_json, version, revoked_at, revoked_reason,
  blockchain_anchor, created_at, updated_at
) ON public.tasaciones_publicadas TO anon, authenticated;

-- Keep publisher and admin write paths working
GRANT INSERT, UPDATE, DELETE ON public.tasaciones_publicadas TO authenticated;
GRANT ALL ON public.tasaciones_publicadas TO service_role;
-- Sensitive columns intentionally excluded from anon/authenticated SELECT:
--   publisher_user_id, firma_data_hash, payload_hash
