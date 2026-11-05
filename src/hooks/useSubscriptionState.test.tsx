import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCurrentPlan } from './useSubscription';
const state = vi.hoisted(() => ({ loading: true, error: false, from: vi.fn(), retry: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'seller' } }) }));
vi.mock('@/hooks/useMyOrganization', () => ({ useMyOrganization: () => ({ data: undefined, isLoading: state.loading, isError: state.error, refetch: state.retry }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));
const mount = () => {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
 return { ...renderHook(() => useCurrentPlan(), { wrapper }), client };
};
describe('subscription workspace resolution', () => {
 beforeEach(() => { state.loading = true; state.error = false; state.from.mockReset(); state.retry.mockReset(); });
 it('does not report the fallback free plan as resolved while the organization is loading', () => {
  const hook = mount();
  expect(hook.result.current.isLoading).toBe(true);
  expect(state.from).not.toHaveBeenCalled();
  hook.unmount(); hook.client.clear();
 });
 it('reports a failed workspace lookup and retries it without querying a personal subscription', async () => {
  state.loading = false; state.error = true;
  const hook = mount();
  expect(hook.result.current.isError).toBe(true);
  await hook.result.current.refetch();
  expect(state.retry).toHaveBeenCalledOnce();
  expect(state.from).not.toHaveBeenCalled();
  hook.unmount(); hook.client.clear();
 });
});
