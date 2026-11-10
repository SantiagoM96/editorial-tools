import { test, expect } from '@playwright/test';

test.skip(!process.env.CI, 'La comparación usa el código original fijado en reference/public');

for (const width of [1440, 390]) {
  test(`Crónica: controles de tipografía sin regresión visual a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });

    async function screenshot(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      await page.evaluate(async () => { await document.fonts.ready; });
      return page.locator('.cronica-format-row').screenshot({ animations: 'disabled' });
    }

    const baseline = await screenshot('http://127.0.0.1:4174/cronica-dev/');
    const updated = await screenshot('http://127.0.0.1:4173/cronica/');
    expect(updated.equals(baseline), 'Controles tipográficos pixel-perfect').toBe(true);
  });
}
