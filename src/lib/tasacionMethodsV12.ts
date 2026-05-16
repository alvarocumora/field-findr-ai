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
      { label: 'Renta UF/m²/mes', calc: 'Bodegaje agro referencial', result: m3RentaUF.toFixed(2) },
      { label: 'Sup. arrendable', calc: `5% del predio`, result: `${m3SupArr.toLocaleString('es-CL')} m²` },
      { label: 'Ingreso bruto anual', calc: `${m3SupArr} × ${m3RentaUF} × 12`, result: `UF ${round(m3Ingreso).toLocaleString('es-CL')}` },
      { label: `OPEX ${(m3OpexPct*100).toFixed(0)}%`, calc: 'Mantención + admin', result: `UF ${round(m3Ingreso*m3OpexPct).toLocaleString('es-CL')}` },
      { label: 'NOI estabilizado', calc: 'Ingreso − OPEX', result: `UF ${round(m3NOI).toLocaleString('es-CL')}` },
      { label: 'Cap rate', calc: 'Industrial Maule', result: `${(capRate*100).toFixed(1)}%` },
      { label: 'Valor capitalizado', calc: `${round(m3NOI)} / ${capRate.toFixed(2)}`, result: `UF ${m3.toLocaleString('es-CL')}` },
    ],
    source: 'Colliers International Chile · Cap Rate Survey Industrial 2025',
  };

  // Método 4 — Cost Approach
  const m4Suelo = areaM2 * costoSueloUFm2;
  const m4Habilit = 4500 + 2800 + 1825; // CGE + APR + accesos
  const m4 = round(m4Suelo + m4Habilit);
  const method4: MethodRow = {
    id: 4, weight: 0.15, resultUF: m4,
    name: 'Cost Approach (reposición)',
    formula: 'V = Sup × Pu_suelo + Habilitación + Accesos',
    inputs: [
      { label: 'Suelo agroindustrial', calc: `${areaM2.toLocaleString('es-CL')} × ${costoSueloUFm2.toFixed(2)} UF/m²`, result: `UF ${round(m4Suelo).toLocaleString('es-CL')}` },
      { label: 'Empalme CGE MT', calc: 'Trafo 100 kVA', result: 'UF 4.500' },
      { label: 'Agua APR', calc: 'Pozo + estanque', result: 'UF 2.800' },
      { label: 'Accesos', calc: 'Caleta + asfalto', result: 'UF 1.825' },
      { label: 'Total reposición', calc: 'suma', result: `UF ${m4.toLocaleString('es-CL')}` },
    ],
    source: 'CChC Índice de Costos 2025 · CGE tarifas BT/MT · MOP costos referenciales',
  };

  // Método 5 — Residual / H&BU
  const m5SupTechada = round(areaM2 * 0.11);
  const m5ValorProy = m5SupTechada * 21.3; // UF / m² techado desarrollado
  const m5Capex = m5SupTechada * 7.85;
  const m5Margen = m5ValorProy * 0.18;
  const m5Soft = m5ValorProy * 0.05;
  const m5Residual = Math.max(0, m5ValorProy - m5Capex - m5Margen - m5Soft);
  const m5 = round(m5Residual * optionalityFactor);
  const method5: MethodRow = {
    id: 5, weight: 0.20, resultUF: m5,
    name: 'Residual Method (desarrollo H&BU)',
    formula: 'V_suelo = (V_proy − CAPEX − Soft − Margen) × Opcionalidad',
    inputs: [
      { label: 'Sup. techada potencial', calc: '11% ocupación', result: `${m5SupTechada.toLocaleString('es-CL')} m²` },
      { label: 'Valor proyecto estabilizado', calc: `${m5SupTechada} × 21,3 UF/m²`, result: `UF ${round(m5ValorProy).toLocaleString('es-CL')}` },
      { label: 'CAPEX construcción', calc: `${m5SupTechada} × 7,85 UF/m²`, result: `UF ${round(m5Capex).toLocaleString('es-CL')}` },
      { label: 'Margen desarrollador', calc: '18%', result: `UF ${round(m5Margen).toLocaleString('es-CL')}` },
      { label: 'Costos soft', calc: '5% (permisos + gestión)', result: `UF ${round(m5Soft).toLocaleString('es-CL')}` },
      { label: 'Residual base', calc: 'V_proy − CAPEX − Margen − Soft', result: `UF ${round(m5Residual).toLoc