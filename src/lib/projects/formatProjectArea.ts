/** projects.total_area is stored in square metres, as entered by the project form. */
export function formatProjectArea(areaM2: number | null | undefined): string {
  if (typeof areaM2 !== 'number' || !Number.isFinite(areaM2) || areaM2 <= 0) return 'No informado';
  return areaM2 >= 10_000
    ? `${(areaM2 / 10_000).toLocaleString('es-CL', { maximumFractionDigits: 4 })} ha`
    : `${areaM2.toLocaleString('es-CL', { maximumFractionDigits: 2 })} m²`;
}
