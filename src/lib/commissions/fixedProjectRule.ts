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

/** Only these verified projects have agreed exact per-sale CLP terms. */
export const FIXED_BROKER_PROJECTS = {
  hualane: "761e73ed-cc0d-5605-a06a-4a4348523b4b",
  licanten: "b4363fda-e99f-400d-ae95-2cbc8244b770",
} as const;

export const isFixedBrokerProject = (projectId: string | null | undefined) =>
  projectId === FIXED_BROKER_PROJECTS.hualane || projectId === FIXED_BROKER_PROJECTS.licanten;
