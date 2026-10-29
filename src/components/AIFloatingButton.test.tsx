import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AIFloatingButton from './AIFloatingButton';

describe('public tools launcher', () => {
  it('offers working tool destinations instead of a simulated chat', () => {
    render(<MemoryRouter><AIFloatingButton /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir herramientas' }));
    expect(screen.getByRole('link', { name: 'Búsqueda asistida' }).getAttribute('href')).toBe('/tools?tab=smart-search');
    expect(screen.getByRole('link', { name: 'Calculadoras' }).getAttribute('href')).toBe('/tools?tab=calculators');
    expect(screen.queryByPlaceholderText('Pregunta lo que necesites...')).toBeNull();
  });
});
