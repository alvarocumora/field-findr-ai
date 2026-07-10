/**
 * Buyer-portal reservation helpers (Mi Terreno).
 *
 * `useReservations()` returns every reservation the RLS lets the user read —
 * which, for someone who is BOTH a buyer and a project owner, includes their
 * project's incoming reservations. The buyer portal must only ever show the
 * user's OWN reservations, so we filter by user_id here and derive the
 * active/past split and the summary the header cards use. Pure + testable.
 */

export interface PortalReservation {
  id: string;
  user_id: string;
  status: 'pending_payment' | 'paid' | 'expired' | 'cancelled' | 'converted' | string;
  reservation_amount?: number | null;
  lots?: { price?: number | null } | null;
}

const ACTIVE_STATUSES = ['paid', 'pending_payment', 'converted'];
const PAST_STATUSES = ['expired', 'cancelled'];
const DEPOSITED_STATUSES = ['paid', 'converted'];

/** Keep only the reservations that belong to this user. */
export function ownReservations<T extends { user_id: string }>(rows: T[], userId: string | undefined): T[] {
  if (!userId) return [];
  return rows.filter((r) => r.user_id === userId);
}

/** Split into currently-active reservations and the historical (expired/cancelled) ones. */
export function partitionReservations<T extends { status: string }>(rows: T[]): { active: T[]; past: T[] } {
  return {
    active: rows.filter((r) => ACTIVE_STATUSES.includes(r.status)),
    past: rows.filter((r) => PAST_STATUSES.includes(r.status)),
  };
}

export interface ReservationsSummary {
  activeCount: number;
  /** Deposits actually paid (status paid/converted). */
  totalDeposited: number;
  /** Sum of the reserved lots' list prices. */
  totalValue: number;
}

export function reservationsSummary(active: PortalReservation[]): ReservationsSummary {
  return {
    activeCount: active.length,
    totalDeposited: active
      .filter((r) => DEPOSITED_STATUSES.includes(r.status))
      .reduce((sum, r) => sum + (Number(r.reservation_amount) || 0), 0),
    totalValue: active.reduce((sum, r) => sum + (Number(r.lots?.price) || 0), 0),
  };
}
