import { describe, expect, it } from 'vitest';
import { renderProjectShareImage, wrapLines } from './projectShareImage';

describe('project share-card word wrap', () => {
  it('keeps short names on one line', () => {
    expect(wrapLines('Explora Park', 22, 2)).toEqual(['Explora Park']);
  });

  it('wraps a long name across two lines without dropping words', () => {
    const lines = wrapLines('Valle Escondido Licantén Premium', 22, 2);
    expect(lines).toHaveLength(2);
    expect(lines.join(' ')).toBe('Valle Escondido Licantén Premium');
  });

  it('truncates with an ellipsis instead of overflowing past the line budget', () => {
    const lines = wrapLines('Un Nombre De Proyecto Extremadamente Largo Que No Cabe En Dos Líneas De Ningún Modo Posible', 22, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
    expect(lines[1].length).toBeLessThanOrEqual(22);
  });
});

describe('generic project share image', () => {
  it('renders a real, appropriately sized JPEG from real project data', async () => {
    const buffer = await renderProjectShareImage({
      name: 'Valle Escondido Licantén',
      location: 'Licantén, Región del Maule',
      priceFromLabel: 'Desde $19.990.000 CLP',
      availabilityLabel: '69 parcelas disponibles',
    });
    expect(buffer).toBeInstanceOf(Buffer);
    // JPEG magic bytes.
    expect(buffer.subarray(0, 2).toString('hex')).toBe('ffd8');
    // WhatsApp drops share images over ~300KB.
    expect(buffer.length).toBeLessThan(300_000);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('does not fail when location or availability data is missing', async () => {
    const buffer = await renderProjectShareImage({
      name: 'Proyecto Nuevo',
      location: '',
      priceFromLabel: 'Consulta precios',
      availabilityLabel: 'Consulta disponibilidad',
    });
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
