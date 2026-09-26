import {
  getAllComunas,
  getRegiones,
  type ComunaSearchResult,
  type Region as ChileRegion,
} from 'chilean-territorial-divisions';
import { LATAM_COUNTRIES } from '@/lib/latam';

export interface RegionTerritory {
  key: string;
  slug: string;
  /** Short canonical name kept for backwards compatibility in project.region. */
  name: string;
  /** Official/public-facing region name. */
  displayName: string;
  country: string;
  countryCode: string;
  variants: string[];
  regionIso?: string;
  regionNumber?: string;
}

export interface ChileCommuneTerritory {
  commune: string;
  communeCode: string;
  province: string;
  region: RegionTerritory;
}

const stripDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeText = (value: string) =>
  stripDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ');

export const territorySlug = (value: string) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeRegionToken = (value: string) => {
  let token = normalizeText(value);

  token = token
    .replace(/^region metropolitana de santiago$/, 'metropolitana')
    .replace(/^metropolitana de santiago$/, 'metropolitana')
    .replace(/^region del libertador general bernardo ohiggins$/, 'ohiggins')
    .replace(/^region del libertador gral bernardo ohiggins$/, 'ohiggins')
    .replace(/^libertador general bernardo ohiggins$/, 'ohiggins')
    .replace(/^region de la araucania$/, 'araucania')
    .replace(/^region de los rios$/, 'los rios')
    .replace(/^region de los lagos$/, 'los lagos')
    .replace(/^region de aysen.*$/, 'aysen')
    .replace(/^region de magallanes.*$/, 'magallanes')
    .replace(/^region (?:de |del |de la |de los |de las )?/, '');

  return token.trim();
};

const CHILE_SHORT_BY_KEY: Record<string, string> = {
  'arica y parinacota': 'Arica y Parinacota',
  tarapaca: 'Tarapacá',
  antofagasta: 'Antofagasta',
  atacama: 'Atacama',
  coquimbo: 'Coquimbo',
  valparaiso: 'Valparaíso',
  metropolitana: 'Metropolitana',
  ohiggins: "O'Higgins",
  maule: 'Maule',
  nuble: 'Ñuble',
  biobio: 'Biobío',
  araucania: 'Araucanía',
  'los rios': 'Los Ríos',
  'los lagos': 'Los Lagos',
  aysen: 'Aysén',
  magallanes: 'Magallanes',
};

const titleCase = (value: string) =>
  value.replace(/\b\w/g, (char) => char.toUpperCase());

const countryFor = (country?: string) => {
  const normalized = (country || 'Chile').trim().toLowerCase();
  return LATAM_COUNTRIES.find(
    (candidate) =>
      candidate.name.toLowerCase() === normalized ||
      candidate.code.toLowerCase() === normalized,
  ) ?? LATAM_COUNTRIES[0];
};

const chileRegions = getRegiones();
const chileCommunes = getAllComunas();

const findChileRegion = (input: string): ChileRegion | undefined => {
  const token = normalizeRegionToken(input);
  return chileRegions.find((region) => normalizeRegionToken(region.region) === token);
};

const candidateVariants = (name: string, displayName: string, input?: string) => {
  const raw = new Set<string>([
    name,
    displayName,
    displayName.replace(/^Región /, 'Region '),
    input?.trim() || '',
  ].filter(Boolean));

  if (name === 'Maule') {
    raw.add('Región de Maule');
    raw.add('Region de Maule');
    raw.add('Region del Maule');
  }
  if (name === 'Metropolitana') {
    raw.add('Región Metropolitana de Santiago');
    raw.add('Region Metropolitana de Santiago');
    raw.add('Metropolitana de Santiago');
  }

  return [...raw];
};

