import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCaoneLots } from './useCaoneLots';

const fake = vi.hoisted(() => ({
  data: undefined as Array<{
    id: string;
    lot_number: string;
    status: string;
    price: number | null;
    area: number | null;
    listing_id: string | null;
  }> | undefined,
  isLoading: false,
  isError: false,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: fake.data, isLoading: fake.isLoading, isError: fake.isError }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  return {
    supabase: {
      channel: () => channel,
      removeChannel: vi.fn().mockResolvedValue(undefined),
    },
  };
});

const record = (number: string, status: string) => ({
  id: `db-lot-${number}`,
  lot_number: number,
  status,
  price: 12_990_000,
  area: 10_000,
  listing_id: null,
});

describe('Caone verified public inventory', () => {
  beforeEach(() => {
    fake.data = undefined;
    fake.isLoading = false;
    fake.isError = false;
  });

  it('does not advertise the static fallback as available', () => {
    const { result } = renderHook(() => useCaoneLots());
    expect(result.current.lots).toHaveLength(40);
    expect(result.current.available).toBe(0);
    expect(result.current.isLive).toBe(false);
    expect(result.current.verifiedCount).toBe(0);
  });

  it('counts only recognized live statuses, keeping missing lots unverified', () => {
    fake.data = [record('1', 'available'), record('36', 'reserved'), record('2', 'unknown')];
    const { result } = renderHook(() => useCaoneLots());
    expect(result.current.verifiedCount).toBe(2);
    expect(result.current.available).toBe(1);
    expect(result.current.verifiedLotNumbers.has('36')).toBe(true);
    expect(result.current.verifiedLotNumbers.has('2')).toBe(false);
    expect(result.current.isLive).toBe(true);
  });

  it('invalidates cached success on a failed refresh', () => {
    fake.data = [record('1', 'available')];
    fake.isError = true;
    const { result } = renderHook(() => useCaoneLots());
    expect(result.current.available).toBe(0);
    expect(result.current.isLive).toBe(false);
    expect(result.current.verifiedCount).toBe(0);
  });

  it('ignores valid RPC rows that are not in the project masterplan', () => {
    fake.data = [record('999', 'available')];
    const { result } = renderHook(() => useCaoneLots());
    expect(result.current.available).toBe(0);
    expect(result.current.verifiedCount).toBe(0);
    expect(result.current.isLive).toBe(false);
  });

  it('treats a successful empty RPC response as unverified, not sold out', () => {
    fake.data = [];
    const { result } = renderHook(() => useCaoneLots());
    expect(result.current.available).toBe(0);
    expect(result.current.isLive).toBe(false);
  });
});
