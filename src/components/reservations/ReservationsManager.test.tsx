import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReservationsManager from './ReservationsManager';

const state = vi.hoisted(() => ({
  expires: '', rpc: vi.fn(), rejection: false,
  success: vi.fn(), failure: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'broker' } }) }));
vi.mock('@/hooks/useWorkspaceScope', () => ({ useWorkspaceScope: () => ({ projectId: 'project-1' }) }));
vi.mock('@/hooks/useReservations', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useReservations')>('@/hooks/useReservations');
  return {
    ...actual,
    useExpireStaleReservations: () => ({ mutate: vi.fn() }),
    useExtendReservation: () => ({ mutate: vi.fn(), isPending: false }),
  };
});
vi.mock('./ConvertToSaleDialog', () => ({ default: () => null }));
vi.mock('./BuyerJourneySheet', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.failure } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({
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
    update: () => ({ eq: async () => ({ error: null }) }),
  }),
  rpc: async (fn: string, args: Record<string, unknown>) => {
    state.rpc(fn, args);
    if (state.rejection) return { data: null, error: new Error('Reservation is not pending payment or has already expired') };
    return { data: null, error: null };
  },
} }));
const mount = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><ReservationsManager /></QueryClientProvider>);
  return client;
};
describe('reservation operations', () => {
  beforeEach(() => {
    state.expires = new Date(Date.now() + 3_600_000).toISOString();
    state.rejection = false;
    state.rpc.mockReset(); state.success.mockReset(); state.failure.mockReset();
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
    expect(state.rpc).not.toHaveBeenCalled();
    client.clear();
  });
  it('confirms a reservation through the server permission matrix RPC, not a raw update', async () => {
    const client = mount();
    await screen.findByText('María');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }));
    await waitFor(() => expect(state.success).toHaveBeenCalled());
    expect(state.rpc).toHaveBeenCalledWith('confirm_reservation', { p_reservation_id: 'reservation-1' });
    client.clear();
  });
  it('guards confirmation against a concurrently changed or expired reservation and never reports false success', async () => {
    state.rejection = true;
    const client = mount();
    await screen.findByText('María');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }));
    await waitFor(() => expect(state.failure).toHaveBeenCalled());
    expect(state.rpc).toHaveBeenCalledWith('confirm_reservation', { p_reservation_id: 'reservation-1' });
    expect(state.success).not.toHaveBeenCalled();
    client.clear();
  });
});
