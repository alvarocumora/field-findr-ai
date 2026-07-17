-- Hotfix: 20260717020049 revocó EXECUTE de has_role e is_platform_admin a
-- anon/authenticated, pero ambas funciones se invocan DENTRO de políticas RLS,
-- que se evalúan con los privilegios del usuario que consulta. Sin EXECUTE,
-- cualquier query sobre tablas con esas políticas falla con
-- "permission denied for function has_role" — incluyendo el marketplace
-- público (políticas sin cláusula TO aplican también a anon) y los paneles
-- admin. Los REVOKE sobre funciones de trigger de esa migración sí son
-- seguros (los triggers no chequean EXECUTE al disparar) y se mantienen.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon, authenticated;
