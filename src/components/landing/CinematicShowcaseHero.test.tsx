import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CinematicShowcaseHero from './CinematicShowcaseHero';

const state = vi.hoisted(() => ({ error: false, retry: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({
  data: [1, 2].map((id) => ({ id: String(id), slug: `proyecto-${id}`, name: `Proyecto ${id}`, image: '/photo.jpg', inventoryReady: true, available: 2, total: 3 })),
  isError: state.error, refetch: state.retry, isLoading: false, isFetching: false,
}) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/components/landing/HeroTerrainGlobe', () => ({ default: () => <div /> }));
const Location = () => <output data-testid="location">{useLocation().search}</output>;
const mount = () => render(<MemoryRouter><CinematicShowcaseHero /><Location /></MemoryRouter>);

describe('landing hero', () => {
  beforeEach(() => { state.error = false; state.retry.mockReset(); });
  it('submits a trimmed and encoded location to the explorer', () => {
    mount();
    fireEvent.change(screen.getByLabelText('Destino, comuna o proyecto'), { target: { value: '  Maule & costa  ' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByTestId('location').textContent).toBe('?q=Maule%20%26%20costa');
  });
  it('offers pause and keeps manual project selection paused', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar proyectos destacados' }));
    expect(screen.getByRole('button', { name: 'Reanudar proyectos destacados' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Proyecto 2' }));
    expect(screen.getByRole('button', { name: 'Proyecto 2' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Reanudar proyectos destacados' })).toBeTruthy();
  });
  it('retries featured projects without hiding search when the request fails', () => {
    state.error = true;
    mount();
    expect(screen.getByRole('search')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar destacados' }));
    expect(state.retry).toHaveBeenCalledOnce();
  });
});
