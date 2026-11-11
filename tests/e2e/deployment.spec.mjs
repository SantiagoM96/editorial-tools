import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.skip(process.env.EDITORIAL_DEPLOY_SMOKE !== '1', 'Smoke del artefacto combinado de GitHub Pages');

const prefix = '/editorial-tools/';
const environments = [
  { id: 'production', path: prefix },
  { id: 'development', path: prefix + 'dev/' },
];
const editors = ['cronica', 'bae', 'diarioshow'];

test('manifiesto: dos revisiones independientes, cada una en su ruta', async ({ request }) => {
  const release = await (await request.get(prefix + 'editorial-release.json')).json();
  for (const env of environments) {
    const metaResponse = await request.get(env.path + 'editorial-deployment.json');
    expect(metaResponse.ok()).toBeTruthy();
    const meta = await metaResponse.json();
    expect(meta.environment).toBe(env.id);
    expect(meta.base).toBe(env.path);
    expect(meta.sha).toBe(release[env.id].sha);
    expect(meta.sha.length).toBeGreaterThan(6);
  }
});

for (const env of environments) {
  test(env.id + ': dashboard, navegación y versión correcta', async ({ page }) => {
    const response = await page.goto(env.path, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Elegí el producto que vas a editar' })).toBeVisible();
    await expect(page.locator('meta[name="editorial-environment"]')).toHaveAttribute('content', env.id);
    const badges = page.locator('#editorial-dev-badge');
    if (env.id === 'development') {
      await expect(badges).toContainText('ENTORNO DE DESARROLLO');
    } else {
      await expect(badges).toHaveCount(0);
      await expect(page.getByText('ENTORNO DE DESARROLLO')).toHaveCount(0);
    }
    for (const slug of editors) {
      await expect(page.locator('a[href="./' + slug + '/"]').first()).toBeVisible();
    }
    await page.locator('a[href="./cronica/"]').first().click();
    await expect(page).toHaveURL(new RegExp(env.path.replaceAll('/', '\\/') + 'cronica\\/$'));
    await expect(page.locator('#art')).toBeVisible();
  });

  for (const slug of editors) {
    test(env.id + ': ' + slug + ', Canvas, assets y exportación PNG', async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push('JS: ' + error.message));
      page.on('response', response => {
        if (response.url().startsWith('http://127.0.0.1:4177/') && response.status() >= 400) {
          errors.push('HTTP ' + response.status() + ': ' + response.url());
        }
      });
      const url = env.path + slug + '/' + (slug === 'diarioshow' ? '?onboarding=off' : '');
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      await expect(page.locator('#art')).toBeVisible();
      await expect(page.locator('meta[name="editorial-environment"]')).toHaveAttribute('content', env.id);
      const badge = page.locator('#editorial-dev-badge');
      await expect(badge).toHaveCount(env.id === 'development' ? 1 : 0);
      // Fixture generada en el navegador para evitar imágenes o servicios externos.
      const base64 = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 480; canvas.height = 640;
        const context = canvas.getContext('2d');
        context.fillStyle = '#157fa9';
        context.fillRect(0, 0, 480, 640);
        return canvas.toDataURL('image/png').split(',')[1];
      });
      await page.locator('#file').setInputFiles({
        name: 'prueba-entorno.png', mimeType: 'image/png',
        buffer: Buffer.from(base64, 'base64'),
      });
      await expect.poll(() => page.locator('#photoDropzone').evaluate(element => element.hidden)).toBe(true);
      // Crónica con una página descarga directamente. Con dos páginas abre
      // el diálogo: cubrir explícitamente el flujo de carrusel ya probado.
      if (slug === 'cronica') {
        await page.locator('#addPage').click();
        await expect(page.locator('#pageIndicator')).toContainText('2 de 2');
      }
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
      await page.locator('#download').click();
      if (slug === 'cronica') {
        await expect(page.locator('#exportDialog')).toBeVisible();
        await page.locator('#exportCurrent').click();
      }
      const download = await downloadPromise;
      const path = await download.path();
      expect(path).toBeTruthy();
      const bytes = await readFile(path);
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(bytes.readUInt32BE(16)).toBe(1080);
      expect(bytes.readUInt32BE(20)).toBe(1440);
      expect(bytes.byteLength).toBeGreaterThan(1000);
      expect(errors).toEqual([]);
    });
  }

  test(env.id + ': páginas móviles 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const slug of editors) {
      await page.goto(env.path + slug + '/' + (slug === 'diarioshow' ? '?onboarding=off' : ''), { waitUntil: 'load' });
      if (slug === 'diarioshow') await page.locator('#dsMobilePreviewTab').click();
      await expect(page.locator('#art')).toBeVisible();
      await expect(page.locator('#editorial-dev-badge')).toHaveCount(env.id === 'development' ? 1 : 0);
    }
  });
}
