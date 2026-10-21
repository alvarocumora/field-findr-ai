import { describe, expect, it, vi } from 'vitest';

// Uncompressed output so the page content can be inspected as text.
vi.mock('jspdf', async (original) => {
  const Real = (await original<typeof import('jspdf')>()).default;
  class Uncompressed extends Real {
    constructor(options: ConstructorParameters<typeof Real>[0]) {
      super({ ...(typeof options === 'object' ? options : {}), compress: false });
    }
  }
  return { default: Uncompressed, jsPDF: Uncompressed };
});
vi.mock('./fichaFonts', async (original) => ({ ...(await original<typeof import('./fichaFonts')>()), ensureFichaFonts: vi.fn().mockResolvedValue(false) }));
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockRejectedValue(new Error('QR unavailable')) } }));
vi.mock('./media', async (original) => ({ ...(await original<typeof import('./media')>()), fetchPdfImage: vi.fn().mockResolvedValue(null) }));

import { generateProjectDossierPdf, generateProjectMasterplanPdf } from './projectKit';

const project = { id: 'p1', slug: 'reserva-huellelhue', name: 'Proyecto de prueba', latitude: -34.9, longitude: -71.9 };
const lots = Array.from({ length: 70 }, (_, i) => ({
  lot_number: String(i + 1),
  status: i % 10 === 0 ? 'sold' : 'available',
  price: 19990000 + i * 1000,
  area: 5000,
  polygon: [[-71.96, -34.99 + i * 0.0004], [-71.955, -34.99 + i * 0.0004], [-71.955, -34.9896 + i * 0.0004], [-71.96, -34.9896 + i * 0.0004]],
}));

const readBlob = (blob: Blob | undefined) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(blob!);
  });

const shown = (pdf: string) => [...pdf.matchAll(/\((.*?)\) Tj/g)].map((m) => m[1]);

describe('dossier comercial (identidad de marca)', () => {
  it('lista TODAS las parcelas disponibles, no una muestra, y excluye las vendidas', async () => {
    const pdf = await readBlob(await generateProjectDossierPdf(project, lots, { output: 'blob' }));
    const strings = shown(pdf);
    expect(strings.some((t) => t.startsWith('Parcelas disponibles') && t.endsWith('63'))).toBe(true);
    // Precio único de cada parcela disponible (lote n → 19.990.000 + (n-1)·1.000).
    expect(strings).toContain('$20.024.000'); // lote 35
    expect(strings).toContain('$20.059.000'); // lote 70
    expect(strings).not.toContain('$20.000.000'); // lote 11 está vendido
  });

  it('enlaza el agendamiento desde la portada y el cierre', async () => {
    const pdf = await readBlob(await generateProjectDossierPdf(project, lots, { output: 'blob' }));
    const links = pdf.match(/\/agendar\?source=dossier-huellelhue/g) ?? [];
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('el plano vectorial dibuja los números de las parcelas disponibles sin satélite', async () => {
    const pdf = await readBlob(await generateProjectMasterplanPdf(project, lots, { output: 'blob' }));
    const strings = shown(pdf);
    expect(strings).toContain('Disponible · 63');
    expect(strings).toContain('Vendida · 7');
    expect(pdf).toContain('Deslindes referenciales');
  });
});
