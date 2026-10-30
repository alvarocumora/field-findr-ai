import type { ResolvedConfig } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { projectSocialPlugin } from '../../scripts/project-social-plugin';

const id = 'b4363fda-e99f-400d-ae95-2cbc8244b770';
const project = { id, slug: 'test-project', name: 'Paisaje real', status: 'active', images: ['https://example.com/photo.jpg'] };
let temp: string | undefined;
afterEach(async () => {
  vi.unstubAllGlobals();
  if (temp) await rm(temp, { recursive: true, force: true });
});

async function setup() {
  temp = await mkdtemp(join(tmpdir(), 'project-social-test-'));
  await mkdir(join(temp, 'dist'));
  await writeFile(join(temp, 'dist/index.html'), '<head><title>Generic</title></head><body><script src="/assets/app.js"></script></body>');
  const plugin = projectSocialPlugin('https://example.supabase.co', 'public-test-key');
  (plugin.configResolved as (config: ResolvedConfig) => void)({ root: temp, build: { outDir: 'dist' } } as ResolvedConfig);
  return () => (plugin.closeBundle as () => Promise<void>)();
}

describe('static social preview build', () => {
  it('exports readable and UUID routes using only public inventory', async () => {
    const run = await setup();
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(
      url.includes('/rpc/') ? [{ status: 'available', price: 19000000 }, { status: 'sold', price: 1 }]
        : [project, { ...project, id: 'private', status: 'draft' }],
    )));
    vi.stubGlobal('fetch', fetchMock);
    await run();
    const html = await readFile(join(temp!, 'dist/p/test-project/index.html'), 'utf8');
    expect(html).toContain('Paisaje real');
    expect(html).toContain('1 parcela disponible');
    expect(html).toContain('19.000.000');
    expect(html).toContain('https://example.com/photo.jpg');
    expect(await readFile(join(temp!, `dist/proyecto/${id}/index.html`), 'utf8')).toBe(html);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('status=eq.active');
    const report = JSON.parse(await readFile(join(temp!, 'dist/project-previews.json'), 'utf8'));
    expect(report.routes).toEqual(expect.arrayContaining([`/proyecto/${id}`, '/p/test-project']));
    expect(report.routes).toContain('/valle-hualane');
    expect(report.routes).toContain('/valle-hualane/tour');
    expect(report.routes).toContain('/valle-hualane/plano');
  });
  it('fails the build on API errors instead of publishing misleading generic cards', async () => {
    const run = await setup();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unavailable', { status: 503 })));
    await expect(run()).rejects.toThrow('503');
  });
  it('renders a share card from real project data for a project with no photo and no curated card', async () => {
    const run = await setup();
    const bare = { id, slug: 'no-photo-project', name: 'Proyecto Sin Fotos', status: 'active' };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
      url.includes('/rpc/') ? [{ status: 'available', price: 19000000 }] : [bare],
    ))));
    await run();
    const html = await readFile(join(temp!, 'dist/p/no-photo-project/index.html'), 'utf8');
    expect(html).toContain('https://ofertaterrenos.com/social/no-photo-project-og.jpg');
    const image = await readFile(join(temp!, 'dist/social/no-photo-project-og.jpg'));
    expect(image.subarray(0, 2).toString('hex')).toBe('ffd8');
  });
});
