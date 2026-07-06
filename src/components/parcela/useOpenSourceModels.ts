import { useQuery } from '@tanstack/react-query';
import { OPEN_SOURCE_MODELS, type CC0Model } from './openSourceModels';

/**
 * Loads the CC0 model library dynamically from the community registry
 * github.com/ToxSam/open-source-3D-assets (served via jsDelivr's CORS CDN),
 * instead of the small hardcoded list. Only outdoor/site-relevant collections
 * are fetched, and irrelevant categories (avatars, wearables, food) are
 * filtered out. Falls back to the verified static list if the fetch fails, so
 * the catalog always works offline.
 */

const REGISTRY = 'https://cdn.jsdelivr.net/gh/toxsam/open-source-3D-assets@main/data/assets';

// Collections that make sense on a rural/urban parcel (nature, park furniture,
// structures, vehicles, props). Avatar/sci-fi/holiday sets are skipped.
const RELEVANT_COLLECTIONS = ['pm-momuspark', 'pm-transit', 'pm-medieval-fair', 'pm-towers'];

// Category attribute → Spanish filter group. Unlisted categories are dropped.
const GROUP_MAP: Record<string, string> = {
  Nature: 'naturaleza',
  Terrain: 'naturaleza',
  'Park Furniture': 'mobiliario',
  Furniture: 'mobiliario',
  Lighting: 'mobiliario',
  Container: 'mobiliario',
  Architecture: 'estructura',
  Structure: 'estructura',
  Infrastructure: 'estructura',
  Vehicle: 'vehiculo',
  Wildlife: 'fauna',
  Decoration: 'decoracion',
  Signage: 'decoracion',
  Special: 'decoracion',
};

// Serve GitHub raw model/thumbnail URLs through jsDelivr (adds CORS headers).
export const toCdn = (url: string): string =>
  url.replace(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\//,
    'https://cdn.jsdelivr.net/gh/$1/$2@$3/',
  );

export const prettyName = (raw: string): string =>
  raw
    .replace(/\.(glb|gltf)$/i, '')
    .replace(/_?(Art|Armature)$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

interface RegistryAsset {
  name: string;
  model_file_url?: string;
  thumbnail_url?: string;
  format?: string;
  metadata?: { attributes?: { trait_type: string; value: string }[] };
}

export const normalize = (assets: RegistryAsset[]): CC0Model[] => {
  const out: CC0Model[] = [];
  for (const a of assets) {
    if (!a.model_file_url || (a.format && a.format.toUpperCase() !== 'GLB')) continue;
    const attrs = a.metadata?.attributes ?? [];
    const category = attrs.find((t) => t.trait_type === 'Category')?.value ?? '';
    const group = GROUP_MAP[category];
    if (!group) continue; // drop avatars, wearables, food, etc.
    out.push({
      name: prettyName(a.name),
      url: toCdn(a.model_file_url),
      thumbnail: a.thumbnail_url ? toCdn(a.thumbnail_url) : undefined,
      category: 'cc0',
      group,
    });
  }
  return out;
};

export const useOpenSourceModels = (enabled: boolean) =>
  useQuery({
    queryKey: ['cc0-models', RELEVANT_COLLECTIONS],
    enabled,
    staleTime: 1000 * 60 * 60, // registry rarely changes
    queryFn: async (): Promise<CC0Model[]> => {
      const lists = await Promise.all(
        RELEVANT_COLLECTIONS.map(async (id) => {
          try {
            const res = await fetch(`${REGISTRY}/${id}.json`);
            if (!res.ok) return [];
            const json = await res.json();
            const items: RegistryAsset[] = Array.isArray(json)
              ? json
              : (Object.values(json).find(Array.isArray) as RegistryAsset[]) ?? [];
            return normalize(items);
          } catch {
            return [];
          }
        }),
      );
      const merged = lists.flat();
      // Dedupe by url; fall back to the verified static list if nothing loaded.
      const seen = new Set<string>();
      const unique = merged.filter((m) => (seen.has(m.url) ? false : seen.add(m.url)));
      return unique.length > 0 ? unique : OPEN_SOURCE_MODELS;
    },
    placeholderData: OPEN_SOURCE_MODELS,
  });
