import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyCaptaciones from './MyCaptaciones';

const state = vi.hoisted(() => ({ error: null as Error | null, retry: vi.fn() }));
vi.mock('@/hooks/useLandReferrals', () => ({
  useMyLandReferrals: () => ({ error: state.error, refetch: state.retry, data: [{
    id: 'capture-1', title: 'Terreno publicado', status: 'publicada', listing_id: 'live-lot-1', updated_at: '2026-10-29T12:00:00Z',
  }] }),
  useCreateLandReferral: () => ({ isPending: false }),
}));
describe('captador next steps', () => {
  beforeEach(() => { state.error = null; state.retry.mockReset(); });
  it('links the exact live listing and distinguishes publication from a paid sale', () => {
    render(<MemoryRouter><MyCaptaciones /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Ver publicación' }).getAttribute('href')).toBe('/explorar?listing=live-lot-1');
    expect(screen.getByText(/Publicar no acredita una venta/)).toBeTruthy();
  });
  it('hides stale records on failure and offers recovery', () => {
    state.error = new Error('offline');
    render(<MemoryRouter><MyCaptaciones /></MemoryRouter>);
    expect(screen.queryByText('Terreno publicado')).toBeNull();
    expect(screen.queryByText('Aún no tienes captaciones')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));
    expect(state.retry).toHaveBeenCalledOnce();
  });
});
