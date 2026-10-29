import { fireEvent, render, screen, waitFor, within, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SaveSearchButton } from './SaveSearchButton';

const mocks = vi.hoisted(() => ({ user: { id: 'buyer-id' } as { id: string } | null, upsert: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ upsert: mocks.upsert }) } }));
afterEach(() => { cleanup(); mocks.upsert.mockReset(); });
const mount = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/explorar?q=Valle&currency=UF&ufMax=900']}><SaveSearchButton /></MemoryRouter></QueryClientProvider>);
  return client;
};

describe('save search intent', () => {
  it('preserves filters through login without trying an unauthenticated write', () => {
    mocks.user = null; const client = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar búsqueda' }));
    const href = screen.getByRole('link', { name: 'Iniciar sesión para guardar' }).getAttribute('href')!;
    const redirect = new URL(href, 'https://example.com').searchParams.get('redirect')!;
    expect(redirect).toContain('ufMax=900'); expect(redirect).toContain('saveSearch=1');
    expect(mocks.upsert).not.toHaveBeenCalled(); client.clear();
  });
  it('keeps failed input for retry and reuses one ID without enabling unsupported alerts', async () => {
    mocks.user = { id: 'buyer-id' };
    mocks.upsert.mockResolvedValueOnce({ error: new Error('Temporal') }).mockResolvedValueOnce({ error: null });
    const client = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar búsqueda' }));
    fireEvent.change(screen.getByLabelText('Nombre de la búsqueda'), { target: { value: 'Mi selección UF' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar búsqueda' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Puedes reintentarlo'));
    expect((screen.getByLabelText('Nombre de la búsqueda') as HTMLInputElement).value).toBe('Mi selección UF');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar búsqueda' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const [first, second] = mocks.upsert.mock.calls.map(call => call[0]);
    expect(first.id).toBe(second.id);
    expect(second).toMatchObject({ user_id: 'buyer-id', name: 'Mi selección UF', notifications_enabled: false });
    expect(second.filters.exploreQuery).toContain('ufMax=900'); client.clear();
  });
});
