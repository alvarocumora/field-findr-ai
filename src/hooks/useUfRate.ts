import { useEffect, useState } from 'react';

/**
 * Hook que obtiene la UF actual y valores históricos referenciales desde
 * la API pública de mindicador.cl (datos del Banco Central de Chile).
 *
 * Endpoints (sin API key, CORS habilitado):
 *  - https://mindicador.cl/api/uf            → último valor publicado
 *  - https://mindicador.cl/api/uf/dd-mm-yyyy → valor en una fecha específica
 *
 * Cache simple en localStorage (1 hora para "hoy", 30 días para históricas).
 */

export type UfPreset = { label: string; value: number; date?: string };

const FALLBACK = {
  today: 39500,
  presets: [
    { label: 'Ene 2025', value: 38500 },
    { label: 'Ene 2024', value: 36800 },
    { label: 'Ene 2023', value: 35100 },
  ] as UfPreset[],
};

const CACHE_KEY = 'uf_rate_cache_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

type CacheShape = { ts: number; today: number; presets: UfPreset[] };

const readCache = (): CacheShape | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (data: Omit<CacheShape, 'ts'>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
  } catch {
    /* ignore */
  }
};

const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

const fetchUfAt = async (date?: Date): Promise<number | null> => {
  const url = date
    ? `https://mindicador.cl/api/uf/${fmt(date)}`
    : 'https://mindicador.cl/api/uf';
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const v = j?.serie?.[0]?.valor;
    return typeof v === 'number' && v > 0 ? Math.round(v) : null;
  } catch {
    return null;
  }
};

export function useUfRate() {
  const cached = readCache();
  const [today, setToday] = useState<number>(cached?.today ?? FALLBACK.today);
  const [presets, setPresets] = useState<UfPreset[]>(cached?.presets ?? FALLBACK.presets);
  const [loading, setLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) return; // ya tenemos datos frescos
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const now = new Date();
        const histDates = [
          { label: `Ene ${now.getFullYear()}`, date: new Date(now.getFullYear(), 0, 2) },
          { label: `Ene ${now.getFullYear() - 1}`, date: new Date(now.getFullYear() - 1, 0, 2) },
          { label: `Ene ${now.getFullYear() - 2}`, date: new Date(now.getFullYear() - 2, 0, 2) },
        ];
        const [todayVal, ...histVals] = await Promise.all([
          fetchUfAt(),
          ...histDates.map((h) => fetchUfAt(h.date)),
        ]);
        if (cancelled) return;
        const newToday = todayVal ?? FALLBACK.today;
        const newPresets: UfPreset[] = histDates.map((h, i) => ({
          label: h.label,
          value: histVals[i] ?? FALLBACK.presets[i]?.value ?? FALLBACK.today,
          date: fmt(h.date),
        }));
        setToday(newToday);
        setPresets(newPresets);
        writeCache({ today: newToday, presets: newPresets });
        if (!todayVal) setError('No se pudo obtener la UF actual; usando valor referencial.');
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error al consultar UF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { today, presets, loading, error };
}
