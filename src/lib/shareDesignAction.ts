import { supabase } from '@/integrations/supabase/client';
import { getCanonicalUrl, getShareUrl } from '@/lib/publicUrls';

/**
 * Plain (non-hook) action to publish a shared parcela design, so it can be
 * called from event handlers. Read side lives in useShareDesign.
 */

export interface ShareDesignInput {
  designJson: string;              // ParcelaState.toJSON()
  polygon: number[][] | null;
  lotNumber?: string;
  title?: string;
  area?: number;
  latitude?: number;
  longitude?: number;
}

export const shareLink = (token: string): string =>
  getCanonicalUrl(`/diseno/${token}`);

export async function createSharedDesign(input: ShareDesignInput): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Debes iniciar sesión para compartir tu diseño');

  // shared_designs is not in the generated types yet.
  const { data, error } = await (supabase.from as CallableFunction)('shared_designs')
    .insert({
      created_by: user.id,
      design_json: JSON.parse(input.designJson || '[]'),
      polygon: input.polygon,
      lot_number: input.lotNumber ?? null,
      title: input.title ?? null,
      area: input.area ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    })
    .select('token')
    .single();

  if (error) throw error;
  return (data as { token: string }).token;
}
