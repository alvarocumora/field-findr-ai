import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useBrokerByInviteCode } from './useBrokers';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('public broker lookup by ?ref= invite_code', () => {
  it('does not query when there is no code', () => {
    renderHook(() => useBrokerByInviteCode(null), { wrapper });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('calls the opt-in-gated RPC with the invite_code and returns the first match', async () => {
    rpc.mockResolvedValue({
      data: [{ display_name: 'Camila Rojas', company_name: 'Rojas Corretajes', avatar_url: null, phone: '+56933334444', email: 'camila@corredora.cl' }],
      error: null,
    });
    const { result } = renderHook(() => useBrokerByInviteCode('BK-ABC123'), { wrapper });
    await waitFor(() => expect(result.current.data?.display_name).toBe('Camila Rojas'));
    expect(rpc).toHaveBeenCalledWith('get_public_broker_profile_by_code', { p_invite_code: 'BK-ABC123' });
  });

  it('resolves to null when the code matches no public, opted-in broker', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useBrokerByInviteCode('BK-DOES-NOT-EXIST'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
