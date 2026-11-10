import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

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
    if (!updated[1]?.equals(old[1])) {
      await mkdir('tests/artifacts/content-diagnostics', { recursive: true });
      await writeFile(`tests/artifacts/content-diagnostics/strap-original-${width}.png`, old[1]);
      await writeFile(`tests/artifacts/content-diagnostics/strap-react-${width}.png`, updated[1]);
      console.log('Campo volanta: capturas originales y React guardadas para analizar píxeles, ancho y altura:', {
        width,
        original: [old[1]?.readUInt32BE(16), old[1]?.readUInt32BE(20)],
        migrated: [updated[1]?.readUInt32BE(16), updated[1]?.readUInt32BE(20)],
      });
    }
    for (let i = 0; i < old.length; i++) {
      expect(updated[i]?.equals(old[i]), `Control ${i} idéntico en ${width}px`).toBe(true);
    }
  });
}
