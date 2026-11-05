// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const db = vi.hoisted(() => ({
  selectFields: vi.fn(),
  readProjects: vi.fn(),
  readLots: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: (fields: string) => {
        db.selectFields(fields);
        const query = {
          eq: () => query,
          order: () => query,
          limit: () => db.readProjects(fields),
        };
        return query;
      },
    }),
    rpc: (...args: unknown[]) => db.readLots(...args),
  },
}));
vi.mock('@/lib/projectCovers', () => ({
  projectImages: () => ['/cover.jpg'],
}));

import { useShowcaseProjects } from './useShowcaseProjects';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, {
    client: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  }, children);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('public project showcase resilience', () => {
  it('shows active projects after retrying without optional columns', async () => {
    db.readProjects.mockImplementation(async (fields: string) => {
      if (fields.includes('featured')) {
        return { data: null, error: { message: 'column featured does not exist' } };
      }
      return {
        data: [{
          id: 'project-1', name: 'Valle de prueba', slug: 'valle-de-prueba',
          city: 'Licantén', region: 'Maule', images: [], latitude: null, longitude: null,
          total_lots: 2, available_lots: 2,
        }],
        error: null,
      };
    });
    db.readLots.mockResolvedValue({
      data: [
        { price: 19_990_000, status: 'available' },
        { price: 22_000_000, status: 'reserved' },
      ],
      error: null,
    });

    const { result } = renderHook(() => useShowcaseProjects(), { wrapper });
    await waitFor(() => expect(result.current.data?.length).toBe(1));
    expect(result.current.data?.[0]).toMatchObject({
      name: 'Valle de prueba', available: 1, minPrice: 19_990_000,
      inventoryReady: true, image: '/cover.jpg',
    });
    expect(db.selectFields).toHaveBeenCalledTimes(2);
    expect(db.readLots).toHaveBeenCalledWith('get_public_lots', { p_project_id: 'project-1' });
  });

  it('retains query errors if even the minimal active-project read fails', async () => {
    db.readProjects.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const { result } = renderHook(() => useShowcaseProjects(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(db.readProjects).toHaveBeenCalledTimes(2);
  });
});
