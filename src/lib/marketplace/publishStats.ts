/**
 * Marketplace-publishing stats for the inmobiliaria dashboard.
 *
 * A lot is "published" when it points at a marketplace listing
 * (lots.listing_id). These pure helpers roll that up overall and per project so
 * the multi-project view can show how much inventory is actually on the market.
 */

export interface PublishStats {
  total: number;
  published: number;
  unpublished: number;
}

type LotLike = { project_id?: string | null; listing_id?: string | null };

export function marketplacePublishStats(lots: LotLike[]): PublishStats {
  const published = lots.reduce((n, l) => n + (l.listing_id ? 1 : 0), 0);
  return { total: lots.length, published, unpublished: lots.length - published };
}

export function publishStatsByProject(lots: LotLike[]): Map<string, PublishStats> {
  const map = new Map<string, PublishStats>();
  for (const l of lots) {
    const pid = l.project_id ?? '';
    const s = map.get(pid) ?? { total: 0, published: 0, unpublished: 0 };
    s.total += 1;
    if (l.listing_id) s.published += 1;
    else s.unpublished += 1;
    map.set(pid, s);
  }
  return map;
}
