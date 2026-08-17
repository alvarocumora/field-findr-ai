/**
 * Portada automática para listings sin fotos: mapa satelital estático de Mapbox
 * centrado en las coordenadas del terreno. Evita tarjetas rotas en el marketplace.
 */
export interface StaticMapOptions {
  lat: number;
  lng: number;
  token: string;
  zoom?: number;
  width?: number;
  height?: number;
  marker?: boolean;
}

export function staticMapUrl({
  lat,
  lng,
  token,
  zoom = 14,
  width = 640,
  height = 360,
  marker = true,
}: StaticMapOptions): string | null {
  if (!token || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const overlay = marker ? `pin-s+22c55e(${lng},${lat})/` : '';
  return (
    `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
    `${overlay}${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${token}&attribution=false&logo=false`
  );
}

/** Devuelve la primera imagen válida del listing o la portada del mapa. */
export function listingCoverUrl(
  images: (string | null)[] | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined,
  token: string | null,
): string | null {
  // '/placeholder.svg' se guardó en la BD para inventario importado: no es foto real.
  const first = Array.isArray(images)
    ? images.find((i) => !!i && !i.includes('placeholder.svg'))
    : null;
  if (first) return first;
  if (token && lat != null && lng != null) {
    return staticMapUrl({ lat: Number(lat), lng: Number(lng), token });
  }
  return null;
}
