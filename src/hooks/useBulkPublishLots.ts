import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  lotToListingInput,
  publishableLots,
  type LotForListing,
  type ProjectForListing,
  type MarketplaceType,
} from '@/lib/marketplace/lotToListing';

type BulkLot = LotForListing & { id: string; status?: string | null; listing_id?: string | null };

export interface BulkPublishArgs {
  project: ProjectForListing;
  lots: BulkLot[];
  type?: MarketplaceType;
}

export interface BulkPublishResult {
  published: number;
  total: number;
  /** Set when the run stopped early (e.g. the plan quota was reached). */
  stopped?: string;
}

/** Try to read the server-provided message from a publish-listing 4xx error. */
async function readFnError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const payload = await ctx.json();
      const p = payload as { message?: unknown; error?: unknown };
      return String(p?.message ?? p?.error ?? (error as Error).message);
    } catch {
      /* fall through */
    }
  }
  return (error as Error)?.message ?? 'Error';
}

/**
 * Publish every eligible lot of a project to the marketplace in one action.
 * Runs sequentially through the quota-enforcing `publish-listing` edge function
 * and stops cleanly when the plan limit is hit, reporting how many made it.
 */
export const useBulkPublishLots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ project, lots, type }: BulkPublishArgs): Promise<BulkPublishResult> => {
      const eligible = publishableLots(lots);
      let published = 0;
      let stopped: string | undefined;

      for (const lot of eligible) {
        const input = lotToListingInput(lot, project, { type });
        const { data, error } = await supabase.functions.invoke('publish-listing', { body: { listing: input } });
        if (error) {
          stopped = await readFnError(error);
          break;
        }
        const listing = (data as { listing?: { id: string } })?.listing;
        if (!listing?.id) {
          stopped = 'El servidor no devolvió la propiedad creada';
          break;
        }
        const { error: linkError } = await (supabase.from as CallableFunction)('lots')
          .update({ listing_id: listing.id })
          .eq('id', lot.id);
        if (linkError) {
          stopped = linkError.message;
          break;
        }
        published += 1;
      }

      return { published, total: eligible.length, stopped };
    },
    onSuccess: ({ published, total, stopped }) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (published === 0 && stopped) {
        toast.error('No se pudo publicar', { description: stopped });
      } else if (stopped) {
        toast.warning(`Publicados ${published} de ${total}`, { description: `Se detuvo: ${stopped}` });
      } else {
        toast.success(`${published} lote${published === 1 ? '' : 's'} publicado${published === 1 ? '' : 's'} en el marketplace`);
      }
    },
    onError: (error: Error) => {
      toast.error('Error al publicar lotes', { description: error.message });
    },
  });
};
