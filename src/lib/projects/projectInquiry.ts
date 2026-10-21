/** Identify only lots loaded for the current project; never trust the URL as an ID. */
export interface ProjectInquiryLot {
  id: string;
  lot_number?: string | null;
}

/** Consume only the one-shot dialog request, preserving the commercial context. */
export function consumeProjectInquiry(params: URLSearchParams): URLSearchParams | null {
  if (params.get('consulta') !== '1') return null;
  const next = new URLSearchParams(params);
  next.delete('consulta');
  return next;
}

/**
 * Tour geometry IDs may differ from the database's lot UUID.
 * Prefer the displayed lot number when supplied, and fall back to the DB ID.
 */
export function resolveProjectInquiryLot<T extends ProjectInquiryLot>(
  lots: readonly T[],
  params: URLSearchParams,
): T | null {
  const lotNumber = params.get('loteNumero')?.trim();
  const lotId = params.get('lote')?.trim();
  if (lotNumber) {
    const matchedByNumber = lots.find((lot) => String(lot.lot_number ?? '') === lotNumber);
    if (matchedByNumber) return matchedByNumber;
  }
  return lotId ? lots.find((lot) => lot.id === lotId) ?? null : null;
}
