// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EasyCreditSimulator } from './EasyCreditSimulator';
import { FIXED_CREDIT_ANNUAL_RATE_PCT, LICANTEN_PROMO_PRICE } from '@/lib/easyCredit';

afterEach(cleanup);

it('shows fixed 9% nominal annual interest and the corresponding monthly amount', () => {
  render(<MemoryRouter><EasyCreditSimulator /></MemoryRouter>);
  expect(FIXED_CREDIT_ANNUAL_RATE_PCT).toBe(9);
  expect(screen.getByText(/Tasa nominal anual fija/)).toBeTruthy();
  expect(screen.getByText('9% anual')).toBeTruthy();
  expect(screen.queryByRole('spinbutton', { name: /Tasa nominal anual/i })).toBeNull();
  const monthlyRate = FIXED_CREDIT_ANNUAL_RATE_PCT / 100 / 12;
  // Default: current Licantén offer price, 20% down payment, 36 months.
  const financed = LICANTEN_PROMO_PRICE * 0.8;
  const expected = Math.round(financed * monthlyRate / (1 - Math.pow(1 + monthlyRate, -36)));
  expect(screen.getByRole('status').textContent).toContain('$' + expected.toLocaleString('es-CL'));
});

it('keeps 9% fixed when changing the term', () => {
  render(<MemoryRouter><EasyCreditSimulator /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: '60 meses' }));
  expect(screen.getByText('9% anual')).toBeTruthy();
  expect(screen.getByText(/60 cuotas · tasa nominal anual fija de 9%/)).toBeTruthy();
});
