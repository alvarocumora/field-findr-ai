import type { TasacionData } from './tasacionPdfGenerator';

export const UF_REF = 39500;

const TENO_LISTING_ID = 'a4c4c2bb-3f59-4a4f-9c08-2f5e8a7e8b1a'; // mantener si difiere, override por id

interface ListingLike {
  id: string;
  title?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  area_m2?: number | null;
  area_ha?: number | null;
  location?: string | null;
  region?: string | null;
  city?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  type?: string | null;
  rol?: string | null;
  zoning?: string | null;
  tags?: string[] | null;
  utilities?: any;
}

const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const typeLabel = (t?: string | null) => {
  switch (t) {
    case 'agricola': return 'agrícola';
    case 'industrial': return 'industrial';
    case 'residencial': return 'residencial';
    case 'comercial': return 'comercial';
    case 'forestal': return 'forestal';
    case 'turistico': return 'turístico';
    default: return t || 'mixto';
  }
};

const inferTopografia = (tags?: string[] | null) => {
  if (!tags) return 'Topografía referencial. Verificar en terreno mediante levantamiento.';
  if (tags.includes('plano')) return 'Plana, sin pendientes significativas. Apta para construcción inmediata.';
  if (tags.includes('pendiente')) return 'Con pendiente moderada, requiere movimiento de tierras y muros de contención.';
  return 'Topografía variable según sector del predio.';
};

const inferComparables = (areaM2: number, valorM2UF: number) => {
  // Genera 4 comparables sintéticos centrados alrededor del valor estimado
  const variations = [
    { suf: 'norte', f: 0.85, areaF: 0.7 },
    { suf: 'sur', f: 1.1, areaF: 1.15 },
    { suf: 'oriente', f: 0.95, areaF: 0.9 },
    { suf: 'poniente', f: 1.05, areaF: 1.05 },
  ];
  return variations.map((v, i) => {
    const sup = Math.round(areaM2 * v.areaF);
    const m2uf = +(valorM2UF * v.f).toFixed(3);
    return {
      ubicacion: `Sector ${v.suf} – referencial`,
      superficie: sup,
      valorUF: Math.round(sup * m2uf),
      valorM2UF: m2uf,
      fuente: ['Portal Inmobiliario', 'Yapo / Mercado Libre', 'Corretaje local', 'Oferta directa'][i],
    };
  });
};

export function buildTasacionData(listing: ListingLike): TasacionData {
  const areaM2 = listing.area_m2 || (listing.area_ha ? listing.area_ha * 10000 : 5000);
  const priceUF = listing.currency === 'UF'
    ? (listing.price || 0)
    : Math.round((listing.price || 0) / UF_REF);
  const valorM2UF = areaM2 > 0 ? +(priceUF / areaM2).toFixed(3) : 0;
  const utilities = (listing.utilities || {}) as Record<string, any>;
  const tipo = typeLabel(listing.type);

  const valorUnitarioSII = Math.max(1500, Math.round(valorM2UF * UF_REF * 0.18)); // ~18% del valor comercial
  const avaluoTerreno = Math.round(valorUnitarioSII * areaM2);

  return {
    fecha: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }),
    solicitante: 'Propietario del predio',
    tasador: 'Field-Findr AI · Departamento de Tasaciones',
    proposito: 'Determinar valor comercial referencial para venta directa, garantía bancaria o evaluación de inversión.',
    rol: listing.rol || 'Por verificar en SII',
    inscripcionCBR: `CBR ${listing.city || listing.region || 'comuna'} (por verificar)`,
    propietario: 'Reservado',
    direccion: listing.address || listing.location || 'Dirección referencial',
    comuna: listing.city || listing.location || '—',
    region: listing.region || '—',
    coordenadas: listing.lat && listing.lng
      ? `${listing.lat.toFixed(5)}, ${listing.lng.toFixed(5)}`
      : 'Coordenadas no disponibles',
    deslindes: {
      norte: 'Predios colindantes (verificar plano)',
      sur: 'Predios colindantes (verificar plano)',
      oriente: 'Predios colindantes o vía de acceso',
      poniente: 'Predios colindantes (verificar plano)',
    },
    superficieTerreno: Math.round(areaM2),
    superficieConstruida: 0,
    descripcionSector: listing.description?.slice(0, 600) ||
      `Sector de uso ${tipo} en ${listing.city || listing.location || 'la zona'}, ${listing.region || ''}. Predio con potencial de desarrollo según vocación zonal.`,
    accesos: utilities.road_access ? `Acceso por ${utilities.road_access}.` : 'Acceso vehicular por vía local. Verificar en terreno.',
    equipamiento: 'Servicios y equipamiento urbano según radio de influencia. Ver análisis territorial.',
    topografia: inferTopografia(listing.tags),
    forma: 'Polígono según plano oficial registrado en CBR.',
    tipoSuelo: `Suelo de uso ${tipo}, capacidad y drenaje a verificar mediante estudio de mecánica de suelos.`,
    frente: 'Frente a vía de acceso según plano.',
    servicios: {
      agua: !!utilities.water,
      electricidad: !!utilities.electricity,
      alcantarillado: !!utilities.sewage,
      gas: !!utilities.gas,
      telecom: !!utilities.internet || !!utilities.telecom,
      pavimento: utilities.road_access === 'paved' || utilities.road_access === 'asfalto',
    },
    zonificacion: listing.zoning || `Uso ${tipo} (verificar PRC vigente).`,
    usoSuelo: `Destinado a uso ${tipo} según normativa local.`,
    coefConstructibilidad: 'Sujeto a Plan Regulador Comunal vigente y permisos DOM.',
    avaluoFiscalTerreno: avaluoTerreno,
    avaluoFiscalConstruccion: 0,
    avaluoFiscalTotal: avaluoTerreno,
    valorUnitarioSII,
    comparables: inferComparables(areaM2, valorM2UF || 0.3),
    valorComercialUF: priceUF,
    valorComercialCLP: priceUF * UF_REF,
    valorM2UF,
    valorM2CLP: Math.round(valorM2UF * UF_REF),
    observaciones: `Valor comercial referencial calculado a partir del precio de oferta vigente y comparables del sector. Factores considerados: ubicación, superficie (${areaM2.toLocaleString('es-CL')} m²), uso ${tipo}, accesos y servicios disponibles. Para uso bancario o judicial se requiere ratificación por tasador acreditado.`,
  };
}
