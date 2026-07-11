import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCreateListing } from './useListings';
import {
  lotToListingInput,
  type LotForListing,
  type ProjectForListing,
  type MarketplaceType,
} from '@/lib/marketplace/lotToListing';

export interface PublishLotArgs {
  lot: LotForListing & { id: string };
  project: ProjectForListing;
  type?: MarketplaceType;
}

/**
 * Publish a project lot to the marketplace and link them:
 *  - `publish` derives a listing from the lot + project, creates it through the
 *    quota-enforcing `publish-listing` edge function, then stores the new
 *    listing id on `lots.listing_id`.
 *  - `unpublish` deactivates the listing and clears the link.
 */
export const usePublishLotListing = () => {
  const queryClient = useQueryClient();
  const createListing = useCreateListing();

  // `listing_id` is not in the generated lots type yet — cast the builder.
  const setLotListing = (lotId: string, listingId: string | null) =>
    (supabase.from as CallableFunction)('lots').update({ listing_id: listingId }).eq('id', lotId);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['lots'] });
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const publish = useMutation({
    mutationFn: async ({ lot, project, type }: PublishLotArgs) => {
      if (!(Number(lot.price) > 0)) throw new Error('Asigna un precio al lote antes de publicarlo');
      const input = lotToListingInput(lot, project, { type });
      const listing = await createListing.mutateAsync(input);
      const { error } = await setLotListing(lot.id, listing.id);
      if (error) throw error;
      return listing;
    },
    onSuccess: () => {
      // createListing already toasts "Propiedad publicada"; just refresh caches.
      invalidate();
    },
    onError: (error: Error) => {
      toast.error('No se pudo publicar el lote', { description: error.message });
    },
  });

  const unpublish = useMutation({
    mutationFn: async ({ lotId, listingId }: { lotId: string; listingId: string }) => {
      const { error: listingErr } = await supabase
        .from('listings')
        .update({ status: 'inactive' })
        .eq('id', listingId);
      if (listingErr) throw listingErr;
      const { error: lotErr } = await setLotListing(lotId, null);
      if (lotErr) throw lotErr;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Lote retirado del marketplace');
    },
    onError: (error: Error) => {
      toast.error('No se pudo retirar la publicación', { description: error.message });
    },
  });

  return { publish, unpublish };
};
