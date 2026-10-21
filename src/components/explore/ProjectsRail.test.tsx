import { render, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ select: vi.fn(), lots: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: db.lots, from: (table: string) => ({ select: (fields: string) => {
    db.select(table, fields);
    const query = {
      eq: () => query, order: () => query,
      limit: async () => ({ data: [{ id: 'project-1', name: 'Project', images: [], available_lots: 2, total_lots: 3 }], error: null }),
    };
    return query;
  } }) },
}));
vi.mock('@/hooks/useIncludeLoteoLots', () => ({ useIncludeLoteoLots: () => ({ include: false, setInclude: vi.fn() }) }));
vi.mock('@/lib/projectCovers', () => ({ projectImages: () => [] }));
import ProjectsRail from './ProjectsRail';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('project rail lot statistics', () => {
  it('reads the real area column and calculates prices only from available lots', async () => {
    db.lots.mockResolvedValue({ data: [
      { project_id: 'project-1', price: 23990000, area: 10000, status: 'available' },
      { project_id: 'project-1', price: 19990000, area: 5000, status: 'available' },
      { project_id: 'project-1', price: 1, area: 20000, status: 'reserved' },
    ], error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<MemoryRouter><QueryClientProvider client={client}><ProjectsRail /></QueryClientProvider></MemoryRouter>);
    await waitFor(() => expect(client.getQueryData(['explorer-projects-rail-stats', ['project-1']])).toEqual({
      'project-1': { minPrice: 19990000, minArea: 5000, maxArea: 20000 },
    }));
    expect(db.lots).toHaveBeenCalledWith('get_public_lots', { p_project_id: 'project-1' });
    expect(db.select).not.toHaveBeenCalledWith('lots', expect.anything());
  });

  it('keeps database failures as query errors instead of empty statistics', async () => {
    const error = { message: 'permission denied' };
    db.lots.mockResolvedValue({ data: null, error });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<MemoryRouter><QueryClientProvider client={client}><ProjectsRail /></QueryClientProvider></MemoryRouter>);
    await waitFor(() => expect(client.getQueryState(['explorer-projects-rail-stats', ['project-1']])?.status).toBe('error'));
    expect(client.getQueryState(['explorer-projects-rail-stats', ['project-1']])?.error).toEqual(error);
  });
});