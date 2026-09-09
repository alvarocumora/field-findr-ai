import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VEL_LOTS, type VelLot, type VelLotStatus } from './lots';
import { VEL_PROJECT } from './project';

/**
 * Masterplan de Valle Escondido Licantén.
 *
 * La geometría (polígonos derivados del levantamiento KMZ + cuadro de
 * superficies del plano oficial) vive estática en `lots.ts`; el estado
 * comercial (precio, disponibilidad, ficha publicada) se lee en vivo con
 * `get_public_lots` y se fusiona por número de parcela.
 */
type PublicLot = {
  id: string;
  lot_number: string | null;
  status: string | null;
  price: number | null;
  area: number | null;
  listing_id: string | null;
};

const QUERY_KEY = ['vel-public-lots'] as const;

const toStatus = (s: string | null | undefined): VelLotStatus | null => {
  switch ((s ?? '').toLowerCase()) {
    case 'available':
    case 'disponible':
      return 'available';
    case 'reserved':
    case 'reservado':
    case 'reservada':
      return 'reserved';
    case 'sold':
    case 'vendido':
    case 'vendida':
      return 'sold';
    default:
      return null;
  }
};

export const useVelLots = () => {
  const queryClient = useQueryClient();
  const { data: live, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    staleTime: 15_000,
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_lots', {
        p_project_id: VEL_PROJECT.id,
      });
      if (error) throw error;
      return (data ?? []) as unknown as PublicLot[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`vel-lots-${VEL_PROJECT.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lots',
          filter: `project_id=eq.${VEL_PROJECT.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const lots = useMemo<VelLot[]>(() => {
    if (!live?.length) return VEL_LOTS;
    const byNumber = new Map<string, PublicLot>();
    for (const l of live) if (l.lot_number) byNumber.set(String(l.lot_number), l);

    return VEL_LOTS.map((base) => {
      const db = byNumber.get(base.lot_number);
      if (!db) return base;
      return {
        ...base,
        area_m2: db.area ? Math.round(db.area) : base.area_m2,
        area_ha: db.area ? Math.round((db.area / 10000) * 100) / 100 : base.area_ha,
        price_clp: db.price ?? base.price_clp,
        status: toStatus(db.status) ?? base.status,
        listing_id: db.listing_id ?? base.listing_id,
      };
    });
  }, [live]);

  return { lots, isLoading, isLive: !!live?.length };
};
