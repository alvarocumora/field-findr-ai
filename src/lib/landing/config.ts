/**
 * Configuración de la landing genérica de proyecto (/p/:slug).
 *
 * `projects.landing_config` es un jsonb libre editado por gerencia; este
 * módulo lo normaliza con tolerancia total: cualquier campo ausente o con
 * tipo inesperado cae a un default derivado del propio proyecto, de modo que
 * una config vacía ({}) ya produce una landing completa.
 */

export interface LandingAmenity {
  title: string;
  text?: string;
}

export interface LandingConfig {
  hero: {
    title?: string;
    subtitle?: string;
    image?: string;
    cta?: string;
  };
  gallery: string[];
  amenities: LandingAmenity[];
  highlights: string[];
  contact: {
    whatsapp?: string;
    phone?: string;
    email?: string;
  };
  sections: {
    masterplan: boolean;
    gallery: boolean;
    amenities: boolean;
    contact: boolean;
  };
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v : undefined;

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

function amenities(v: unknown): LandingAmenity[] {
  if (!Array.isArray(v)) return [];
  const out: LandingAmenity[] = [];
  for (const item of v) {
    if (typeof item === 'string' && item.trim() !== '') {
      out.push({ title: item });
    } else if (item && typeof item === 'object') {
      const title = str((item as Record<string, unknown>).title);
      if (title) out.push({ title, text: str((item as Record<string, unknown>).text) });
    }
  }
  return out;
}

export function parseLandingConfig(raw: unknown): LandingConfig {
  const cfg = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const hero = (cfg.hero && typeof cfg.hero === 'object' ? cfg.hero : {}) as Record<string, unknown>;
  const contact = (cfg.contact && typeof cfg.contact === 'object' ? cfg.contact : {}) as Record<string, unknown>;
  const sections = (cfg.sections && typeof cfg.sections === 'object' ? cfg.sections : {}) as Record<string, unknown>;
  const on = (v: unknown) => v !== false; // solo un false explícito apaga la sección
  return {
    hero: {
      title: str(hero.title),
      subtitle: str(hero.subtitle),
      image: str(hero.image),
      cta: str(hero.cta),
    },
    gallery: strArray(cfg.gallery),
    amenities: amenities(cfg.amenities),
    highlights: strArray(cfg.highlights),
    contact: {
      whatsapp: str(contact.whatsapp),
      phone: str(contact.phone),
      email: str(contact.email),
    },
    sections: {
      masterplan: on(sections.masterplan),
      gallery: on(sections.gallery),
      amenities: on(sections.amenities),
      contact: on(sections.contact),
    },
  };
}

/** Resumen comercial calculado desde los lotes públicos del proyecto. */
export interface LotsSummary {
  total: number;
  available: number;
  areaMin: number | null;
  areaMax: number | null;
  priceFrom: number | null;
}

export function summarizeLots(
  lots: Array<{ status?: string | null; area?: number | null; price?: number | null }>,
): LotsSummary {
  let available = 0;
  let areaMin: number | null = null;
  let areaMax: number | null = null;
  let priceFrom: number | null = null;
  for (const lot of lots) {
    if (lot.status === 'available') {
      available++;
      const price = Number(lot.price);
      if (Number.isFinite(price) && price > 0 && (priceFrom === null || price < priceFrom)) priceFrom = price;
    }
    const area = Number(lot.area);
    if (area > 0) {
      if (areaMin === null || area < areaMin) areaMin = area;
      if (areaMax === null || area > areaMax) areaMax = area;
    }
  }
  return { total: lots.length, available, areaMin, areaMax, priceFrom };
}
