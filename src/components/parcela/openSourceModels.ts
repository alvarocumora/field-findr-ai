import type { GLBAsset } from './AssetCatalog';

/**
 * Curated open-source (CC0) GLB models for the parcela designer.
 *
 * Source: Polygonal Mind's CC0 collections, catalogued in the community
 * registry github.com/ToxSam/open-source-3D-assets. All models are CC0 (public
 * domain, commercial use allowed, no attribution required — we credit anyway).
 *
 * Served through jsDelivr's CDN (mirror of the GitHub repo) which sends
 * `Access-Control-Allow-Origin: *`, so the browser GLTFLoader can fetch them
 * cross-origin. Loaded on demand (never bundled) via the existing GLB flow.
 */

export const OPEN_SOURCE_LICENSE = {
  label: 'CC0 · Polygonal Mind',
  url: 'https://github.com/ToxSam/open-source-3D-assets',
} as const;

const BASE = 'https://cdn.jsdelivr.net/gh/ToxSam/cc0-models-Polygonal-Mind@main/projects/MomusPark';

export interface CC0Model extends GLBAsset {
  name: string;
  /** Sub-group for the CC0 tab filter. */
  group: string;
}
type CuratedModel = CC0Model & { group: 'naturaleza' | 'mobiliario' | 'fauna' };

const model = (file: string, name: string, group: CuratedModel['group']): CuratedModel => ({
  name,
  url: `${BASE}/${file}.glb`,
  category: 'cc0',
  group,
  thumbnail: `${BASE}/${file}_thumbnail.png`,
});

/** Verified reachable (HTTP 200) via jsDelivr, all CC0. */
export const OPEN_SOURCE_MODELS: CuratedModel[] = [
  // Naturaleza
  model('Tree_01_Art', 'Árbol 1', 'naturaleza'),
  model('Tree_02_Art', 'Árbol 2', 'naturaleza'),
  model('Bush_02_Art', 'Arbusto', 'naturaleza'),
  model('Flower_02_a_Art', 'Flores', 'naturaleza'),
  model('Grass_01_a', 'Pasto', 'naturaleza'),
  model('Rock_02_Art', 'Roca 1', 'naturaleza'),
  model('Rock_04_Art', 'Roca 2', 'naturaleza'),
  model('Log_01_Art', 'Tronco', 'naturaleza'),
  model('Mushroom_01_Art', 'Hongos', 'naturaleza'),
  // Mobiliario / parque
  model('Bench_01_Art', 'Banca', 'mobiliario'),
  model('Fence_01_Art', 'Cerco', 'mobiliario'),
  // Fauna
  model('DeerArmature', 'Ciervo', 'fauna'),
  model('Owl', 'Búho', 'fauna'),
];
