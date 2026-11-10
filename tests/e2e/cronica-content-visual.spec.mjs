import { expect, test } from '@playwright/test';

test.skip(!process.env.CI, 'La comparación visual necesita el checkout del original');

for (const width of [1440, 390]) {
  test(`Crónica: campos de contenido pixel-perfect a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });

    async function capture(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      await page.evaluate(async () => { await document.fonts.ready; });
      return Promise.all([
        page.locator('.switch-row').screenshot({ animations: 'disabled' }),
        page.locator('#strapField').screenshot({ animations: 'disabled' }),
        page.locator('.control-field:has(> #headline)').screenshot({ animations: 'disabled' }),
        page.locator('.size-field').screenshot({ animations: 'disabled' }),
      ]);
    }

    const old = await capture('http://127.0.0.1:4174/cronica-dev/');
    const updated = await capture('http://127.0.0.1:4173/cronica/');
    expect(old.length).toBe(updated.length);
    for (let i = 0; i < old.length; i++) {
      expect(updated[i]?.equals(old[i]), `Control ${i} idéntico en ${width}px`).toBe(true);
    }
  });
}
