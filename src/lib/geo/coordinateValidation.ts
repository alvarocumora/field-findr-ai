/**
 * Validación de georreferenciación previa a publicar una propiedad:
 * rango de coordenadas, coherencia con el país declarado y precisión mínima.
 */

export type GeoIssueLevel = 'error' | 'warning';

export interface GeoIssue {
  level: GeoIssueLevel;
  code: string;
  message: string;
}

/** Bounding boxes aproximados por país LATAM soportado (incluye territorio continental). */
export const COUNTRY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  CL: { minLat: -56.0, maxLat: -17.4, minLng: -76.0, maxLng: -66.3 },
  AR: { minLat: -55.2, maxLat: -21.7, minLng: -73.6, maxLng: -53.6 },
  PE: { minLat: -18.4, maxLat: -0.03, minLng: -81.4, maxLng: -68.6 },
  CO: { minLat: -4.3, maxLat: 13.5, minLng: -79.1, maxLng: -66.8 },
  MX: { minLat: 14.5, maxLat: 32.8, minLng: -118.5, maxLng: -86.6 },
};

export interface CoordinateInput {
  lat: number | null | undefined;
  lng: number | null | undefined;
  countryCode?: string;
}

/** Distancia en metros entre dos coordenadas (Haversine). */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Cantidad de decimales significativos de un número. */
function decimals(value: number): number {
  const s = String(value);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

/**
 * Valida un par de coordenadas. Devuelve errores (bloquean la publicación)
 * y advertencias (se pueden aceptar de forma consciente).
 */
export function validateCoordinates({ lat, lng, countryCode }: CoordinateInput): GeoIssue[] {
  const issues: GeoIssue[] = [];

  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    issues.push({
      level: 'error',
      code: 'missing',
      message: 'Marca la ubicación exacta en el mapa antes de publicar.',
    });
    return issues;
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    issues.push({ level: 'error', code: 'not_finite', message: 'Las coordenadas no son valores numéricos válidos.' });
    return issues;
  }

  if (lat < -90 || lat > 90) {
    issues.push({ level: 'error', code: 'lat_range', message: 'La latitud debe estar entre -90 y 90 grados.' });
  }
  if (lng < -180 || lng > 180) {
    issues.push({ level: 'error', code: 'lng_range', message: 'La longitud debe estar entre -180 y 180 grados.' });
  }

  if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) {
    issues.push({
      level: 'error',
      code: 'null_island',
      message: 'La ubicación apunta al punto 0,0 del océano Atlántico. Vuelve a marcarla en el mapa.',
    });
  }

  const bounds = countryCode ? COUNTRY_BOUNDS[countryCode] : undefined;
  if (bounds && issues.length === 0) {
    const inside = lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
    if (!inside) {
      const swapped =
        lng >= bounds.minLat && lng <= bounds.maxLat && lat >= bounds.minLng && lat <= bounds.maxLng;
      issues.push({
        level: 'error',
        code: swapped ? 'swapped' : 'outside_country',
        message: swapped
          ? 'Parece que la latitud y la longitud están invertidas. Revisa el punto en el mapa.'
          : 'El punto marcado queda fuera del país seleccionado. Corrige la ubicación o el país.',
      });
    }
  }

  if (issues.length === 0 && Math.min(decimals(lat), decimals(lng)) < 4) {
    issues.push({
      level: 'warning',
      code: 'low_precision',
      message: 'La coordenada tiene baja precisión (±100 m o más). Acerca el mapa y ajusta el punto.',
    });
  }

  return issues;
}

/** Normaliza un identificador catastral (ROL/CUIT/matrícula) para comparación. */
export function normalizeTaxId(value?: string | null): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const hasBlockingIssues = (issues: GeoIssue[]) => issues.some((i) => i.level === 'error');
