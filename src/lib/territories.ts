import { LATAM_COUNTRIES } from '@/lib/latam';

export interface RegionTerritory {
  key: string;
  slug: string;
  name: string;
  displayName: string;
  country: string;
  countryCode: string;
  variants: string[];
}

const stripDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const territorySlug = (value: string) =>
  stripDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeRegionToken = (value: string) => {
  let token = stripDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ');

  token = token
    .replace(/^region metropolitana de santiago$/, 'metropolitana')
    .replace(/^metropolitana de santiago$/, 'metropolitana')
    .replace(/^region del libertador general bernardo ohiggins$/, 'ohiggins')
    .replace(/^libertador general bernardo ohiggins$/, 'ohiggins')
    .replace(/^region de la araucania$/, 'araucania')
    .replace(/^region de los rios$/, 'los rios')
    .replace(/^region de los lagos$/, 'los lagos')
    .replace(/^region de aysen.*$/, 'aysen')
    .replace(/^region de magallanes.*$/, 'magallanes')
    .replace(/^region (?:de |del |de la |de los |de las )?/, '');

  return token.trim();
};

const CHILE_DISPLAY: Record<string, string> = {
  'arica y parinacota': 'Región de Arica y Parinacota',
  tarapaca: 'Región de Tarapacá',
  antofagasta: 'Región de Antofagasta',
  atacama: 'Región de Atacama',
  coquimbo: 'Región de Coquimbo',
  valparaiso: 'Región de Valparaíso',
  metropolitana: 'Región Metropolitana',
  ohiggins: "Región de O'Higgins",
  maule: 'Región del Maule',
  nuble: 'Región de Ñuble',
  biobio: 'Región del Biobío',
  araucania: 'Región de La Araucanía',
  'los rios': 'Región de Los Ríos',
  'los lagos': 'Región de Los Lagos',
  aysen: 'Región de Aysén',
  magallanes: 'Región de Magallanes',
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

export const resolveRegionTerritory = (input: string, country = 'Chile'): RegionTerritory => {
  const countryConfig = countryFor(country);
  const inputToken = normalizeRegionToken(input);

  const matched = countryConfig.regions.find(
    (region) => normalizeRegionToken(region) === inputToken,
  );

  const name = matched || titleCase(inputToken || input.trim());
  const key = normalizeRegionToken(name);
  const displayName =
    countryConfig.code === 'CL'
      ? CHILE_DISPLAY[key] || name
      : name;

  return {
    key,
    slug: territorySlug(name),
    name,
    displayName,
    country: countryConfig.name,
    countryCode: countryConfig.code,
    variants: candidateVariants(name, displayName, input),
  };
};

export const sameRegion = (a?: string | null, b?: string | null, country = 'Chile') => {
  if (!a || !b) return false;
  return resolveRegionTerritory(a, country).key === resolveRegionTerritory(b, country).key;
};

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
