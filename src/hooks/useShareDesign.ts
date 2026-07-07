import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export { shareLink, createSharedDesign, type ShareDesignInput } from '@/lib/shareDesignAction';

export interface SharedDesign {
  id: string;
  token: string;
  lot_number: string | null;
  title: string | null;
  area: number | null;
  polygon: number[][] | null;
  latitude: number | null;
  longitude: number | null;
  design_json: unknown; // parsed jsonb (array of placed objects)
  created_at: string;
}

/** Public read of a shared design by token (migration 20260707120000). */
export const useSharedDesign = (token: string | undefined) =>
  useQuery({
    queryKey: ['shared-design', token],
    enabled: !!token,
    queryFn: async (): Promise<SharedDesign | null> => {
      const { data, error } = await (supabase.rpc as CallableFunction)('get_shared_design', {
        p_token: token,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as SharedDesign) ?? null;
    },
  });
