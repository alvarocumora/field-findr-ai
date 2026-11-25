import { describe, expect, it } from 'vitest';
import { getLotSurface } from './lotSurface';

describe('superficie DL 3.516', () => {
  it('lote de 4.850 m² útiles se informa como 5.000 m² con 150 m² de servidumbre', () => {
    expect(getLotSurface(4850)).toEqual({ officialM2: 5000, usefulM2: 4850, easementM2: 150 });
  });
  it('lote mayor a 5.000 m² conserva su superficie', () => {
    expect(getLotSurface(5400)).toEqual({ officialM2: 5400, usefulM2: 5400, easementM2: 0 });
  });
});
