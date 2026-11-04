import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SalesPipeline from './SalesPipeline';
const retry = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useWorkspaceScope', () => ({ useWorkspaceScope: () => ({ projectId: 'project' }) }));
vi.mock('@/hooks/useLeads', () => ({ LEAD_STATUS_CONFIG: { new: {}, contacted: {}, interested: {}, negotiating: {}, converted: {}, lost: {} }, useLeads: () => ({ leads: [], isLoading: false, error: new Error('offline'), refetch: retry }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
describe('sales pipeline availability', () => {
  it('shows retry instead of reporting zero leads or zero conversion after a failed request', () => {
    render(<SalesPipeline />);
    expect(screen.getByRole('alert').textContent).toContain('No pudimos cargar el pipeline');
    expect(screen.queryByText('Total Leads')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
