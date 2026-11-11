import { test, expect } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';

const products = [
  { route: '/cronica/', title: /Crónica/i },
  { route: '/bae/', title: /BAE Negocios/i },
  { route: '/diarioshow/', title: /Diario Show/i },
];

async function loadPage(page, route) {
  const failures = [];
  page.on('pageerror', e => failures.push('JavaScript: ' + e.message));
  page.on('response', r => {
    if (r.url().startsWith('http://127.0.0.1:4173/') && r.status() >= 400) {
      failures.push('HTTP ' + r.status() + ': ' + r.url());
    }
  });
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await page.waitForLoadState('load');
  return failures;
}

async function uploadSyntheticImage(page) {
  // Fixture generated locally by the browser; no remote photo dependencies.
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 480, 640);
    gradient.addColorStop(0, '#1188bb');
    gradient.addColorStop(1, '#e07b4c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 480, 640);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#file').setInputFiles({
    name: 'qa-imagen.png',
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64'),
  });
  // Los tres editores limpian input.value tras consumir la foto: verificar el efecto real.
  await expect.poll(() => page.locator('#photoDropzone').evaluate(el => el.hidden)).toBe(true);
}

async function verifyPng(download) {
  const file = await download.path();
  expect(file).toBeTruthy();
  const png = await readFile(file);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(1080);
  expect(png.readUInt32BE(20)).toBe(1440);
  expect(png.byteLength).toBeGreaterThan(1000);
}

test('El dashboard tiene solo tres generadores y navega a sus rutas', async ({ page }) => {
  const errors = await loadPage(page, '/');
  for (const product of products) {
    await expect(page.locator('a[href=".' + product.route + '"]').first()).toBeVisible();
  }
  await page.locator('a[href="./cronica/"]').first().click();
  await expect(page).toHaveURL(/\/cronica\/$/);
  await expect(page.locator('#art')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Crónica: edición, carga de fotografía, carrusel y PNG 1080×1440', async ({ page }) => {
  const errors = await loadPage(page, '/cronica/');
  await expect(page.locator('#art')).toBeVisible();
  await page.locator('#headline').fill('Prueba editorial de Crónica');
  await uploadSyntheticImage(page);
  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toContainText('2 de 2');
  await page.locator('#download').click();
  await expect(page.locator('#exportDialog')).toBeVisible();
  const current = page.waitForEvent('download');
  await page.locator('#exportCurrent').click();
  await verifyPng(await current);
  await page.locator('#download').click();
  const downloads = [];
  page.on('download', d => downloads.push(d));
  await page.locator('#exportAll').click();
  await expect.poll(() => downloads.length, { timeout: 30000 }).toBe(2);
  for (const d of downloads) await verifyPng(d);
  expect(errors).toEqual([]);
});

test('BAE: variantes, carga de imagen y exportación PNG', async ({ page }) => {
  const errors = await loadPage(page, '/bae/');
  await expect(page.locator('#art')).toBeVisible();
  await page.locator('#headline').fill('Prueba editorial BAE');
  await page.locator('button[data-theme="white"]').click();
  await expect(page.locator('button[data-theme="white"]')).toHaveAttribute('aria-pressed', 'true');
  await uploadSyntheticImage(page);
  const download = page.waitForEvent('download', { timeout: 30000 });
  await page.locator('#download').click();
  await verifyPng(await download);
  expect(errors).toEqual([]);
});

test('Diario Show: variante de cita, fotografía y exportación PNG', async ({ page }) => {
  const errors = await loadPage(page, '/diarioshow/');
  await expect(page.locator('#art')).toBeVisible();
  await page.locator('button[data-variant="quote"]').click();
  await expect(page.locator('button[data-variant="quote"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#headline').fill('Prueba de cita editorial');
  await uploadSyntheticImage(page);
  const download = page.waitForEvent('download', { timeout: 30000 });
  await page.locator('#download').click();
  await verifyPng(await download);
  expect(errors).toEqual([]);
});

test('Vistas móviles 390px: apertura y capturas visuales sin errores JavaScript', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mkdir('tests/artifacts', { recursive: true });
  for (const product of products) {
    const errors = await loadPage(page, product.route);
    // Diario Show abre el panel Formato por defecto: mostrar su pestaña de vista previa.
    if (product.route === '/diarioshow/') {
      await page.locator('.ds-mobile-tabs [data-tab="preview"]').click();
    }
    await expect(page.locator('#art')).toBeVisible();
    await page.screenshot({ path: 'tests/artifacts/' + product.route.replaceAll('/', '') + '-mobile.png', fullPage: true, animations: 'disabled' });
    expect(errors, product.route).toEqual([]);
  }
});
