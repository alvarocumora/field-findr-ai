import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubscriptionPending from './SubscriptionPending';

const state = vi.hoisted(() => ({
  row: null as { status: string; plan_type: string; user_id: string; organization_id: string | null } | null,
}));

vi.mock('@/components/layouts/PublicLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/hooks/useMyOrganization', () => ({
  useMyOrganization: () => ({ data: { organizations: [] } }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: () => Promise.resolve({ data: state.row, error: null }),
      };
      return chain;
    },
  },
}));

const renderPage = (path: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/subscription/pending" element={<SubscriptionPending />} />
          <Route path="/subscription/success" element={<div>success page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('subscription pending redirect', () => {
  beforeEach(() => { state.row = null; });

  it('carries the checkout_id forward when redirecting to the success page', async () => {
    state.row = { status: 'active', plan_type: 'corredor', user_id: 'viewer', organization_id: null };
    const { findByText } = renderPage('/subscription/pending?checkout_id=chk-1');
    expect(await findByText('success page')).toBeInTheDocument();
  });

  it('never redirects to success for a checkout matched to a different viewer', async () => {
    state.row = { status: 'active', plan_type: 'corredor', user_id: 'someone-else', organization_id: null };
    const { queryByText } = renderPage('/subscription/pending?checkout_id=chk-1');
    await waitFor(() => expect(queryByText('success page')).not.toBeInTheDocument());
  });

  it('does not redirect without a checkout_id even if a subscription query would resolve', async () => {
    const { queryByText } = renderPage('/subscription/pending');
    await waitFor(() => expect(queryByText('success page')).not.toBeInTheDocument());
  });
});
