import { test, expect } from '@playwright/test';

test.skip(!process.env.CI, 'La comparación requiere el checkout original en reference/public');

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`Crónica: controles de carrusel y variantes iguales a la versión anterior (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);

    async function capture(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      });
      await expect(page.locator('#pageIndicator')).toHaveText('1 de 1 · Portada');
      return Promise.all([
        page.locator('.carousel-panel').screenshot({ animations: 'disabled' }),
        page.locator('.cronica-variant-panel').screenshot({ animations: 'disabled' }),
      ]);
    }

    const original = await capture('http://127.0.0.1:4174/cronica-dev/');
    const migrated = await capture('http://127.0.0.1:4173/cronica/');
    expect(migrated[0].equals(original[0]), 'carrusel idéntico').toBe(true);
    expect(migrated[1].equals(original[1]), 'selector de variantes idéntico').toBe(true);
  });
}
