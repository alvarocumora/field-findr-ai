import { describe, it, expect } from 'vitest';
import { generateParcelaSitePlan } from './parcelaSitePlanPdf';
import type { PlacedObject } from '@/components/parcela/useParcelaState';

// A ~2500 m² square lot near Teno, as [lng, lat] (≈50m × 50m)
const squareLot: number[][] = [
  [-71.160, -34.870],
  [-71.1595, -34.870],
  [-71.1595, -34.8695],
  [-71.160, -34.8695],
];

const obj = (type: PlacedObject['type'], x: number, z: number): PlacedObject => ({
  id: `${type}-${x}-${z}`,
  type,
  position: [x, 0, z],
  rotation: 0,
  scale: 1,
});

const pdfText = (doc: ReturnType<typeof generateParcelaSitePlan>) => {
  // jsPDF streams are uncompressed → raw latin1 search finds drawn text
  const raw = doc.output('arraybuffer');
  return Buffer.from(raw).toString('latin1');
};

describe('generateParcelaSitePlan', () => {
  it('produces a valid PDF with the lot number, area and scale', () => {
    const doc = generateParcelaSitePlan({
      lotNumber: 'A-12',
      lotArea: 2500,
      polygon: squareLot,
      objects: [obj('casa_120', 5, 5), obj('piscina', -8, 3)],
    });
    const out = doc.output('arraybuffer');
    // magic bytes %PDF-
    expect(Buffer.from(out.slice(0, 5)).toString('latin1')).toBe('%PDF-');

    const text = pdfText(doc);
    expect(text).toContain('Lote A-12');
    expect(text).toContain('2.500 m'); // area label (es-CL thousands sep)
    expect(text).toMatch(/Escala 1:\d+/);
    expect(text).toContain('Plano de Parcela');
  });

  it('lists placed objects in the legend with counts', () => {
    const doc = generateParcelaSitePlan({
      lotNumber: 'B-3',
      lotArea: 5000,
      polygon: squareLot,
      objects: [obj('arbol_pino', 1, 1), obj('arbol_pino', 3, 3), obj('quincho', -5, -5)],
    });
    const text = pdfText(doc);
    expect(text).toContain('Pino'); // catalog label
    expect(text).toContain('Quincho');
    expect(text).toContain('ELEMENTOS');
    // two pinos collapse into one legend row with ×2
    expect(text).toMatch(/Pino.{0,4}2/);
  });

  it('renders a plan even with no objects placed', () => {
    const doc = generateParcelaSitePlan({
      lotNumber: 'C-1',
      lotArea: 1000,
      polygon: squareLot,
      objects: [],
    });
    const out = doc.output('arraybuffer');
    expect(Buffer.from(out.slice(0, 5)).toString('latin1')).toBe('%PDF-');
    expect(pdfText(doc)).toContain('Lote C-1');
  });

  it('does not throw and shows a message when the polygon is missing', () => {
    const doc = generateParcelaSitePlan({
      lotNumber: 'D-9',
      lotArea: 0,
      polygon: null,
      objects: [],
    });
    expect(pdfText(doc)).toContain('No hay polígono');
  });

  it('picks a smaller scale ratio for a larger parcel', () => {
    // A big lot spanning ~500m should need a coarser scale than the 50m square
    const bigLot: number[][] = [
      [-71.16, -34.87],
      [-71.154, -34.87],
      [-71.154, -34.865],
      [-71.16, -34.865],
    ];
    const small = pdfText(generateParcelaSitePlan({ lotNumber: 'S', lotArea: 2500, polygon: squareLot, objects: [] }));
    const big = pdfText(generateParcelaSitePlan({ lotNumber: 'L', lotArea: 250000, polygon: bigLot, objects: [] }));
    const scaleOf = (t: string) => Number(t.match(/Escala 1:(\d+)/)?.[1] ?? 0);
    expect(scaleOf(big)).toBeGreaterThan(scaleOf(small));
  });
});
