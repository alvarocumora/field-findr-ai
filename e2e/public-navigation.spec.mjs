import { expect, test } from '@playwright/test';

// Public routes only: no privileged login, Supabase mutation, reservation,
// payment, or dependency on live prices. The local production bundle is served
// by Vite preview and is tested in actual Chromium at mobile/desktop widths.
test('portada lleva al catálogo de proyectos en venta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Ver proyectos en venta', exact: true }).click();
  await expect(page).toHaveURL(/#proyectos-en-venta$/);
  await expect(page.locator('#proyectos-en-venta')).toBeVisible();
});

test('portada → explorador mantiene tipo y presupuesto', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tu próxima parcela está aquí.' })).toBeVisible();
  await page.getByLabel('Tipo de terreno', { exact: true }).selectOption('parcela_rural');
  await page.getByLabel('Presupuesto CLP', { exact: true }).selectOption('40000000');
  await page.getByRole('button', { name: 'Buscar parcelas y terrenos', exact: true }).click();
  await expect(page).toHaveURL(/\/explorar\?type=parcela_rural&currency=CLP&clpMax=40000000/);
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
  await expect(page.getByRole('heading', { level: 1, name: /Valle Escondido/i })).toBeVisible();
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

test('Terrain View distingue inventario no verificable de stock vacío y no ofrece reserva', async ({ page }) => {
  const projectId = '11111111-2222-4333-8444-555555555555';
  await page.route('**/rest/v1/projects?*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: projectId, name: 'Proyecto QA Territorial', slug: 'proyecto-qa-territorial',
      city: 'Licantén', region: 'Maule', location: 'Licantén, Maule',
      latitude: -34.9, longitude: -71.8, legal_documents: [],
      plan_images: [], images: [], reservation_deposit: 500000,
    }),
  }));
  await page.route('**/rest/v1/rpc/get_public_lots*', route => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ code: 'PGRST500', message: 'temporary outage' }),
  }));
  await page.goto(`/proyecto/${projectId}/experiencia`);
  await expect(page.getByRole('heading', { name: /Explora el proyecto/i })).toBeVisible();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('No pudimos verificar el inventario', { timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Reintentar inventario' })).toBeVisible();
  await expect(page.getByText('No hay inventario verificado para dibujar el masterplan')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reservar', exact: true })).toHaveCount(0);
});

test('rutas privadas sin sesión regresan a autenticación sin perder contexto', async ({ page }) => {
  const destinations = [
    '/comprador/inicio?tab=favoritos#guardados',
    '/asesor/projects?tab=inventario#lotes',
    '/admin/dashboard?view=operaciones#resumen',
  ];
  for (const destination of destinations) {
    await page.goto(destination);
    await expect(page).toHaveURL(/\/auth\?redirect=/, { timeout: 20_000 });
    const current = new URL(page.url());
    expect(current.searchParams.get('redirect'), `destino tras login: ${destination}`)
      .toBe(destination);
  }
});

test('rutas comerciales requieren sesión y retienen filtros del módulo elegido', async ({ page }) => {
  const targets = [
    '/asesor/leads?status=nuevo#tabla',
    '/asesor/projects?view=map#inventario',
    '/asesor/visitas?tab=upcoming#agenda',
    '/asesor/reservations?status=pending_payment#reservas',
  ];
  for (const target of targets) {
    await page.goto(target);
    await expect(page).toHaveURL(/\/auth\?redirect=/, { timeout: 20_000 });
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(target);
  }
});


test('buscador y CTA de portada quedan dentro del primer viewport', async ({ page }) => {
  await page.goto('/');
  const search = page.locator('#hero-search');
  const submit = page.getByRole('button', { name: 'Buscar parcelas y terrenos', exact: true });
  await expect(search).toBeVisible();
  await expect(submit).toBeVisible();
  const viewport = page.viewportSize();
  for (const element of [search, submit]) {
    const box = await element.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('enlace comercial espera inventario y abre solo el formulario de la parcela elegida', async ({ page }) => {
  const projectId = '11111111-2222-4333-8444-555555555555';
  const lotId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  await page.route('**/rest/v1/projects?*', async route => {
    await new Promise(resolve => setTimeout(resolve, 350));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: projectId, user_id: null, name: 'Proyecto QA Reserva', slug: 'qa-reserva', status: 'active',
      city: 'Licantén', region: 'Maule', location: 'Licantén', legal_documents: [], images: [], plan_images: [], reservation_deposit: 500000,
    }) });
  });
  await page.route('**/rest/v1/rpc/get_public_lots*', async route => {
    await new Promise(resolve => setTimeout(resolve, 350));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: lotId, project_id: projectId, lot_number: '12', name: 'Parcela QA', status: 'available', area: 5000, price: 19990000 },
    ]) });
  });
  await page.goto(`/proyecto/${projectId}?tab=lots&reserva=1&lote=${lotId}&ref=qa-broker`);
  const form = page.getByRole('dialog');
  await expect(form.getByRole('heading', { name: /Reservar con Depósito/ })).toBeVisible();
  await expect(form.getByLabel('Nombre', { exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/reserva=1/);
  await expect(page).toHaveURL(new RegExp(`lote=${lotId}`));
  await expect(page).toHaveURL(/ref=qa-broker/);
  const box = await form.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Mapa de lotes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
