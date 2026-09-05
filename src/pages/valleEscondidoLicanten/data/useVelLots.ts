import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const { data: live, isLoading } = useQuery({
    queryKey: ['vel-public-lots'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_lots', {
        p_project_id: VEL_PROJECT.id,
      });
      if (error) throw error;
      return (data ?? []) as unknown as PublicLot[];
    },
  });

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
