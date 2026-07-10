import { describe, it, expect } from 'vitest';
import {
  buildPriceRows,
  summarizePriceList,
  priceListToCsv,
  compareLotNumbers,
  statusLabel,
  type PriceListLot,
} from './priceList';

const lots: PriceListLot[] = [
  { lot_number: '10', name: 'Lote 10', area: 5000, price: 50_000_000, status: 'available' },
  { lot_number: '2', name: 'Lote 2', area: 5000, price: 40_000_000, status: 'sold' },
  { lot_number: '1', name: 'Lote 1', area: 4000, price: 36_000_000, status: 'reserved', price_per_sqm: 9000 },
];

describe('compareLotNumbers', () => {
  it('orders numeric lot numbers naturally (2 before 10)', () => {
    expect(['10', '2', '1'].sort(compareLotNumbers)).toEqual(['1', '2', '10']);
  });
  it('orders alphanumeric identifiers (A-2 before A-10)', () => {
    expect(['A-10', 'A-2', 'B-1'].sort(compareLotNumbers)).toEqual(['A-2', 'A-10', 'B-1']);
  });
});

describe('statusLabel', () => {
  it('maps known statuses to Spanish labels', () => {
    expect(statusLabel('available')).toBe('Disponible');
    expect(statusLabel('reserved')).toBe('Reservado');
    expect(statusLabel('sold')).toBe('Vendido');
    expect(statusLabel(null)).toBe('—');
  });
});

describe('buildPriceRows', () => {
  it('sorts by natural lot number', () => {
    const rows = buildPriceRows(lots);
    expect(rows.map((r) => r.lotNumber)).toEqual(['1', '2', '10']);
  });
  it('derives price/m² from price and area when not given', () => {
    const rows = buildPriceRows(lots);
    const lot10 = rows.find((r) => r.lotNumber === '10')!;
    expect(lot10.pricePerSqm).toBe(50_000_000 / 5000); // 10000
  });
  it('keeps an explicit price/m² when provided', () => {
    const rows = buildPriceRows(lots);
    const lot1 = rows.find((r) => r.lotNumber === '1')!;
    expect(lot1.pricePerSqm).toBe(9000);
  });
  it('handles missing fields without throwing', () => {
    const rows = buildPriceRows([{}, { lot_number: '', area: null, price: null }]);
    expect(rows).toHaveLength(2);
    expect(rows[0].lotNumber).toBe('—');
    expect(rows[0].pricePerSqm).toBe(0);
  });
});

describe('summarizePriceList', () => {
  const summary = summarizePriceList(buildPriceRows(lots));
  it('counts lots by status', () => {
    expect(summary.total).toBe(3);
    expect(summary.available).toBe(1);
    expect(summary.reserved).toBe(1);
    expect(summary.sold).toBe(1);
  });
  it('totals area and value, and available (sellable) value separately', () => {
    expect(summary.totalArea).toBe(14000);
    expect(summary.totalValue).toBe(126_000_000);
    expect(summary.availableValue).toBe(50_000_000); // only the available lot
  });
  it('computes an area-weighted average price/m²', () => {
    // 126,000,000 / 14,000 = 9000
    expect(summary.avgPricePerSqm).toBe(9000);
  });
});

describe('priceListToCsv', () => {
  const csv = priceListToCsv(buildPriceRows(lots));
  it('starts with a BOM and a semicolon header', () => {
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('N°;Nombre;Superficie (m2);Precio (CLP);Precio/m2 (CLP);Estado');
  });
  it('emits raw integer numbers and Spanish status labels', () => {
    expect(csv).toContain('10;Lote 10;5000;50000000;10000;Disponible');
  });
  it('quotes cells containing the delimiter', () => {
    const out = priceListToCsv(buildPriceRows([{ lot_number: '1', name: 'Lote; especial', area: 1, price: 1, status: 'available' }]));
    expect(out).toContain('"Lote; especial"');
  });
});
