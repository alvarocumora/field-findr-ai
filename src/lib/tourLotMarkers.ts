export function tourLotState(status?: string | null) {
  if (['sold', 'vendido', 'vendida'].includes((status ?? '').toLowerCase())) return { label: 'Vendido', token: 'muted-foreground' };
  if (['reserved', 'reservado', 'reservada'].includes((status ?? '').toLowerCase())) return { label: 'Reservado', token: 'warning' };
  if (['available', 'disponible'].includes((status ?? '').toLowerCase())) return { label: 'Disponible', token: 'success' };
  return { label: 'Consultar', token: 'muted-foreground' };
}

/** Angular mean keeps labels on the polygon when it crosses the panorama seam. */
export function tourPolygonCenter(points: { yaw: number; pitch: number }[]) {
  if (!points.length) return null;
  return {
    yaw: Math.atan2(points.reduce((sum, p) => sum + Math.sin(p.yaw), 0), points.reduce((sum, p) => sum + Math.cos(p.yaw), 0)),
    pitch: points.reduce((sum, p) => sum + p.pitch, 0) / points.length,
  };
}

export function tourLotLabel(name: string, status?: string | null) {
  const state = tourLotState(status);
  const element = document.createElement('div');
  element.className = 'tour-lot-label';
  element.style.setProperty('--tour-lot-color', `hsl(var(--${state.token}))`);
  element.textContent = `${name} · ${state.label}`;
  return element.outerHTML;
}