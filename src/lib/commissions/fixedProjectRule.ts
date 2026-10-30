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
