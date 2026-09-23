import { describe, expect, it } from 'vitest';
import {
  fitView, imageSizeForBox, lngLatToMerc, mercToLngLat, metersPerMm, niceScaleLength,
  normalizeLotState, projectToBox, ringCentroid, staticImageUrl,
} from './masterplan';

// Franja N-S tipo Valle Escondido (larga y angosta).
const strip: [number, number][][] = [
  [[-71.96, -34.99], [-71.955, -34.99], [-71.955, -34.96], [-71.96, -34.96], [-71.96, -34.99]],
];

describe('masterplan: proyección', () => {
  it('Mercator ida y vuelta', () => {
    const [x, y] = lngLatToMerc(-71.95, -34.97);
    const [lng, lat] = mercToLngLat(x, y);
    expect(lng).toBeCloseTo(-71.95, 9);
    expect(lat).toBeCloseTo(-34.97, 9);
  });

  it('la imagen mantiene el aspecto de la caja y respeta el máximo de Mapbox', () => {
    expect(imageSizeForBox({ x: 0, y: 0, w: 178, h: 214 })).toEqual({ wPx: 1065, hPx: 1280 });
    const wide = imageSizeForBox({ x: 0, y: 0, w: 200, h: 100 });
    expect(wide).toEqual({ wPx: 1280, hPx: 640 });
  });

  it('fitView encuadra todos los puntos dentro de la caja con margen', () => {
    const box = { x: 16, y: 40, w: 178, h: 214 };
    const { wPx, hPx } = imageSizeForBox(box);
    const view = fitView(strip, wPx, hPx)!;
    for (const [lng, lat] of strip[0]) {
      const [x, y] = projectToBox(lng, lat, view, box);
      expect(x).toBeGreaterThanOrEqual(box.x);
      expect(x).toBeLessThanOrEqual(box.x + box.w);
      expect(y).toBeGreaterThanOrEqual(box.y);
      expect(y).toBeLessThanOrEqual(box.y + box.h);
    }
    // El centro geográfico cae en el centro de la caja.
    const [cx, cy] = projectToBox(view.lng, view.lat, view, box);
    expect(cx).toBeCloseTo(box.x + box.w / 2, 6);
    expect(cy).toBeCloseTo(box.y + box.h / 2, 6);
  });

  it('el norte queda arriba y el este a la derecha', () => {
    const box = { x: 0, y: 0, w: 100, h: 100 };
    const view = fitView(strip, 1280, 1280)!;
    const [, yNorth] = projectToBox(-71.957, -34.96, view, box);
    const [, ySouth] = projectToBox(-71.957, -34.99, view, box);
    const [xWest] = projectToBox(-71.96, -34.97, view, box);
    const [xEast] = projectToBox(-71.955, -34.97, view, box);
    expect(yNorth).toBeLessThan(ySouth);
    expect(xWest).toBeLessThan(xEast);
  });

  it('sin anillos no hay encuadre', () => {
    expect(fitView([], 1280, 1280)).toBeNull();
  });
});

describe('masterplan: escala y utilidades', () => {
  it('metros por mm coherentes con la extensión real (~3,3 km de franja)', () => {
    const box = { x: 0, y: 0, w: 178, h: 214 };
    const { wPx, hPx } = imageSizeForBox(box);
    const view = fitView(strip, wPx, hPx)!;
    const mpm = metersPerMm(view, box);
    const stripMm = 0.03 * 110540 / mpm; // 0.03° de latitud
    expect(stripMm).toBeGreaterThan(box.h * 0.75);
    expect(stripMm).toBeLessThanOrEqual(box.h);
  });

  it('barra de escala en valores redondos 1-2-5', () => {
    expect(niceScaleLength(430)).toBe(200);
    expect(niceScaleLength(760)).toBe(500);
    expect(niceScaleLength(1300)).toBe(1000);
    expect(niceScaleLength(27)).toBe(20);
  });

  it('centroide de área de un rectángulo', () => {
    expect(ringCentroid([[0, 0], [10, 0], [10, 4], [0, 4]])).toEqual([5, 2]);
  });

  it('normaliza estados en inglés y español', () => {
    expect(normalizeLotState('available')).toBe('available');
    expect(normalizeLotState('Disponible')).toBe('available');
    expect(normalizeLotState('reservado')).toBe('reserved');
    expect(normalizeLotState('sold')).toBe('sold');
    expect(normalizeLotState(null)).toBe('other');
  });

  it('URL estática sin overlays con centro, zoom y @2x', () => {
    const url = staticImageUrl({ lng: -71.9575, lat: -34.975, zoom: 14.21, wPx: 1065, hPx: 1280 }, 'pk.test');
    expect(url).toBe('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-71.957500,-34.975000,14.21,0/1065x1280@2x?access_token=pk.test');
  });
});
