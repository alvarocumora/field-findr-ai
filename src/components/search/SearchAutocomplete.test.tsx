import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchAutocomplete from './SearchAutocomplete';

const api = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: api.invoke } } }));
const Location = () => <output data-testid="location">{useLocation().search}</output>;
function mount(onSearchChange = vi.fn()) {
  return render(<MemoryRouter initialEntries={['/explorar?currency=CLP&clpMax=40000000&type=parcela_rural']}><SearchAutocomplete onSearchChange={onSearchChange} /><Location /></MemoryRouter>);
}
const input = () => screen.getByRole('combobox');
async function type(value: string) {
  fireEvent.change(input(), { target: { value } });
  await act(async () => { vi.advanceTimersByTime(250); });
}

describe('fluent search suggestions', () => {
  beforeEach(() => { vi.useFakeTimers(); api.invoke.mockReset(); localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  it('ignores an older response arriving after the latest search', async () => {
    let first!: (result: unknown) => void;
    let second!: (result: unknown) => void;
    api.invoke.mockImplementationOnce(() => new Promise(resolve => { first = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { second = resolve; }));
    mount();
    await type('Maule');
    await type('Colina');
    await act(async () => { second({ data: { locations: ['Colina actual'] } }); });
    await act(async () => { first({ data: { locations: ['Maule anterior'] } }); });
    expect(screen.getByText((_text, element) => element?.tagName === 'SPAN' && element.textContent === 'Colina actual')).toBeTruthy();
    expect(screen.queryByText('Maule anterior')).toBeNull();
  });
  it('distinguishes a failed suggestion service and still submits the search', async () => {
    api.invoke.mockResolvedValue({ error: new Error('offline') });
    const change = vi.fn();
    mount(change);
    await type('Maule');
    expect(screen.getByText(/No pudimos cargar las sugerencias/).textContent).toContain('No pudimos cargar las sugerencias');
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(change).toHaveBeenLastCalledWith('Maule');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('preserves filters when opening an exact listing from suggestions', async () => {
    api.invoke.mockResolvedValue({ data: { properties: [{ id: 'lot-live', title: 'Parcela disponible', location: 'Maule', price: 10000000, currency: 'CLP', images: [] }] } });
    mount();
    await type('Parcela');
    fireEvent.click(screen.getByRole('button', { name: /Parcela disponible/ }));
    const params = new URLSearchParams(screen.getByTestId('location').textContent || '');
    expect(params.get('listing')).toBe('lot-live');
    expect(params.get('clpMax')).toBe('40000000');
    expect(params.get('type')).toBe('parcela_rural');
  });
  it('uses the location behind a popular suggestion instead of marketing text', () => {
    const change = vi.fn();
    mount(change);
    fireEvent.focus(input());
    fireEvent.click(screen.getByText('Parcelas en Colina'));
    expect(change).toHaveBeenLastCalledWith('Colina');
  });
  it('clears an in-flight search and works when history cannot be saved', async () => {
    let resolve!: (result: unknown) => void;
    api.invoke.mockImplementation(() => new Promise(done => { resolve = done; }));
    localStorage.setItem('terreno-recent-searches', '{"invalid":true}');
    mount();
    await type('Maule');
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    await act(async () => { resolve({ data: { locations: ['Respuesta antigua'] } }); });
    expect(screen.queryByText('Respuesta antigua')).toBeNull();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    fireEvent.change(input(), { target: { value: 'Colina' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
