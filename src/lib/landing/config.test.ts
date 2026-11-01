import { describe, it, expect } from 'vitest';
import { parseLandingConfig, summarizeLots } from './config';

describe('parseLandingConfig', () => {
  it('una config vacía produce defaults completos con todas las secciones activas', () => {
    const c = parseLandingConfig({});
    expect(c.sections).toEqual({ masterplan: true, gallery: true, amenities: true, contact: true });
    expect(c.gallery).toEqual([]);
    expect(c.amenities).toEqual([]);
    expect(c.hero.title).toBeUndefined();
  });

  it('tolera basura: null, arrays y tipos incorrectos no rompen', () => {
    for (const raw of [null, undefined, [], 'x', 42, { hero: 'no', gallery: 'no', amenities: 7, sections: [] }]) {
      const c = parseLandingConfig(raw);
      expect(c.sections.masterplan).toBe(true);
      expect(c.gallery).toEqual([]);
    }
  });

  it('solo un false explícito apaga una sección', () => {
    const c = parseLandingConfig({ sections: { gallery: false, amenities: 0 } });
    expect(c.sections.gallery).toBe(false);
    expect(c.sections.amenities).toBe(true);
  });

  it('amenities acepta strings y objetos, y filtra inválidos', () => {
    const c = parseLandingConfig({ amenities: ['Agua potable', { title: 'Luz', text: 'Empalme listo' }, { text: 'sin título' }, 5] });
    expect(c.amenities).toEqual([
      { title: 'Agua potable', text: undefined },
      { title: 'Luz', text: 'Empalme listo' },
    ]);
  });
});

describe('summarizeLots', () => {
  const lots = [
    { status: 'available', area: 5000, price: 15_990_000 },
    { status: 'available', area: 5200, price: 0 },
    { status: 'sold', area: 4800, price: 12_000_000 },
    { status: 'reserved', area: 5100, price: 14_000_000 },
  ];

  it('cuenta disponibles y calcula rangos', () => {
    const s = summarizeLots(lots);
    expect(s.total).toBe(4);
    expect(s.available).toBe(2);
    expect(s.areaMin).toBe(4800);
    expect(s.areaMax).toBe(5200);
    // precio desde: solo disponibles con precio > 0
    expect(s.priceFrom).toBe(15_990_000);
  });

  it('maneja lista vacía', () => {
    expect(summarizeLots([])).toEqual({ total: 0, available: 0, areaMin: null, areaMax: null, priceFrom: null });
  });
});

describe('parseLandingConfig · ficha_pdf', () => {
  it('acepta archivos del sitio y URLs https, con fecha de corte', () => {
    const cfg = parseLandingConfig({
      ficha_pdf: { url: '/downloads/fichas/valle-escondido-licanten.pdf', label: 'Ficha Licantén', updated_at: '2026-11-01' },
    });
    expect(cfg.fichaPdf).toEqual({ url: '/downloads/fichas/valle-escondido-licanten.pdf', label: 'Ficha Licantén', updatedAt: '2026-11-01' });
    expect(parseLandingConfig({ ficha_pdf: { url: 'https://cdn.example.com/f.pdf' } }).fichaPdf?.label)
      .toBe('Ficha interactiva del proyecto');
  });

  it('descarta URLs peligrosas o ajenas al formato y fechas inválidas', () => {
    expect(parseLandingConfig({ ficha_pdf: { url: 'javascript:alert(1)' } }).fichaPdf).toBeNull();
    expect(parseLandingConfig({ ficha_pdf: { url: '//evil.example/f.pdf' } }).fichaPdf).toBeNull();
    expect(parseLandingConfig({ ficha_pdf: { url: 'http://insecure.example/f.pdf' } }).fichaPdf).toBeNull();
    expect(parseLandingConfig({ ficha_pdf: 'x' }).fichaPdf).toBeNull();
    expect(parseLandingConfig({}).fichaPdf).toBeNull();
    expect(parseLandingConfig({ ficha_pdf: { url: '/f.pdf', updated_at: 'ayer' } }).fichaPdf?.updatedAt).toBeUndefined();
  });
});
