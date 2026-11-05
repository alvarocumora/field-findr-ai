/** Present a project's exact CLP terms without making a financial claim from a % fallback. */
export interface FixedCommissionRule {
  scope: string;
  project_id: string | null;
  is_active: boolean;
  fixed_sale_amount?: number | null;
  referral_fixed_amount?: number | null;
}

/** Amounts are read from the database, not inferred from lot list prices. */
export function fixedProjectRule<T extends FixedCommissionRule>(
  rules: readonly T[],
  projectId: string,
): { seller: number; captador: number | null } | null {
  // seller = comisión TOTAL por venta; captador = parte del total para quien
  // captó al cliente cuando cierra otro vendedor (quien cierra recibe el resto).
  const rule = rules.find(
    (r) => r.is_active && r.scope === "project" && r.project_id === projectId &&
      typeof r.fixed_sale_amount === "number" && Number.isFinite(r.fixed_sale_amount) &&
      r.fixed_sale_amount >= 0,
  );
  if (!rule) return null;
  const captador = rule.referral_fixed_amount;
  return {
    seller: rule.fixed_sale_amount as number,
    captador: typeof captador === "number" && Number.isFinite(captador) && captador >= 0
      ? captador
      : null,
  };
}

export const formatCLPCommission = (amount: number) =>
  "$" + amount.toLocaleString("es-CL") + " CLP";

/** Parte de quien cierra cuando otro vendedor captó al cliente (total − captación). */
export const closerShare = (fixed: { seller: number; captador: number | null }) =>
  Math.max(0, fixed.seller - (fixed.captador ?? 0));

/** "Total $750.000 CLP por venta: captador $350.000 CLP y quien cierra $400.000 CLP". */
export const commissionSplitLabel = (fixed: { seller: number; captador: number | null }) =>
  fixed.captador === null || fixed.captador === 0
    ? `Total ${formatCLPCommission(fixed.seller)} por venta`
    : `Total ${formatCLPCommission(fixed.seller)} por venta: captador ${formatCLPCommission(fixed.captador)} y quien cierra ${formatCLPCommission(closerShare(fixed))}`;
