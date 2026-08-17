import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { distanceMeters, normalizeTaxId } from '@/lib/geo/coordinateValidation';

export interface DuplicateCandidate {
  id: string;
  title: string;
  location: string | null;
  area_ha: number | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  isMine: boolean;
  /** Distancia al punto marcado, en metros (null si el match fue por identificador). */
  distance: number | null;
  reason: 'same_tax_id' | 'nearby';
}

interface Params {
  lat: number | null;
  lng: number | null;
  rol?: string | null;
  areaHa?: number | null;
  userId?: string | null;
  /** Radio de búsqueda en metros. */
  radius?: number;
  /** Se excluye a sí mismo al editar una publicación existente. */
  excludeId?: string;
  enabled?: boolean;
}

const DEG_PER_METER_LAT = 1 / 111_320;

/**
 * Busca publicaciones existentes que puedan ser la misma propiedad:
 * mismo identificador catastral o un punto muy cercano con superficie similar.
 */
export const useDuplicateCheck = ({
  lat,
  lng,
  rol,
  areaHa,
  userId,
  radius = 250,
  excludeId,
  enabled = true,
}: Params) => {
  const taxId = normalizeTaxId(rol);
  const hasPoint = typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng);

  return useQuery({
    queryKey: ['duplicate-check', lat, lng, taxId, radius, excludeId],
    enabled: enabled && (hasPoint || taxId.length >= 4),
    staleTime: 60_000,
    queryFn: async (): Promise<DuplicateCandidate[]> => {
      const found = new Map<string, DuplicateCandidate>();

      const toCandidate = (
        row: Record<string, unknown>,
        reason: DuplicateCandidate['reason'],
        distance: number | null,
      ): DuplicateCandidate => ({
        id: String(row.id),
        title: String(row.title ?? 'Publicación sin título'),
        location: (row.location as string) ?? null,
        area_ha: (row.area_ha as number) ?? null,
        price: (row.price as number) ?? null,
        currency: (row.currency as string) ?? null,
        status: (row.status as string) ?? null,
        isMine: !!userId && row.user_id === userId,
        distance,
        reason,
      });

      // 1. Coincidencia por identificador catastral (ROL / CUIT / matrícula).
      if (taxId.length >= 4) {
        const { data } = await supabase
          .from('listings')
          .select('id, title, location, area_ha, price, currency, status, user_id, rol, lat, lng')
          .not('rol', 'is', null)
          .limit(200);

        (data ?? [])
          .filter((r) => normalizeTaxId(r.rol) === taxId && r.id !== excludeId)
          .forEach((r) => found.set(r.id, toCandidate(r, 'same_tax_id', null)));
      }

      // 2. Coincidencia por cercanía geográfica dentro del radio indicado.
      if (hasPoint) {
        const dLat = radius * DEG_PER_METER_LAT;
        const dLng = dLat / Math.max(0.05, Math.cos((lat! * Math.PI) / 180));

        const { data } = await supabase
          .from('listings')
          .select('id, title, location, area_ha, price, currency, status, user_id, lat, lng')
          .gte('lat', lat! - dLat)
          .lte('lat', lat! + dLat)
          .gte('lng', lng! - dLng)
          .lte('lng', lng! + dLng)
          .limit(100);

        (data ?? []).forEach((r) => {
          if (r.id === excludeId || found.has(r.id)) return;
          if (typeof r.lat !== 'number' || typeof r.lng !== 'number') return;
          const distance = distanceMeters({ lat: lat!, lng: lng! }, { lat: r.lat, lng: r.lng });
          if (distance > radius) return;

          // Si ambas superficies son conocidas y difieren mucho, es un vecino, no un duplicado.
          const similarArea =
            !areaHa || !r.area_ha ? true : Math.abs(r.area_ha - areaHa) / Math.max(r.area_ha, areaHa) < 0.35;
          if (!similarArea && distance > 60) return;

          found.set(r.id, toCandidate(r, 'nearby', Math.round(distance)));
        });
      }

      return [...found.values()].sort((a, b) => (a.distance ?? -1) - (b.distance ?? -1));
    },
  });
};
