import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubscriptionSuccess from './SubscriptionSuccess';

const state = vi.hoisted(() => ({
  row: null as { status: string; plan_type: string; user_id: string; organization_id: string | null } | null,
  error: null as Error | null,
}));

vi.mock('@/components/layouts/PublicLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/hooks/useMyOrganization', () => ({
  useMyOrganization: () => ({ data: { organizations: [{ id: 'my-org' }] } }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: () => Promise.resolve({ data: state.row, error: state.error }),
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
        <SubscriptionSuccess />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('subscription checkout confirmation', () => {
  beforeEach(() => { state.row = null; state.error = null; });

  it('never claims success without a checkout_id, even if the viewer has an unrelated active plan', async () => {
    renderPage('/subscription/success?payment_id=123');
    expect(await screen.findByText(/no pudimos confirmar este pago/i)).toBeInTheDocument();
    expect(screen.queryByText(/¡pago exitoso!/i)).not.toBeInTheDocument();
  });

  it('shows the activating state while the webhook has not stamped this checkout yet', async () => {
    renderPage('/subscription/success?checkout_id=chk-1');
    expect(await screen.findByText(/activando tu plan/i)).toBeInTheDocument();
  });

  it('confirms success only once the matched row belongs to the viewer', async () => {
    state.row = { status: 'active', plan_type: 'corredor', user_id: 'viewer', organization_id: null };
    renderPage('/subscription/success?checkout_id=chk-1');
    expect(await screen.findByText(/¡pago exitoso!/i)).toBeInTheDocument();
  });

  it('confirms success for an organization the viewer belongs to', async () => {
    state.row = { status: 'active', plan_type: 'grupo', user_id: 'org-owner', organization_id: 'my-org' };
    renderPage('/subscription/success?checkout_id=chk-1');
    expect(await screen.findByText(/¡pago exitoso!/i)).toBeInTheDocument();
  });

  it('does not show success for a checkout_id matched to someone else entirely (not this viewer or their org)', async () => {
    state.row = { status: 'active', plan_type: 'grupo', user_id: 'someone-else', organization_id: 'another-org' };
    renderPage('/subscription/success?checkout_id=chk-1');
    expect(await screen.findByText(/activando tu plan/i)).toBeInTheDocument();
    expect(screen.queryByText(/¡pago exitoso!/i)).not.toBeInTheDocument();
  });
});
