export interface FasePr { nombre: string; startMonth: number; durationMonths: number; }
export interface CapexItem { partida: string; montoUF: number; }

export const FASES: FasePr[] = [
  { nombre: 'Urbanización primaria (caminos + electrificación)', startMonth: 1, durationMonths: 5 },
  { nombre: 'Habilitación de aguas (pozo + derechos)',            startMonth: 3, durationMonths: 4 },
  { nombre: 'Subdivisión y escrituración',                        startMonth: 5, durationMonths: 4 },
  { nombre: 'Comercialización',                                   startMonth: 6, durationMonths: 7 },
];

export const CAPEX: CapexItem[] = [
  { partida: 'Caminos interiores y obras viales',         montoUF: 8500 },
  { partida: 'Electrificación trifásica (CGE)',           montoUF: 6200 },
  { partida: 'Pozo profundo y derechos de agua DGA',      montoUF: 3800 },
  { partida: 'Topografía, planos y subdivisión SAG/MINVU', montoUF: 2400 },
  { partida: 'Escrituración y gastos notariales',         montoUF: 1800 },
  { partida: 'Comercialización y marketing',              montoUF: 4500 },
  { partida: 'Contingencia (8 %)',                        montoUF: 2300 },
];

export const CAPEX_TOTAL = CAPEX.reduce((s, x) => s + x.montoUF, 0);
