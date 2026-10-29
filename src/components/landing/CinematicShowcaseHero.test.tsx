import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CinematicShowcaseHero from './CinematicShowcaseHero';

const state = vi.hoisted(() => ({ error: false, retry: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({
  data: [1, 2].map((id) => ({ id: String(id), slug: `proyecto-${id}`, name: `Proyecto ${id}`, image: '/photo.jpg', inventoryReady: true, available: 2, total: 3, minPrice: 19990000 })),
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
    fireEvent.change(screen.getByLabelText('¿Dónde quieres comprar?'), { target: { value: '  Maule & costa  ' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(new URLSearchParams(screen.getByTestId('location').textContent || '').get('q')).toBe('Maule & costa');
  });
  it('shows the selected project price and a direct purchase journey without auto-rotation', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Proyecto 2' }));
    expect(screen.getByRole('button', { name: 'Proyecto 2' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('link', { name: 'Ver parcelas y precios' }).getAttribute('href')).toBe('/p/proyecto-2');
    expect(screen.getByText('$19.990.000 CLP')).toBeTruthy();
    expect(screen.getByText('2 lotes disponibles')).toBeTruthy();
  });
  it('passes the chosen type and CLP budget to the inventory filters', () => {
    mount();
    fireEvent.change(screen.getByLabelText('Tipo de terreno'), { target: { value: 'parcela_rural' } });
    fireEvent.change(screen.getByLabelText('Presupuesto CLP'), { target: { value: '40000000' } });
    fireEvent.submit(screen.getByRole('search'));
    const params = new URLSearchParams(screen.getByTestId('location').textContent || '');
    expect(params.get('type')).toBe('parcela_rural');
    expect(params.get('currency')).toBe('CLP');
    expect(params.get('clpMax')).toBe('40000000');
  });
  it('retries featured projects without hiding search when the request fails', () => {
    state.error = true;
    mount();
    expect(screen.getByRole('search')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar proyectos' }));
    expect(state.retry).toHaveBeenCalledOnce();
  });
});
