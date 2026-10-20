import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CAONE_LOTS, type CaoneLot, type CaoneLotStatus } from './lots';
import { CAONE_PROJECT } from './project';

/**
 * Valle de Hualañé (Sector Caone, ROL 168-921).
 *
 * La superficie por lote vive estática en `lots.ts`; el estado comercial
 * (disponible/reservado/vendido), el precio y el listing_id se leen en vivo
 * con `get_public_lots` y se fusionan por número de parcela — mismo patrón
 * que `useVelLots`, para que esta landing nunca muestre como disponible un
 * lote ya reservado o vendido en la plataforma.
 */
type PublicLot = {
  id: string;
  lot_number: string | null;
  status: string | null;
  price: number | null;
  area: number | null;
  listing_id: string | null;
};

const QUERY_KEY = ['caone-public-lots'] as const;

const toStatus = (s: string | null | undefined): CaoneLotStatus | null => {
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

export const useCaoneLots = () => {
  const queryClient = useQueryClient();
  const { data: live, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    staleTime: 15_000,
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_lots', {
        p_project_id: CAONE_PROJECT.id,
      });
      if (error) throw error;
      return (data ?? []) as unknown as PublicLot[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`caone-lots-${CAONE_PROJECT.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lots',
          filter: `project_id=eq.${CAONE_PROJECT.id}`,
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

  // Solo un estado reconocido desde la RPC puede presentarse al comprador
  // como disponibilidad verificada; el KMZ estático aporta geometría, no stock.
  const verifiedLotNumbers = useMemo(() => {
    // React Query puede conservar la última respuesta exitosa durante un
    // refetch fallido: eso NO confirma disponibilidad vigente.
    if (isError) return new Set<string>();
    return new Set(
      (live ?? [])
        .filter((lot) => lot.lot_number != null && toStatus(lot.status) !== null)
        .map((lot) => String(lot.lot_number)),
    );
  }, [live, isError]);

  const lots = useMemo<CaoneLot[]>(() => {
    if (!live?.length) return CAONE_LOTS;
    const byNumber = new Map<string, PublicLot>();
    for (const l of live) if (l.lot_number) byNumber.set(String(l.lot_number), l);

    return CAONE_LOTS.map((base) => {
      const db = byNumber.get(base.lot_number);
      if (!db) return base;
      return {
        ...base,
        area_ha: db.area ? Math.round((db.area / 10_000) * 100) / 100 : base.area_ha,
        price_clp: db.price ?? base.price_clp,
        status: toStatus(db.status) ?? base.status,
        listing_id: db.listing_id ?? base.listing_id,
      };
    });
  }, [live]);

  const verifiedCount = lots.filter((lot) => verifiedLotNumbers.has(lot.lot_number)).length;
  const available = lots.filter((lot) =>
    verifiedLotNumbers.has(lot.lot_number) && lot.status === 'available',
  ).length;

  return {
    lots,
    available,
    isLoading,
    isError,
    refetch,
    isLive: verifiedCount > 0,
    verifiedCount,
    verifiedLotNumbers,
  };
};
