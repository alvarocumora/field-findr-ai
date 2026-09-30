export type SatelliteBbox = [number, number, number, number];

export interface SentinelScene {
  item_id: string;
  datetime: string;
  cloud_cover: number | null;
  bbox: number[] | null;
  tilejson_url: string;
  preview_url: string | null;
}

export interface SentinelImageryResult {
  provider: string;
  collection: string;
  available: boolean;
  bbox: SatelliteBbox;
  acquisition_datetime: string | null;
  cloud_cover: number | null;
  scenes: SentinelScene[];
  searched_from: string;
  searched_to: string;
}

export interface SatelliteLotLike {
  polygon?: unknown;
  latitude?: number | null;
  longitude?: number | null;
}

const coordinatePairs = (polygon: unknown): Array<[number, number]> => {
  if (Array.isArray(polygon)) {
    return polygon
      .filter((point): point is [number, number] =>
        Array.isArray(point)
        && point.length >= 2
        && Number.isFinite(Number(point[0]))
        && Number.isFinite(Number(point[1])),
      )
      .map((point) => [Number(point[0]), Number(point[1])]);
  }

  if (polygon && typeof polygon === "object") {
    const geometry = polygon as { coordinates?: unknown };
    const coordinates = geometry.coordinates;
    if (Array.isArray(coordinates) && Array.isArray(coordinates[0])) {
      const ring = Array.isArray(coordinates[0][0]) ? coordinates[0] : coordinates;
      return coordinatePairs(ring);
    }
  }

  return [];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const satelliteBoundsFromLots = (
  lots: readonly SatelliteLotLike[],
  center?: { lat: number; lng: number } | null,
): SatelliteBbox | null => {
  const coordinates: Array<[number, number]> = [];

  lots.forEach((lot) => {
    coordinates.push(...coordinatePairs(lot.polygon));
    if (
      lot.longitude !== null
      && lot.longitude !== undefined
      && lot.latitude !== null
      && lot.latitude !== undefined
      && Number.isFinite(Number(lot.longitude))
      && Number.isFinite(Number(lot.latitude))
    ) {
      coordinates.push([Number(lot.longitude), Number(lot.latitude)]);
    }
  });

  if (coordinates.length === 0 && center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
    const pad = 0.015;
    return [
      clamp(center.lng - pad, -180, 180),
      clamp(center.lat - pad, -85, 85),
      clamp(center.lng + pad, -180, 180),
      clamp(center.lat + pad, -85, 85),
    ];
  }

  if (coordinates.length === 0) return null;

  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lngSpan = Math.max(maxLng - minLng, 0.002);
  const latSpan = Math.max(maxLat - minLat, 0.002);
  const lngPad = Math.max(lngSpan * 0.18, 0.0015);
  const latPad = Math.max(latSpan * 0.18, 0.0015);

  return [
    clamp(minLng - lngPad, -180, 180),
    clamp(minLat - latPad, -85, 85),
    clamp(maxLng + lngPad, -180, 180),
    clamp(maxLat + latPad, -85, 85),
  ];
};

export const formatSentinelDate = (value?: string | null): string => {
  if (!value) return "fecha desconocida";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "fecha desconocida";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const sentinelCloudLabel = (value?: number | null): string =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.round(value) + "% nube"
    : "nubosidad s/d";
