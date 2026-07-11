/**
 * Map a project lot to a marketplace listing ("card") input.
 *
 * Lots carry the masterplan geometry; publishing one to the marketplace means
 * creating a `listings` row derived from the lot and its project. This is the
 * pure mapping — the hook feeds the result to the quota-enforcing
 * `publish-listing` edge function and links the lot back to the created card.
 */

export type MarketplaceType =
  | 'parcela_rural'
  | 'sitio_industrial'
  | 'campo_agricola'
  | 'terreno_urbano'
  | 'terreno_costero'
  | 'terreno_montana'
  | 'inversion';

export interface LotForListing {
  lot_number?: string | null;
  name?: string | null;
  description?: string | null;
  area?: number | null;
  price?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[] | null;
}

export interface ProjectForListing {
  name?: string | null;
  location?: string | null;
  region?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rol_number?: string | null;
}

export interface LotListingInput {
  title: string;
  type: MarketplaceType;
  price: number;
  location: string;
  description?: string;
  currency: string;
  area_m2?: number;
  area_ha?: number;
  region?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  images?: string[];
  tags?: string[];
  zoning?: string;
  rol?: string;
  status?: string;
}

const num = (v: number | null | undefined): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : undefined;
};

/** Build the listing input for publishing a lot as a marketplace card. */
export function lotToListingInput(
  lot: LotForListing,
  project: ProjectForListing,
  opts: { type?: MarketplaceType } = {},
): LotListingInput {
  const lotLabel = lot.name || `Lote ${lot.lot_number ?? ''}`.trim();
  const projectName = project.name || 'Proyecto';
  const areaM2 = num(lot.area);
  const location = project.location || project.city || projectName;

  const description =
    lot.description ||
    `${lotLabel} en ${projectName}.` + (areaM2 ? ` Superficie ${Math.round(areaM2).toLocaleString('es-CL')} m².` : '');

  const tags = ['loteo', projectName].filter((t): t is string => !!t);

  return {
    title: `${projectName} — ${lotLabel}`.trim(),
    type: opts.type ?? 'parcela_rural',
    price: Math.max(0, Math.round(Number(lot.price) || 0)),
    location,
    description,
    currency: 'CLP',
    area_m2: areaM2,
    area_ha: areaM2 ? Number((areaM2 / 10000).toFixed(4)) : undefined,
    region: project.region ?? undefined,
    city: project.city ?? undefined,
    country: project.country ?? 'Chile',
    lat: num(lot.latitude) ?? num(project.latitude),
    lng: num(lot.longitude) ?? num(project.longitude),
    images: lot.images ?? [],
    tags,
    rol: project.rol_number ?? undefined,
    status: 'active',
  };
}
