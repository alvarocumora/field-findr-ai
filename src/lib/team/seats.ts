import { PLAN_DETAILS, normalizePlanId } from '@/hooks/useSubscription';

/**
 * Asientos de equipo según el plan. Fuente de verdad: PLAN_DETAILS.teamSeats
 * (null = ilimitado). El edge function manage-team replica este mapa en el
 * servidor — si cambian los asientos de un plan, actualizar ambos.
 */
export function seatsForPlan(planId: string | null | undefined): number | null {
  const plan = normalizePlanId(planId);
  const details = PLAN_DETAILS[plan];
  // Ojo: teamSeats === null significa ilimitado (enterprise); solo un plan
  // desconocido cae al asiento único.
  if (!details) return 1;
  return details.teamSeats;
}

export interface SeatsSummary {
  /** Límite de asientos del plan; null = ilimitado. */
  limit: number | null;
  used: number;
  /** Asientos disponibles; null = ilimitado. */
  remaining: number | null;
  canInvite: boolean;
}

export function seatsSummary(planId: string | null | undefined, memberCount: number): SeatsSummary {
  const limit = seatsForPlan(planId);
  const used = Math.max(0, memberCount);
  if (limit === null) {
    return { limit: null, used, remaining: null, canInvite: true };
  }
  const remaining = Math.max(0, limit - used);
  return { limit, used, remaining, canInvite: remaining > 0 };
}
