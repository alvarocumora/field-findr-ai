import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EXPLORA_PARK_LOTS, type EpLot, type EpLotStatus } from './lots';
import { EXPLORA_PARK_PROJECT } from './project';

/**
 * Masterplan real de Explora Park.
 *
 * La geometría oficial (polígonos del KMZ topografiado) vive en `lots.ts`, pero
 * el estado comercial (precio, disponibilidad, ficha publicada) es dinámico y
 * se lee en vivo desde la base con `get_public_lots`. Ambos se fusionan por
 * número de lote para que el plano sea siempre usable y consistente con el
 * inventario publicado.
 */
type PublicLot = {
  id: string;
  lot_number: string | null;
  status: string | null;
  price: number | null;
  area: number | null;
  listing_id: string | null;
  polygon: unknown;
  latitude: number | null;
  longitude: number | null;
};

const toStatus = (s: string | null | undefined): EpLotStatus | null => {
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

/** Extrae un anillo [lng,lat][] desde los formatos de polígono guardados. */
const ringOf = (polygon: unknown): [number, number][] | null => {
  const raw = Array.isArray(polygon)
    ? polygon
    : (polygon as { coordinates?: unknown })?.coordinates ?? null;
  if (!Array.isArray(raw)) return null;
  const ring = Array.isArray(raw[0]) && Array.isArray((raw[0] as unknown[])[0])
    ? (raw[0] as unknown[])
    : raw;
  const pts = (ring as unknown[])
    .map((p) => {
      if (Array.isArray(p) && p.length >= 2) return [Number(p[0]), Number(p[1])] as [number, number];
      const o = p as { lng?: number; lat?: number };
      if (o && typeof o.lng === 'number' && typeof o.lat === 'number') return [o.lng, o.lat] as [number, number];
      return null;
    })
    .filter((p): p is [number, number] => !!p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  return pts.length >= 3 ? pts : null;
};

const centroidOf = (ring: [number, number][]): [number, number] => {
  const sum = ring.reduce((acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
};

export const useEpLots = () => {
  const { data: live, isLoading } = useQuery({
    queryKey: ['explora-park-public-lots'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_lots', {
        p_project_id: EXPLORA_PARK_PROJECT.id,
      });
      if (error) throw error;
      return (data ?? []) as unknown as PublicLot[];
    },
  });

  const lots = useMemo<EpLot[]>(() => {
    if (!live?.length) return EXPLORA_PARK_LOTS;

    const byNumber = new Map<string, PublicLot>();
    for (const l of live) if (l.lot_number) byNumber.set(String(l.lot_number), l);

    const merged: EpLot[] = EXPLORA_PARK_LOTS.map((base) => {
      const db = byNumber.get(base.lot_number);
      if (!db) return base;
      byNumber.delete(base.lot_number);
      return {
        ...base,
        area_m2: db.area ? Math.round(db.area) : base.area_m2,
        area_ha: db.area ? Math.round((db.area / 10000) * 100) / 100 : base.area_ha,
        price_clp: db.price ?? base.price_clp,
        status: toStatus(db.status) ?? base.status,
        listing_id: db.listing_id ?? base.listing_id,
      };
    });

    // Lotes que existen en base pero no en el KMZ estático: se agregan con su
    // propia geometría para que el plano refleje el inventario completo.
    for (const db of byNumber.values()) {
      const ring = ringOf(db.polygon);
      if (!ring) continue;
      merged.push({
        id: db.id,
        lot_number: String(db.lot_number ?? ''),
        area_m2: db.area ? Math.round(db.area) : 0,
        area_ha: db.area ? Math.round((db.area / 10000) * 100) / 100 : 0,
        price_clp: db.price ?? 0,
        status: toStatus(db.status) ?? 'available',
        centroid: centroidOf(ring),
        polygon: ring,
        listing_id: db.listing_id ?? null,
      });
    }

    return merged;
  }, [live]);

  return { lots, isLoading, isLive: !!live?.length };
};
