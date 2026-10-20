// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EasyCreditSimulator } from './EasyCreditSimulator';

afterEach(cleanup);

it('starts at 12% nominal annual with the promotional 20% down and 36-month payment', () => {
  render(<MemoryRouter><EasyCreditSimulator /></MemoryRouter>);
  const rate = screen.getByRole('spinbutton', { name: /Tasa nominal anual/ }) as HTMLInputElement;
  expect(rate.value).toBe('12');
  expect(screen.getByRole('status').textContent).toContain('$531.163');
});

it('allows manual 0% as a mathematical scenario', () => {
  render(<MemoryRouter><EasyCreditSimulator /></MemoryRouter>);
  fireEvent.change(screen.getByRole('spinbutton', { name: /Tasa nominal anual/ }), { target: { value: '0' } });
  expect(screen.getByRole('status').textContent).toContain('$444.222');
});