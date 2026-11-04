import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { invalidateReservationInventory } from './invalidateInventory';

describe('reservation inventory synchronization', () => {
  it('refreshes an open broker stock view and marks inactive public/buyer views stale', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    let available = 2;
    const stock = new QueryObserver(client, { queryKey: ['sales-kit-stock', 'broker', 'project'], queryFn: async () => available });
    const unsubscribe = stock.subscribe(() => {});
    await stock.refetch();
    client.setQueryData(['project-lots', 'project'], ['old-available']);
    client.setQueryData(['reservation-form-lots', 'project'], ['old-available']);
    client.setQueryData(['buyer-reservations', 'buyer'], []);
    client.setQueryData(['auth-profile', 'broker'], { name: 'Broker' });
    available = 1; // server state after another reservation
    await invalidateReservationInventory(client);
    expect(stock.getCurrentResult().data).toBe(1);
    expect(client.getQueryState(['project-lots', 'project'])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['reservation-form-lots', 'project'])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['buyer-reservations', 'buyer'])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['auth-profile', 'broker'])?.isInvalidated).toBe(false);
    unsubscribe();
    client.clear();
  });
});
