import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyBrokerBusiness from './MyBrokerBusiness';

const state = vi.hoisted(() => ({ loading: false, error: null as Error | null, retry: vi.fn() }));
vi.mock('@/hooks/useBrokers', () => ({
  useMyBrokerProfile: () => ({ data: null, isLoading: state.loading, error: state.error, refetch: state.retry }),
  useUpdateMyBrokerProfile: () => ({}),
  useProjectAssignments: () => ({ data: [], refetch: state.retry }),
  useBrokerRanking: () => ({ data: [], refetch: state.retry }),
}));
vi.mock('@/hooks/useAgentCommissions', () => ({ useAgentCommissions: () => ({ data: [], refetch: state.retry }) }));
vi.mock('@/hooks/useReferrals.commissions', () => ({ useReferralCommissionsEarned: () => ({ data: [], refetch: state.retry }) }));
vi.mock('@/components/dashboard/CommercialTasks', () => ({ default: () => null }));

describe('broker workspace availability', () => {
  beforeEach(() => { state.loading = false; state.error = null; state.retry.mockReset(); });
  it('does not show a recruitment prompt while the existing profile is loading', () => {
    state.loading = true;
    render(<MyBrokerBusiness />);
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Cargando tu negocio');
    expect(screen.queryByText('Postular como broker')).toBeNull();
  });
  it('offers retry instead of implying no broker profile or zero commissions on failure', () => {
    state.error = new Error('offline');
    render(<MyBrokerBusiness />);
    expect(screen.getByRole('alert').textContent).toContain('No pudimos cargar tu negocio');
    expect(screen.queryByText('Postular como broker')).toBeNull();
    expect(screen.queryByText('Comisiones cobradas')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));
    expect(state.retry).toHaveBeenCalledTimes(5);
  });
});
