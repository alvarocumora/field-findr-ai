import type { LegalItem } from './legalItemTypes';

/** A positive declared status alone is not a recorded review. Never infer a legal guarantee. */
export function hasRecordedLegalReview(item: LegalItem): boolean {
  if (item.status !== 'verified' && item.status !== 'approved') return false;
  const document = item.file_url || item.url;
  const date = item.verified_at || item.reviewed_at;
  return typeof document === 'string' && /^(https?:\/\/|\/(?!\/))/.test(document) &&
    Boolean(date && Number.isFinite(Date.parse(date)));
}

export function uniqueLegalTypes(items: LegalItem[]): LegalItem[] {
  const types = new Map<string, LegalItem>();
  for (const item of items) {
    const type = item.type?.trim().toLowerCase();
    if (!type) continue;
    const current = types.get(type);
    if (!current || hasRecordedLegalReview(item)) types.set(type, item);
  }
  return [...types.values()];
}
