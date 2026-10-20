import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVelLots } from './useVelLots';
import { VEL_LOTS } from './lots';
import { supabase } from '@/integrations/supabase/client';

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
  useQuery: () => ({ data: fake.data, isLoading: fake.isLoading, isError: fake.isError, refetch: vi.fn() }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  return { supabase: { channel: vi.fn(() => channel), removeChannel: vi.fn().mockResolvedValue(undefined) } };
});

const record = (number: string, status: string, price: number | null = 19_990_000) => ({
  id: `db-lot-${number}`,
  lot_number: number,
  status,
  price,
  area: 5_000,
  listing_id: null,
});

describe('Valle Escondido verified public inventory', () => {
  beforeEach(() => {
    fake.data = undefined;
    fake.isLoading = false;
    fake.isError = false;
    vi.mocked(supabase.channel).mockClear();
  });

  it('preserves KMZ geometry but does not advertise static availability or prices', () => {
    const { result } = renderHook(() => useVelLots());
    expect(result.current.lots).toHaveLength(VEL_LOTS.length);
    expect(result.current.available).toBe(0);
    expect(result.current.isLive).toBe(false);
    expect(result.current.verifiedCount).toBe(0);
    expect(result.current.verifiedPriceFrom).toBeNull();
  });

  it('counts only known live statuses and confirmed positive prices', () => {
    fake.data = [
      record('5', 'available', 19_990_000),
      record('6', 'available', null),
      record('7', 'reserved', 22_990_000),
      record('8', 'unknown', 23_990_000),
    ];
    const { result } = renderHook(() => useVelLots());
    expect(result.current.verifiedCount).toBe(3);
    expect(result.current.available).toBe(2);
    expect(result.current.verifiedLotNumbers.has('8')).toBe(false);
    expect(result.current.verifiedPricedLotNumbers.has('5')).toBe(true);
    expect(result.current.verifiedPricedLotNumbers.has('6')).toBe(false);
    expect(result.current.verifiedPricedLotNumbers.has('7')).toBe(false);
    expect(result.current.verifiedPriceFrom).toBe(19_990_000);
    expect(result.current.isLive).toBe(true);
  });

  it('invalidates stale cached RPC data when the latest refresh fails', () => {
    fake.data = [record('5', 'available', 19_990_000)];
    fake.isError = true;
    const { result } = renderHook(() => useVelLots());
    expect(result.current.available).toBe(0);
    expect(result.current.verifiedCount).toBe(0);
    expect(result.current.verifiedPriceFrom).toBeNull();
    expect(result.current.isLive).toBe(false);
  });

  it('multiple sections can consume live lots without subscribing the same Realtime topic repeatedly', () => {
    const first = renderHook(() => useVelLots());
    const second = renderHook(() => useVelLots());
    expect(first.result.current.lots).toHaveLength(VEL_LOTS.length);
    expect(second.result.current.lots).toHaveLength(VEL_LOTS.length);
    expect(supabase.channel).not.toHaveBeenCalled();
    first.unmount();
    second.unmount();
  });

  it('does not count unknown lot numbers or an empty response', () => {
    fake.data = [record('999', 'available')];
    const { result, rerender } = renderHook(() => useVelLots());
    expect(result.current.verifiedCount).toBe(0);
    fake.data = [];
    rerender();
    expect(result.current.available).toBe(0);
    expect(result.current.verifiedPriceFrom).toBeNull();
  });
});
