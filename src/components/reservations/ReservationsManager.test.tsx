import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReservationsManager from './ReservationsManager';

const state = vi.hoisted(() => ({
  expires: '', filters: [] as unknown[][], update: vi.fn(), rejection: false,
  success: vi.fn(), failure: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'broker' } }) }));
vi.mock('@/hooks/useWorkspaceScope', () => ({ useWorkspaceScope: () => ({ projectId: 'project-1' }) }));
vi.mock('@/hooks/useReservations', () => ({
  useExpireStaleReservations: () => ({ mutate: vi.fn() }),
  useExtendReservation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('./ConvertToSaleDialog', () => ({ default: () => null }));
vi.mock('./BuyerJourneySheet', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.failure } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({
  select: () => {
    const query = {
      order: () => query,
      eq: async () => ({ data: [{
        id: 'reservation-1', status: 'pending_payment', expires_at: state.expires,
        buyer_name: 'María', buyer_email: 'qa@example.test', buyer_phone: '+56912345678',
        reservation_amount: 500000, created_at: '2026-11-01T12:00:00Z', payment_url: 'https://example.test/pay',
        lots: { lot_number: 'A-42', name: null, projects: { name: 'Proyecto del Sur' } },
      }], error: null }),
    };
    return query;
  },
  update: (values: unknown) => {
    state.update(values);
    const query = {
      eq: (...args: unknown[]) => { state.filters.push(args); return query; },
      gt: (...args: unknown[]) => { state.filters.push(args); return query; },
      select: () => query,
      single: async () => ({ data: state.rejection ? null : { id: 'reservation-1' }, error: state.rejection ? new Error('row changed') : null }),
    };
    return query;
  },
}) } }));
const mount = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><ReservationsManager /></QueryClientProvider>);
  return client;
};
describe('reservation operations', () => {
  beforeEach(() => {
    state.expires = new Date(Date.now() + 3_600_000).toISOString();
    state.filters = [];
    state.rejection = false;
    state.update.mockReset(); state.success.mockReset(); state.failure.mockReset();
  });
  it('finds an existing reservation by lot and distinguishes filtered results from no reservations', async () => {
    const client = mount();
    await screen.findByText('María');
    const search = screen.getByRole('textbox', { name: 'Buscar reservas por comprador, teléfono, parcela o proyecto' });
    fireEvent.change(search, { target: { value: ' A-42 ' } });
    expect(screen.getByText('María')).toBeTruthy();
    fireEvent.change(search, { target: { value: 'no-match' } });
    expect(screen.getByText('No hay reservas con estos filtros')).toBeTruthy();
    expect(screen.queryByText('No tienes reservas aún')).toBeNull();
    client.clear();
  });
  it('does not offer collection or confirmation for an elapsed payment window', async () => {
    state.expires = new Date(Date.now() - 1000).toISOString();
    const client = mount();
    await screen.findByText('María');
    expect(screen.queryByRole('button', { name: 'Cobrar por WhatsApp' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copiar pago' })).toBeNull();
    expect((screen.getByRole('button', { name: 'Confirmar Pago' }) as HTMLButtonElement).disabled).toBe(true);
    expect(state.update).not.toHaveBeenCalled();
    client.clear();
  });
  it('guards confirmation against a concurrently changed reservation and never reports false success', async () => {
    state.rejection = true;
    const client = mount();
    await screen.findByText('María');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }));
    await waitFor(() => expect(state.failure).toHaveBeenCalled());
    expect(state.filters).toContainEqual(['status', 'pending_payment']);
    expect(state.filters.some(([column, value]) => column === 'expires_at' && Number.isFinite(Date.parse(String(value))))).toBe(true);
    expect(state.success).not.toHaveBeenCalled();
    client.clear();
  });
});
