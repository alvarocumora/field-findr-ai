/**
 * Keeps a visitor's reservation form in sessionStorage across the Google
 * sign-in round trip. Without this, an anonymous visitor who fills the
 * reservation form, gets asked to sign in, and the auth provider redirects
 * instead of resolving in place, would land back with an empty form and
 * have to find their lot again from scratch.
 */
export interface ReservationDraft {
  lotId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rut?: string;
  message?: string;
}

const STORAGE_KEY = 'ot_reservation_draft_v1';

export function saveReservationDraft(draft: ReservationDraft): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable (private mode, quota) — the draft is best-effort.
  }
}

export function readReservationDraft(lotId: string): ReservationDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as ReservationDraft;
    return draft.lotId === lotId ? draft : null;
  } catch {
    return null;
  }
}

export function clearReservationDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — nothing to clean up if storage isn't available.
  }
}
