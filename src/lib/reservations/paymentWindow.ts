/** A pending row is not a valid payment window once its deadline has passed. */
export function isReservationPayable(
  reservation: { status: string; expires_at: string },
  now = Date.now(),
): boolean {
  const deadline = Date.parse(reservation.expires_at);
  return reservation.status === 'pending_payment' && Number.isFinite(deadline) && deadline > now;
}
