import { describe, it, expect } from 'vitest';
import { lotToListingInput } from './lotToListing';

const project = {
  name: 'Loteo Brisas',
  location: 'Teno',
  region: 'Maule',
  city: 'Teno',
  country: 'Chile',
  latitude: -34.87,
  longitude: -71.16,
  rol_number: '123-45',
};

const lot = {
  lot_number: '7',
  name: 'Lote 7',
  area: 5000,
  price: 48_000_000,
  latitude: -34.871,
  longitude: -71.161,
  images: ['a.jpg'],
};

describe('lotToListingInput', () => {
  const input = lotToListingInput(lot, project);

  it('composes a project + lot title', () => {
    expect(input.title).toBe('Loteo Brisas — Lote 7');
  });

  it('defaults type to parcela_rural and can be overridden', () => {
    expect(input.type).toBe('parcela_rural');
    expect(lotToListingInput(lot, project, { type: 'sitio_industrial' }).type).toBe('sitio_industrial');
  });

  it('carries price, area and derives hectares', () => {
    expect(input.price).toBe(48_000_000);
    expect(input.area_m2).toBe(5000);
    expect(input.area_ha).toBe(0.5);
  });

  it('uses lot coordinates, falling back to the project', () => {
    expect(input.lat).toBe(-34.871);
    expect(input.lng).toBe(-71.161);
    const noGeo = lotToListingInput({ ...lot, latitude: null, longitude: null }, project);
    expect(noGeo.lat).toBe(-34.87);
    expect(noGeo.lng).toBe(-71.16);
  });

  it('inherits location / region / city / rol from the project', () => {
    expect(input.location).toBe('Teno');
    expect(input.region).toBe('Maule');
    expect(input.city).toBe('Teno');
    expect(input.country).toBe('Chile');
    expect(input.rol).toBe('123-45');
  });

  it('auto-generates a description mentioning area when none is given', () => {
    expect(input.description).toContain('Lote 7 en Loteo Brisas');
    expect(input.description).toContain('5.000 m²');
  });

  it('keeps an explicit lot description', () => {
    const withDesc = lotToListingInput({ ...lot, description: 'Vista al río' }, project);
    expect(withDesc.description).toBe('Vista al río');
  });

  it('falls back to a lot-number label and safe defaults on sparse input', () => {
    const sparse = lotToListingInput({ lot_number: '3' }, { name: 'X' });
    expect(sparse.title).toBe('X — Lote 3');
    expect(sparse.price).toBe(0);
    expect(sparse.area_m2).toBeUndefined();
    expect(sparse.country).toBe('Chile');
    expect(sparse.images).toEqual([]);
  });
});
