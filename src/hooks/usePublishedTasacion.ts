import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublishedTasacion {
  id: string;
  listing_id: string | null;
  valor_uf: number | null;
  valor_clp: number | null;
  fecha_emision: string | null;
  tasador_nombre: string | null;
  version: number | null;
  revoked_at: string | null;
  blockchain_anchor: unknown;
  created_at: string;
}

/**
 * Latest non-revoked published tasación for a listing. Enables "already
 * appraised" reuse instead of rebuilding from scratch on every visit —
 * rows only match once publishes carry listing_id (wired in TasacionTeno).
 */
export const usePublishedTasacion = (listingId?: string | null) => {
  return useQuery({
    queryKey: ['published-tasacion', listingId],
    enabled: !!listingId,
    queryFn: async (): Promise<PublishedTasacion | null> => {
      const { data, error } = await supabase
        .from('tasaciones_publicadas')
        .select('id, listing_id, valor_uf, valor_clp, fecha_emision, tasador_nombre, version, revoked_at, blockchain_anchor, created_at')
        .eq('listing_id', listingId!)
        .is('revoked_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as PublishedTasacion) ?? null;
    },
  });
};
