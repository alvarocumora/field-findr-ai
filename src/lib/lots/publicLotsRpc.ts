import { supabase } from '@/integrations/supabase/client';
import { withOfficialArea } from './lotSurface';

/** Lectura pública de lotes con superficie oficial DL 3.516 (mín. 5.000 m²). */
export async function rpcPublicLots(args: { p_project_id: string | null }) {
  const res = await supabase.rpc('get_public_lots', args as { p_project_id: string });
  return { ...res, data: res.data ? res.data.map(withOfficialArea) : res.data };
}
