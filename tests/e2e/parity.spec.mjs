import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test.skip(!process.env.CI, 'Requiere checkout del commit de origen en reference/public');

async function stableCanvasFingerprint(page, url) {
  const response = await page.goto(url, { waitUntil: 'load' });
  expect(response?.status(), url).toBe(200);
  await expect(page.locator('#art')).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; });
  let previous = '';
  for (let attempt = 0; attempt < 14; attempt++) {
    await page.waitForTimeout(200);
    const now = await page.locator('#art').evaluate(async canvas => {
      const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, '0')).join('');
    });
    if (now === previous) return now;
    previous = now;
  }
  return previous;
}

for (const product of [
  { name: 'Crónica', original: 'cronica-dev', migrated: 'cronica' },
  { name: 'BAE', original: 'bae-dev', migrated: 'bae' },
  { name: 'Diario Show', original: 'diarioshow-dev', migrated: 'diarioshow' },
]) {
  test(product.name + ': canvas idéntico al commit original', async ({ page }) => {
    const originalUrl = 'http://127.0.0.1:4174/' + product.original + '/';
    const migratedUrl = 'http://127.0.0.1:4173/' + product.migrated + '/' + (product.migrated === 'diarioshow' ? '?onboarding=off' : '');
    const original = await stableCanvasFingerprint(page, originalUrl);
    await mkdir('tests/artifacts/parity', { recursive: true });
    await page.locator('#art').screenshot({
      path: 'tests/artifacts/parity/' + product.migrated + '-original.png',
      animations: 'disabled',
    });
    const migrated = await stableCanvasFingerprint(page, migratedUrl);
    await page.locator('#art').screenshot({
      path: 'tests/artifacts/parity/' + product.migrated + '-migrado.png',
      animations: 'disabled',
    });
    expect(migrated, product.name + ' canvas pixel hash').toBe(original);
  });
}
