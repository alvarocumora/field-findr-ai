import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComparableRaw {
  id: string;
  title: string;
  city: string | null;
  region: string | null;
  type: string | null;
  area_m2: number | null;
  price: number | null;
  currency: string | null;
  lat: number | null;
  lng: number | null;
}

export interface ComparableScored {
  id: string;
  ubicacion: string;
  superficie: number;
  valorUF: number;
  valorM2UF: number;
  fuente: string;
  distanciaKm: number | null;
  weight: number;
  weightBreakdown: { tipo: number; area: number; distancia: number };
  matchTipo: boolean;
}

export interface ComparablesResult {
  items: ComparableScored[];
  weightedAvgM2UF: number;
  assumptions: string[];
  loading: boolean;
}

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const toUF = (price: number, currency: string | null, ufRate: number) =>
  currency === 'UF' ? price : Math.round(price / ufRate);

interface SubjectListing {
  id: string;
  region?: string | null;
  city?: string | null;
  type?: string | null;
  area_m2?: number | null;
  lat?: number | null;
  lng?: number | null;
}

export function useComparables(subject: SubjectListing | null, ufRate: number): ComparablesResult {
  const [items, setItems] = useState<ComparableScored[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subject?.region) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      // Buscar listings activos en la misma región (preferentemente misma comuna)
      const q = supabase
        .from('listings')
        .select('id, title, city, region, type, area_m2, price, currency, lat, lng')
        .eq('status', 'active')
        .neq('id', subject.id)
        .eq('region', subject.region)
        .not('price', 'is', null)
        .not('area_m2', 'is', null)
        .limit(40);

      const { data, error } = await q;
      if (error || cancelled) {
        setItems([]);
        setLoading(false);
        return;
      }

      const subjArea = subject.area_m2 || 0;
      const scored: ComparableScored[] = (data as ComparableRaw[])
        .filter((c) => c.area_m2 && c.price && c.area_m2 > 0)
        .map((c) => {
          const valorUF = toUF(Number(c.price), c.currency, ufRate);
          const valorM2UF = +(valorUF / Number(c.area_m2)).toFixed(3);

          const matchTipo = !!subject.type && c.type === subject.type;
          const wTipo = matchTipo ? 1 : 0.55;

          // Similitud de superficie: 1.0 si dentro de ±25 %, decae linealmente
          const ratio = subjArea > 0 ? Math.min(subjArea, c.area_m2!) / Math.max(subjArea, c.area_m2!) : 0.5;
          const wArea = +(0.4 + 0.6 * ratio).toFixed(2); // 0.4 → 1.0

          // Distancia
          let distanciaKm: number | null = null;
          let wDist = 0.6;
          if (subject.lat && subject.lng && c.lat && c.lng) {
            distanciaKm = +haversineKm(
              { lat: subject.lat, lng: subject.lng },
              { lat: Number(c.lat), lng: Number(c.lng) }
            ).toFixed(1);
            // 0 km → 1.0; 50 km → ~0.5; 200 km → ~0.2
            wDist = +Math.max(0.15, 1 / (1 + distanciaKm / 50)).toFixed(2);
          } else if (c.city && subject.city && c.city === subject.city) {
            wDist = 0.9;
          }

          const weight = +(wTipo * wArea * wDist).toFixed(3);

          return {
            id: c.id,
            ubicacion: [c.city, c.region].filter(Boolean).join(', ') || 'Sector cercano',
            superficie: Math.round(Number(c.area_m2)),
            valorUF,
            valorM2UF,
            fuente: 'OFERTA TERRENOS · listings activos',
            distanciaKm,
            weight,
            weightBreakdown: { tipo: wTipo, area: wArea, distancia: wDist },
            matchTipo,
          };
        })
        // Filtrar outliers obvios (UF/m² entre 0.05 y 50)
        .filter((c) => c.valorM2UF >= 0.05 && c.valorM2UF <= 50)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 8);

      if (!cancelled) {
        setItems(scored);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [subject?.id, subject?.region, subject?.city, subject?.type, subject?.area_m2, ufRate]);

  const totalW = items.reduce((s, c) => s + c.weight, 0);
  const weightedAvgM2UF = totalW > 0
    ? +(items.reduce((s, c) => s + c.valorM2UF * c.weight, 0) / totalW).toFixed(3)
    : 0;

  const assumptions = [
    'Universo: publicaciones activas en la misma región, excluyendo la propiedad actual.',
    'Conversión a UF: precios en CLP se dividen por la tasa UF→CLP indicada en el selector superior.',
    'Peso por tipo de uso: coincidencia exacta = 1.00; tipo distinto = 0.55.',
    'Peso por superficie: 0.40 + 0.60 × (min/máx superficie). Predios ±25 % obtienen ≥ 0.85.',
    'Peso por distancia: 1 / (1 + km/50). Misma comuna sin coordenadas = 0.90.',
    'Filtro de outliers: se descartan precios fuera del rango 0.05–50 UF/m².',
    'Valor sugerido = promedio ponderado de UF/m² (peso = w_tipo × w_área × w_distancia).',
  ];

  return { items, weightedAvgM2UF, assumptions, loading };
}
