import { expect, test } from '@playwright/test';

test.skip(!process.env.CI, 'Se necesita el checkout fijado del origen');

for (const width of [1440, 390]) {
  test(`Crónica: logos, fotografía y zoom sin regresión de interfaz a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    async function capture(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
      });
      return Promise.all([
        page.locator('.logo-control-field').screenshot({ animations: 'disabled' }),
        page.locator('.control-field:has(> #file)').screenshot({ animations: 'disabled' }),
        page.locator('.preview-zoom').screenshot({ animations: 'disabled' }),
      ]);
    }
    const old = await capture('http://127.0.0.1:4174/cronica-dev/');
    const current = await capture('http://127.0.0.1:4173/cronica/');
    for (let index = 0; index < old.length; index++) {
      expect(current[index]?.equals(old[index]), `Control ${index} visualmente idéntico a ${width}px`).toBe(true);
    }
  });
}
