import { describe, it, expect } from 'vitest';
import { marketplacePublishStats, publishStatsByProject } from './publishStats';

const lots = [
  { project_id: 'p1', listing_id: 'l1' },
  { project_id: 'p1', listing_id: null },
  { project_id: 'p1', listing_id: 'l3' },
  { project_id: 'p2', listing_id: null },
  { project_id: 'p2', listing_id: null },
];

describe('marketplacePublishStats', () => {
  it('counts published vs unpublished overall', () => {
    expect(marketplacePublishStats(lots)).toEqual({ total: 5, published: 2, unpublished: 3 });
  });
  it('handles an empty inventory', () => {
    expect(marketplacePublishStats([])).toEqual({ total: 0, published: 0, unpublished: 0 });
  });
});

describe('publishStatsByProject', () => {
  const byProject = publishStatsByProject(lots);
  it('rolls up per project', () => {
    expect(byProject.get('p1')).toEqual({ total: 3, published: 2, unpublished: 1 });
    expect(byProject.get('p2')).toEqual({ total: 2, published: 0, unpublished: 2 });
  });
});
