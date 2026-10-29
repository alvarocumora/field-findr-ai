import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Panel from './Panel';

vi.mock('@/hooks/usePanelContext', () => ({ usePanelContext: () => ({
  active: { id: 'buyer', home: '/comprador/inicio' },
  options: [{ id: 'buyer', label: 'Comprador', shortLabel: 'Comprador', home: '/comprador/inicio', area: 'buyer' }, { id: 'empresa', label: 'Empresa', shortLabel: 'Empresa', home: '/asesor/dashboard', area: 'agent' }],
  setContext: vi.fn(), needsChoice: false, isLoading: false,
}) }));
const Location = () => <output data-testid="location">{useLocation().pathname}</output>;

describe('explicit workspace switch', () => {
  it('opens the chooser even with a saved context, and selecting a workspace leaves the chooser', () => {
    render(<MemoryRouter initialEntries={['/panel?elegir=1']}><Routes><Route path="/panel" element={<Panel />} /></Routes><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Empresa/ }));
    expect(screen.getByTestId('location').textContent).toBe('/asesor/dashboard');
  });
});
