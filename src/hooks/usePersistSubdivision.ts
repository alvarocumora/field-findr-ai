import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TablesInsert } from '@/integrations/supabase/types';
import type { LotDraftRow } from '@/lib/subdivision/persistLots';

export interface PersistSubdivisionData {
  projectId: string;
  lots: LotDraftRow[];
  /** Project perimeter as a [lng,lat] ring — stored in projects.boundary. */
  boundary?: [number, number][];
}

/**
 * Persist an auto-generated masterplan: bulk-insert the generated lots into the
 * project and store the macro-lot boundary. Lot counts are maintained by the
 * project trigger, so we only invalidate the caches afterwards.
 */
export const usePersistSubdivision = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, lots, boundary }: PersistSubdivisionData) => {
      if (!user?.id) throw new Error('Debes iniciar sesión');
      if (lots.length === 0) throw new Error('No hay lotes para guardar');

      const rows: TablesInsert<'lots'>[] = lots.map((l) => ({
        project_id: l.project_id,
        user_id: user.id,
        lot_number: l.lot_number,
        name: l.name,
        area: l.area,
        price: l.price,
        price_per_sqm: l.price_per_sqm,
        status: l.status,
        polygon: l.polygon as unknown as TablesInsert<'lots'>['polygon'],
      }));

      const { error: lotsError } = await supabase.from('lots').insert(rows);
      if (lotsError) throw lotsError;

      if (boundary && boundary.length >= 3) {
        // `boundary` is not in the generated types yet — cast the builder.
        const { error: projError } = await (supabase.from as CallableFunction)('projects')
          .update({ boundary })
          .eq('id', projectId);
        if (projError) throw projError;
      }

      return lots.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`${count} lote${count === 1 ? '' : 's'} guardado${count === 1 ? '' : 's'} en el proyecto`);
    },
    onError: (error: Error) => {
      toast.error('No se pudieron guardar los lotes', { description: error.message });
    },
  });
};
