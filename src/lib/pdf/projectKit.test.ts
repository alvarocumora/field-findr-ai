import { describe, expect, it, vi } from 'vitest';
import { summarize, projectPath, projectActions, generateProjectDossierPdf } from './projectKit';
import { createFichaDoc } from './fichaShell';
import { safePdfLink, fittedImage } from './media';

vi.mock('./fichaFonts', async (original) => ({ ...(await original<typeof import('./fichaFonts')>()), ensureFichaFonts: vi.fn().mockResolvedValue(false) }));
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockRejectedValue(new Error('QR unavailable')) } }));
vi.mock('./media', async (original) => ({ ...(await original<typeof import('./media')>()), fetchPdfImage: vi.fn().mockResolvedValue(null) }));

const project = { id: 'p1', slug: 'reserva-huellelhue', name: 'Proyecto de prueba', latitude: -34.9, longitude: -71.9 };

describe('commercial PDF integrity', () => {
  it('does not advertise unknown, sold, reserved or non-finite prices as available', () => {
    const stats = summarize([
      { status: 'sold', price: 1 }, { status: 'reserved', price: 2 },
      { status: null, price: 3 }, { status: 'available', price: Infinity },
      { status: 'available', price: 19990000, area: 5000 },
    ]);
    expect(stats.available).toBe(2);
    expect(stats.priceMin).toBe(19990000);
    expect(stats.priceMax).toBe(19990000);
    expect(summarize([{ status: 'sold', price: 1 }]).priceMin).toBeNull();
  });

  it('uses canonical URLs and only emits configured contact actions and valid coordinates', () => {
    expect(projectPath(project)).toBe('/huellelhue');
    const actions = projectActions(project);
    expect(actions).toHaveLength(2);
    expect(actions[1].url).toContain('query=-34.9,-71.9');
    expect(projectActions({ ...project, latitude: NaN, contact: { whatsapp: 'abc', email: 'bad' } })).toHaveLength(1);
    expect(safePdfLink('javascript:alert(1)', 'https://ofertaterrenos.com')).toBeNull();
    expect(safePdfLink('/huellelhue', 'https://ofertaterrenos.com')).toBe('https://ofertaterrenos.com/huellelhue');
  });

  it('creates actual PDF link annotations and paginates long text without dropping the end', () => {
    const f = createFichaDoc();
    const text = vi.spyOn(f.doc, 'text');
    f.paragraph(('Descripción larga del proyecto. ').repeat(600) + 'FIN DEL CONTENIDO');
    expect(f.doc.getNumberOfPages()).toBeGreaterThan(2);
    expect(text.mock.calls.map(call => String(call[0])).join(' ')).toContain('FIN DEL CONTENIDO');
    f.actions([{ label: 'Abrir proyecto', url: '/huellelhue' }, { label: 'Unsafe', url: 'javascript:alert(1)' }]);
    const pdf = f.doc.output();
    expect(pdf).toContain('/Subtype /Link');
    expect(pdf).toContain('/URI (https://ofertaterrenos.com/huellelhue)');
    expect(pdf).not.toContain('javascript:');
  });

  it('fits images proportionally and restores graphics state even if embedding fails', () => {
    const f = createFichaDoc();
    vi.spyOn(f.doc, 'getImageProperties').mockReturnValue({ width: 400, height: 200 } as ReturnType<typeof f.doc.getImageProperties>);
    const add = vi.spyOn(f.doc, 'addImage').mockReturnValue(f.doc);
    const restore = vi.spyOn(f.doc, 'restoreGraphicsState');
    fittedImage(f.doc, 'image', 10, 20, 100, 100);
    expect(add).toHaveBeenCalledWith('image', 10, 45, 100, 50);
    add.mockImplementation(() => { throw new Error('Bad image'); });
    expect(() => fittedImage(f.doc, 'image', 10, 20, 100, 100)).toThrow();
    expect(restore).toHaveBeenCalledTimes(2);
  });

  it('returns a PDF preview even if photos and QR are unavailable, without downloading', async () => {
    const blob = await generateProjectDossierPdf({ ...project, images: ['/unavailable.webp'] }, [{ status: 'available', price: 19990000, area: 5000 }], { output: 'blob' });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob!.type).toBe('application/pdf');
    expect(blob!.size).toBeGreaterThan(1000);
  });
});
