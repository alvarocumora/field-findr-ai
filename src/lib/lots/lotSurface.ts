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

/**
 * Normaliza filas de lotes públicos: `area` pasa a la superficie oficial
 * (mín. 5.000 m²) y `useful_area` conserva la superficie útil del polígono.
 * No altera la base de datos ni la geometría.
 */
export const withOfficialArea = <T extends { area?: number | string | null }>(row: T): T & { useful_area: number | null } => {
  const raw = row.area == null ? null : Number(row.area);
  const s = getLotSurface(raw);
  return { ...row, area: s ? s.officialM2 : row.area, useful_area: s ? s.usefulM2 : null } as T & { useful_area: number | null };
};

/** Publicaciones de lotes de proyecto: superficie oficial mín. 5.000 m². */
export const withOfficialListingArea = <T extends { area_m2?: number | null; area_ha?: number | null; project_id?: string | null }>(l: T): T => {
  if (!l || !l.project_id || !l.area_m2) return l;
  const official = officialLotArea(l.area_m2);
  if (official === l.area_m2) return l;
  return { ...l, area_m2: official, area_ha: Math.round((official / 10000) * 100) / 100 };
};