const chileRegionToTerritory = (region: ChileRegion, input?: string): RegionTerritory => {
  const key = normalizeRegionToken(region.region);
  const name = CHILE_SHORT_BY_KEY[key] || titleCase(key);
  return {
    key,
    slug: territorySlug(name),
    name,
    displayName: region.region,
    country: 'Chile',
    countryCode: 'CL',
    variants: candidateVariants(name, region.region, input),
    regionIso: region.region_iso_3166_2,
    regionNumber: region.region_number,
  };
};

export const resolveRegionTerritory = (input: string, country = 'Chile'): RegionTerritory => {
  const countryConfig = countryFor(country);
  const inputToken = normalizeRegionToken(input);

  if (countryConfig.code === 'CL') {
    const official = findChileRegion(input);
    if (official) return chileRegionToTerritory(official, input);
  }

  const matched = countryConfig.regions.find(
    (region) => normalizeRegionToken(region) === inputToken,
  );
  const name = matched || titleCase(inputToken || input.trim());
  const key = normalizeRegionToken(name);

  return {
    key,
    slug: territorySlug(name),
    name,
    displayName: name,
    country: countryConfig.name,
    countryCode: countryConfig.code,
    variants: candidateVariants(name, name, input),
  };
};

export const sameRegion = (a?: string | null, b?: string | null, country = 'Chile') => {
  if (!a || !b) return false;
  return resolveRegionTerritory(a, country).key === resolveRegionTerritory(b, country).key;
};

const communeMatchesRegion = (result: ComunaSearchResult, regionHint?: string | null) => {
  if (!regionHint) return true;
  return sameRegion(result.region, regionHint, 'Chile');
};

export const resolveChileCommune = (
  input?: string | null,
  regionHint?: string | null,
): ChileCommuneTerritory | null => {
  if (!input?.trim()) return null;
  const target = normalizeText(input);

  const exact = chileCommunes.find((result) =>
    normalizeText(result.comuna.name) === target && communeMatchesRegion(result, regionHint),
  );

  const fallback = exact ?? chileCommunes.find((result) =>
    normalizeText(result.comuna.name).includes(target) && communeMatchesRegion(result, regionHint),
  );

  if (!fallback) return null;

  return {
    commune: fallback.comuna.name,
    communeCode: fallback.comuna.code,
    province: fallback.provincia,
    region: resolveRegionTerritory(fallback.region, 'Chile'),
  };
};

export const getChileCommunesByRegion = (regionInput: string): ChileCommuneTerritory[] => {
  const region = resolveRegionTerritory(regionInput, 'Chile');
  return chileCommunes
    .filter((result) => resolveRegionTerritory(result.region, 'Chile').key === region.key)
    .map((result) => ({
      commune: result.comuna.name,
      communeCode: result.comuna.code,
      province: result.provincia,
      region,
    }))
    .sort((a, b) => a.commune.localeCompare(b.commune, 'es'));
};

export const getChileRegionOptions = () =>
  chileRegions.map((region) => {
    const territory = chileRegionToTerritory(region);
    return {
      value: territory.name,
      label: territory.displayName,
      iso: territory.regionIso || '',
      number: territory.regionNumber || '',
    };
  });

export const getChileCommuneOptions = (regionInput: string) =>
  getChileCommunesByRegion(regionInput).map((commune) => ({
    value: commune.commune,
    label: commune.commune,
    code: commune.communeCode,
    province: commune.province,
  }));

export const groupByCanonicalRegion = <
  T extends { region?: string | null; country?: string | null }
>(items: T[]) => {
  const grouped = new Map<string, { territory: RegionTerritory; items: T[] }>();

  items.forEach((item) => {
    const raw = item.region?.trim();
    if (!raw) return;
    const territory = resolveRegionTerritory(raw, item.country || 'Chile');
    const groupKey = `${territory.countryCode}:${territory.key}`;
    const current = grouped.get(groupKey) ?? { territory, items: [] };
    current.items.push(item);
    grouped.set(groupKey, current);
  });

  return [...grouped.values()];
};
