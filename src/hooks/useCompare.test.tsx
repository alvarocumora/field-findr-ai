import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompareProvider, useCompare, COMPARE_IDS_KEY, readComparedIds } from './useCompare';
const mocks = vi.hoisted(() => ({ data: [{ id: '00000000-0000-4000-8000-000000000001', price: 999, title: 'Precio actualizado' }] }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ in: () => ({ eq: async () => ({ data: mocks.data, error: null }) }) }) }) } }));
afterEach(() => localStorage.clear());

describe('comparison continuity', () => {
  it('restores IDs and reads fresh prices without storing commercial snapshots', async () => {
    localStorage.setItem(COMPARE_IDS_KEY, JSON.stringify([mocks.data[0].id]));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}><CompareProvider>{children}</CompareProvider></QueryClientProvider>;
    const { result, unmount } = renderHook(() => useCompare(), { wrapper });
    await waitFor(() => expect(result.current.compareList[0]?.price).toBe(999));
    expect(result.current.selectionCount).toBe(1);
    expect(localStorage.getItem(COMPARE_IDS_KEY)).not.toContain('999');
    act(() => result.current.removeFromCompare(mocks.data[0].id));
    await waitFor(() => expect(readComparedIds()).toEqual([]));
    unmount(); client.clear();
  });
  it('rejects malformed persisted snapshots and deduplicates selection IDs', () => {
    localStorage.setItem(COMPARE_IDS_KEY, JSON.stringify([mocks.data[0].id, mocks.data[0].id, { price: 1 }, 'invalid']));
    expect(readComparedIds()).toEqual([mocks.data[0].id]);
    localStorage.setItem(COMPARE_IDS_KEY, 'not json'); expect(readComparedIds()).toEqual([]);
  });
});
