/**
 * Pure calculators for the buyer-facing tools (financing + investment).
 * No side effects — safe to unit test and reuse anywhere.
 */

export interface FinancingInput {
  price: number;        // total lot price (CLP)
  downPct: number;      // pie, 0–100
  months: number;       // plazo en cuotas
  annualRatePct: number; // tasa anual nominal, %
}

export interface FinancingResult {
  downPayment: number;   // pie en CLP
  principal: number;     // monto financiado
  monthlyPayment: number; // cuota mensual
  totalInterest: number;
  totalPaid: number;     // pie + cuotas
}

/** Standard fixed-rate amortization (French system). */
export function computeFinancing(input: FinancingInput): FinancingResult {
  const price = Math.max(0, input.price || 0);
  const downPct = Math.min(100, Math.max(0, input.downPct || 0));
  const months = Math.max(1, Math.round(input.months || 1));
  const downPayment = Math.round((price * downPct) / 100);
  const principal = Math.max(0, price - downPayment);

  const r = (input.annualRatePct || 0) / 100 / 12;
  let monthlyPayment: number;
  if (r <= 0) {
    monthlyPayment = principal / months;
  } else {
    monthlyPayment = (principal * r) / (1 - Math.pow(1 + r, -months));
  }
  monthlyPayment = Math.round(monthlyPayment);

  const totalPaid = downPayment + monthlyPayment * months;
  const totalInterest = Math.max(0, totalPaid - price);
  return { downPayment, principal, monthlyPayment, totalInterest, totalPaid };
}

export interface InvestmentInput {
  price: number;              // precio de compra (CLP)
  appreciationPct: number;    // plusvalía anual estimada, %
  years: number;              // horizonte
  monthlyRent?: number;       // arriendo mensual estimado (CLP), opcional
  areaM2?: number;            // superficie, para potencial de subdivisión
  minLotM2?: number;          // área mínima por lote para subdividir
}

export interface InvestmentResult {
  projectedValue: number;     // valor proyectado a `years`
  capitalGain: number;        // plusvalía acumulada
  totalRoiPct: number;        // ROI total (%)
  annualRoiPct: number;       // ROI anualizado (%)
  annualRentalYieldPct: number | null; // rentabilidad por arriendo anual (%)
  subdivisionLots: number | null;      // lotes potenciales
}

export function computeInvestment(input: InvestmentInput): InvestmentResult {
  const price = Math.max(0, input.price || 0);
  const years = Math.max(1, Math.round(input.years || 1));
  const appr = (input.appreciationPct || 0) / 100;

  const projectedValue = Math.round(price * Math.pow(1 + appr, years));
  const capitalGain = projectedValue - price;
  const totalRoiPct = price > 0 ? (capitalGain / price) * 100 : 0;
  const annualRoiPct = price > 0 ? (Math.pow(projectedValue / price, 1 / years) - 1) * 100 : 0;

  const annualRentalYieldPct =
    input.monthlyRent && price > 0 ? ((input.monthlyRent * 12) / price) * 100 : null;

  let subdivisionLots: number | null = null;
  if (input.areaM2 && input.minLotM2 && input.minLotM2 > 0) {
    // ~70% usable after roads/green areas (matches subdivision engine defaults).
    subdivisionLots = Math.max(0, Math.floor((input.areaM2 * 0.7) / input.minLotM2));
  }

  return {
    projectedValue,
    capitalGain,
    totalRoiPct,
    annualRoiPct,
    annualRentalYieldPct,
    subdivisionLots,
  };
}
