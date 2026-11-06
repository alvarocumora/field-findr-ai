import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlanLimits } from './usePlanLimits';

const state = vi.hoisted(() => ({
  count: 0 as number | null, error: null as Error | null, planLoading: false, planError: false,
  teamUserIds: ['seller'] as string[], teamLoading: false, teamError: false,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'seller' } }) }));
vi.mock('@/hooks/useSubscription', () => ({
  PLAN_DETAILS: { free: { maxPublications: 3, maxProjects: 1, includedFeatured: 0, includedSuperFeatured: 0 } },
  useCurrentPlan: () => ({ plan: 'free', planDetails: { maxPublications: 3, maxProjects: 1, includedFeatured: 0, includedSuperFeatured: 0 }, isLoading: state.planLoading, isError: state.planError, refetch: vi.fn() }),
}));
vi.mock('@/hooks/useMyOrganization', () => ({
  useMyOrganization: () => ({ data: { teamUserIds: state.teamUserIds }, isLoading: state.teamLoading, isError: state.teamError, refetch: vi.fn() }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => {
    const chain = { select: () => chain, eq: () => chain, in: () => chain, neq: () => chain, gte: () => chain,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ count: state.count, error: state.error })),
    };
    return chain;
  },
  channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; },
  removeChannel: vi.fn(),
} }));
const mount = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { ...renderHook(() => usePlanLimits(), { wrapper }), client };
};
describe('verified SaaS usage', () => {
  beforeEach(() => {
    state.count = 0; state.error = null; state.planLoading = false; state.planError = false;
    state.teamUserIds = ['seller']; state.teamLoading = false; state.teamError = false;
  });
  it('allows a verified zero but does not grant quota while it is loading', async () => {
    const hook = mount();
    expect(hook.result.current.canCreateListing).toBe(false);
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
    expect(hook.result.current.canCreateListing).toBe(true);
    hook.unmount(); hook.client.clear();
  });
  it.each(['error', 'missing-count'])('does not convert %s into free publication capacity', async mode => {
    if (mode === 'error') state.error = new Error('unavailable'); else state.count = null;
    const hook = mount();
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(hook.result.current.canCreateListing).toBe(false);
    expect(hook.result.current.canCreateProject).toBe(false);
    hook.unmount(); hook.client.clear();
  });
  it('waits for the subscription and blocks capacity after a plan failure', async () => {
    state.planLoading = true;
    const hook = mount();
    await waitFor(() => expect(hook.client.getQueryData(['plan-usage', 'seller'])).toBeTruthy());
    expect(hook.result.current.isLoading).toBe(true);
    expect(hook.result.current.canCreateListing).toBe(false);
    state.planLoading = false; state.planError = true;
    hook.rerender();
    expect(hook.result.current.isError).toBe(true);
    expect(hook.result.current.canCreateListing).toBe(false);
    hook.unmount(); hook.client.clear();
  });
  it('counts usage across the whole team sharing an org plan, not only the viewing user', async () => {
    state.teamUserIds = ['owner', 'agent-1', 'agent-2'];
    const hook = mount();
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
    expect(hook.client.getQueryData(['plan-usage', 'agent-1,agent-2,owner'])).toBeTruthy();
    hook.unmount(); hook.client.clear();
  });
  it('blocks capacity while the organization/team lookup is loading or failing', async () => {
    state.teamLoading = true;
    const loadingHook = mount();
    expect(loadingHook.result.current.isLoading).toBe(true);
    expect(loadingHook.result.current.canCreateListing).toBe(false);
    loadingHook.unmount(); loadingHook.client.clear();

    state.teamLoading = false; state.teamError = true;
    const errorHook = mount();
    await waitFor(() => expect(errorHook.result.current.isError).toBe(true));
    expect(errorHook.result.current.canCreateListing).toBe(false);
    errorHook.unmount(); errorHook.client.clear();
  });
});
