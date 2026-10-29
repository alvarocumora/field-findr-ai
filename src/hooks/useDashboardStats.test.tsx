import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  rows: [
    { id: 'interested', first_name: 'Buyer', last_name: null, status: 'interested', updated_at: '2026-10-01T00:00:00Z', projects: null, budget_min: null, budget_max: null, email: null, phone: null, next_follow_up: null },
    { id: 'new', first_name: 'Buyer', last_name: null, status: 'new', updated_at: '2026-10-01T00:00:00Z', projects: null, budget_min: null, budget_max: null, email: null, phone: null, next_follow_up: null },
  ],
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'agent' } }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: fixtures.rows, error: null }) }) }) }) }) },
}));
import { useAgentLeads } from './useDashboardStats';

describe('agent dashboard lead states', () => {
  it('keeps lifecycle status distinct from priority so interested leads can be counted', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, unmount } = renderHook(() => useAgentLeads(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.find(lead => lead.id === 'interested')).toMatchObject({ lifecycleStatus: 'interested', status: 'cold' });
    expect(result.current.data?.filter(lead => lead.lifecycleStatus === 'interested')).toHaveLength(1);
    unmount();
    client.clear();
  });
});
