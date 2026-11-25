/**
 * DL 3.516: subdivisión rural con superficie mínima legal de 5.000 m².
 * El polígono dibujado es la superficie útil (neta); la diferencia hasta
 * 5.000 m² corresponde a la servidumbre de tránsito incluida en el lote.
 */
export const DL3516_MIN_AREA_M2 = 5000;

export interface LotSurfaceBreakdown {
  officialM2: number;
  usefulM2: number;
  easementM2: number;
}

export const getLotSurface = (area: number | null | undefined): LotSurfaceBreakdown | null => {
  if (typeof area !== 'number' || !Number.isFinite(area) || area <= 0) return null;
  const useful = Math.round(area);
  const official = Math.max(useful, DL3516_MIN_AREA_M2);
  return { officialM2: official, usefulM2: useful, easementM2: official - useful };
};

export const officialLotArea = (area: number | null | undefined): number =>
  getLotSurface(area)?.officialM2 ?? 0;

export const formatM2 = (n: number) => `${n.toLocaleString('es-CL')} m²`;
