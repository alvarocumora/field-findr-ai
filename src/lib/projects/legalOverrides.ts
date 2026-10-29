/** Normalize project legal data; approvals must come from persisted review evidence. */

import type { LegalItem } from './legalItemTypes';
export type { LegalItem } from './legalItemTypes';
export function parseLegalItems(value: unknown): LegalItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (typeof item === 'string') return [{ type: item, name: item }];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    return [Object.fromEntries(Object.entries(item).filter(([, value]) => typeof value === 'string')) as LegalItem];
  });
}

/** Resolve persisted legal data without inferring approval from project identity. */
export function applyLegalOverrides(
  _project: unknown,
  rawLegalDocuments: unknown,
  rawPermits: unknown,
  legalStatus: string,
): { legalDocuments: LegalItem[]; permits: LegalItem[]; legalStatus: string } {
  return {
    legalDocuments: parseLegalItems(rawLegalDocuments),
    permits: parseLegalItems(rawPermits),
    legalStatus,
  };
}
