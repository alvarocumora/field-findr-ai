import { expect, test } from '@playwright/test';

// Public routes only: no privileged login, Supabase mutation, reservation,
// payment, or dependency on live prices. The local production bundle is served
// by Vite preview and is tested in actual Chromium at mobile/desktop widths.
test('portada → explorador mantiene filtro real de parcela', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Encuentra tierra con/i })).toBeVisible();
  await page.getByRole('link', { name: 'Parcelas', exact: true }).click();
  await expect(page).toHaveURL(/\/explorar\?type=parcela_rural/);
  await expect(page.locator('#contenido-principal')).toBeAttached();
});

test('portada → agendar visita conserva el tipo de solicitud', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Solicitar una visita' }).click();
  await expect(page).toHaveURL(/\/agendar\?meeting_type=visita_terreno/);
  await expect(page.getByRole('heading', { name: 'Solicita una visita a terreno' })).toBeVisible();
  await expect(page.getByLabel(/Qué proyecto o zona quieres visitar/)).toBeVisible();
});

test('landings → agendar preserva proyecto y motivo', async ({ page }) => {
  await page.goto('/agendar?meeting_type=visita_terreno&source=landing&project_id=123&project_name=Valle%20Escondido');
  await expect(page.getByRole('heading', { name: 'Solicita una visita a terreno' })).toBeVisible();
  await expect(page.getByText('Agendando para:')).toBeVisible();
  await expect(page.getByText('Valle Escondido', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Cuéntanos de tu caso')).toHaveValue('Visita a Valle Escondido');
});

test('alias histórico no pierde campaña ni ancla', async ({ page }) => {
  await page.goto('/pricing-loteos?utm_source=qa#planes');
  await expect(page).toHaveURL(/\/planes-loteos\?utm_source=qa#planes$/);
  await expect(page.locator('body')).not.toContainText('Oops! Page not found');
});

test('ruta inexistente ofrece retorno a la exploración', async ({ page }) => {
  await page.goto('/ruta-no-existente-qa-ux');
  await expect(page.getByRole('heading', { name: 'No encontramos esta página.' })).toBeVisible();
  await page.getByRole('link', { name: 'Explorar terrenos' }).click();
  await expect(page).toHaveURL(/\/explorar$/);
  await expect(page.locator('#contenido-principal')).toBeAttached();
});

test('contacto general no finge un envío al backend', async ({ page }) => {
  await page.goto('/contacto');
  await expect(page.getByRole('heading', { name: 'Contáctanos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Preparar correo' })).toBeVisible();
  await expect(page.getByText(/todavía no contamos con envío directo/i)).toBeVisible();
});

test('navegación móvil abre y cierra al cambiar de ruta', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'Solo aplica a navegación móvil');
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menú de navegación' }).click();
  const menu = page.getByRole('dialog', { name: 'Menú de navegación' });
  await expect(menu).toBeVisible();
  await menu.getByRole('link', { name: 'Explorar', exact: true }).click();
  await expect(page).toHaveURL(/\/explorar$/);
  await expect(menu).toBeHidden();
});

test('sin WebGL, el explorador conserva una superficie de contenido', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
      return original.call(this, kind, ...args);
    };
  });
  await page.goto('/explorar?view=map');
  await expect(page.locator('#contenido-principal')).toBeAttached();
  await expect(page.locator('body')).not.toContainText('Oops! Page not found');
});

test('landings premium mantienen identidad y navegación del proyecto', async ({ page }) => {
  await page.goto('/valle-hualane');
  await expect(page.getByRole('heading', { name: 'Valle de Hualañé' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Visitas y consultas' })).toBeVisible();

  await page.goto('/p/valle-escondido-licanten');
  await expect(page.getByRole('heading', { name: /Valle Escondido/i })).toBeVisible();
});

test('portada, contacto y agendamiento no desbordan horizontalmente', async ({ page }) => {
  for (const route of ['/', '/contacto', '/agendar?meeting_type=visita_terreno']) {
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `desborde horizontal en ${route}`).toBeLessThanOrEqual(4);
  }
});
