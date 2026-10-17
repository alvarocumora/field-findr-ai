export function tourLotState(status?: string | null) {
  const s = (status ?? '').toLowerCase();
  if (['sold', 'vendido', 'vendida'].includes(s)) return { key: 'sold', label: 'Vendido', token: 'destructive' };
  if (['reserved', 'reservado', 'reservada'].includes(s)) return { key: 'reserved', label: 'Reservado', token: 'warning' };
  if (['available', 'disponible'].includes(s)) return { key: 'available', label: 'Disponible', token: 'success' };
  return { key: 'unknown', label: 'Consultar', token: 'muted-foreground' };
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
  element.className = `tour-lot-label tour-lot-label--${state.key}`;
  element.title = `${name} · ${state.label}`;
  element.setAttribute('aria-label', `${name} · ${state.label}`);
  element.textContent = name.match(/\d+[A-Za-z]?$/)?.[0] ?? name;
  return element.outerHTML;
}
