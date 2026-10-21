export type QuoteLike = {
  id: string;
  lot_id: string;
  status: string;
  valid_until: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
};

const CLOSED = new Set(['rejected', 'expired', 'cancelled']);

/** A quote can become a reservation while it is open, unexpired and its lot is still available. */
export function canReserveFromQuote(quote: QuoteLike, lotStatus: string | undefined, now = new Date()): boolean {
  if (CLOSED.has(quote.status)) return false;
  if (new Date(quote.valid_until).getTime() < now.getTime()) return false;
  return lotStatus === 'available';
}

/** Pre-fills the reservation form with the quoted customer. */
export function reservationDraftFromQuote(quote: QuoteLike) {
  return {
    name: quote.customer_name ?? '',
    email: quote.customer_email ?? '',
    phone: quote.customer_phone ?? '',
  };
}
