/**
 * Cálculo de los 5 métodos IVS 2022 para tasación comercial.
 * Determinístico a partir de los datos del predio.
 * Sigue docs/GUIA_TASACION_PROFESIONAL.md §4.
 */

export interface MethodInput {
  areaM2: number;
  tipo?: string;
  frenteM?: number;
  region?: string | null;
  city?: string | null;
  compAUFm2?: number;       // UF/m² premium comparable (default 0.95)
  compBUFm2?: number;       // UF/m² secondary comparable (default 1.477)
  capRate?: number;         // cap rate income (default 0.08)
  costoSueloUFm2?: number;  // cost approach unit land (default 1.10)
  optionalityFactor?: number; // residual opcionalidad (default 1.46)
  /** Asking price observado en UF (NO se publica, solo se usa como cota interna). */
  observedUF?: number;
}

export interface MethodRow {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  formula: string;
  weight: number;
  resultUF: number;
  inputs: Array<{ label: string; calc: string; result: string }>;
  source: string;
}

export interface MethodsResult {
  methods: MethodRow[];
  fmvUF: number;
  fmvRangeMinUF: number;
  fmvRangeMaxUF: number;
  ufPerM2: number;
  dispersion: { min: number; max: number; coefVarPct: number };
}

const round = (n: number) => Math.round(n);

export function computeMethods(input: MethodInput): MethodsResult {
  const {
    areaM2,
    compAUFm2 = 0.95,
    compBUFm2 = 1.477,
    capRate = 0.08,
    costoSueloUFm2 = 1.10,
    optionalityFactor = 1.46,
  } = input;

  // Método 1 — Sales Comparison A
  const m1Raw = areaM2 * compAUFm2 * 1.0;
  const m1 = round(m1Raw * 0.982);
  const method1: MethodRow = {
    id: 1, weight: 0.25, resultUF: m1,
    name: 'Sales Comparison A (premium · E&V Commercial)',
    formula: 'V = Sup × (UF/m²)_comp × Factor_ajuste',
    inputs: [
      { label: 'Comparable premium', calc: 'Ruta 5 Sur · listing E&V activo', result: `${compAUFm2.toFixed(3)} UF/m²` },
      { label: 'Factor ajuste', calc: 'Mismo eje vial', result: '1,000' },
      { label: 'Valor predio', calc: `${areaM2.toLocaleString('es-CL')} × ${compAUFm2.toFixed(3)}`, result: `~UF ${round(m1Raw).toLocaleString('es-CL')}` },
      { label: 'Valor redondeado', calc: 'margen de seguridad', result: `UF ${m1.toLocaleString('es-CL')}` },
    ],
    source: 'Engel & Völkers Commercial Chile · www.engelvoelkers.com/cl · listing activo',
  };

  // Método 2 — Sales Comparison B
  const m2Raw = areaM2 * compBUFm2 * 0.985;
  const m2 = round(m2Raw);
  const method2: MethodRow = {
    id: 2, weight: 0.20, resultUF: m2,
    name: 'Sales Comparison B (secundario · Vivax)',
    formula: 'V = Sup × (UF/m²)_comp × Factor_ajuste',
    inputs: [
      { label: 'Comparable secundario', calc: 'Curicó / Pío XI · Vivax', result: `${compBUFm2.toFixed(3)} UF/m²` },
      { label: 'Factor ajuste (−1,5%)', calc: 'Menor urbanización', result: '0,985' },
      { label: 'Valor predio', calc: `${areaM2.toLocaleString('es-CL')} × ${compBUFm2.toFixed(3)} × 0,985`, result: `UF ${m2.toLocaleString('es-CL')}` },
    ],
    source: 'Vivax Corredores · www.vivax.cl · listing activo',
  };

  // Método 3 — Income Capitalisation
  const m3SupArr = Math.max(2000, round(areaM2 * 0.05)); // 5% techado utilizable
  const m3RentaUF = 0.12; // UF/m²/mes referencial bodegaje agro
  const m3Ingreso = m3SupArr * m3RentaUF * 12;
  const m3OpexPct = 0.25;
  const m3NOI = m3Ingreso * (1 - m3OpexPct);
  const m3 = round(m3NOI / capRate);
  const method3: MethodRow = {
    id: 3, weight: 0.20, resultUF: m3,
    name: 'Income Capitalisation (renta capitalizada)',
    formula: 'V = NOI_estabilizado / Cap_rate',
    inputs: [
      { label: 