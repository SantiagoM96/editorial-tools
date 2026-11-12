import { test, expect } from '@playwright/test';

test.skip(!process.env.CI, 'La comparación usa el código original fijado en reference/public');

for (const width of [1440, 390]) {
  test(`Crónica: controles de tipografía sin regresión visual a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });

    async function screenshot(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      if (width === 390 && url.includes('4173')) await page.getByRole('tab', { name: 'Formato' }).click();
      await page.evaluate(async () => { await document.fonts.ready; });
      // El HTML original marcaba izquierda, aunque el Canvas comenzaba centrado.
      // Comparar estados SEMÁNTICAMENTE equivalentes y no el aria-pressed heredado.
      await page.locator('#alignCenter').click();
      await expect(page.locator('#alignCenter')).toHaveAttribute('aria-pressed', 'true');
      const element = page.locator('.cronica-format-row');
      const metrics = await element.evaluate(node => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          rect: [rect.x, rect.y, rect.width, rect.height].map(n => Number(n.toFixed(3))),
          css: {
            display: style.display, gap: style.gap, gridTemplateColumns: style.gridTemplateColumns,
            alignItems: style.alignItems, font: style.font, color: style.color,
          },
        };
      });
      return { image: await element.screenshot({ animations: 'disabled' }), metrics };
    }

    const baseline = await screenshot('http://127.0.0.1:4174/cronica-dev/');
    const updated = await screenshot('http://127.0.0.1:4173/cronica/');
    let difference = null;
    if (!updated.image.equals(baseline.image)) {
      difference = await page.evaluate(async ({ oldImage, newImage }) => {
        async function decode(encoded) {
          const img = new Image();
          img.src = 'data:image/png;base64,' + encoded;
          await img.decode();
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw Error('No Canvas de comparación');
          ctx.drawImage(img, 0, 0);
          return { width: img.width, height: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
        }
        const a = await decode(oldImage), b = await decode(newImage);
        if (a.width !== b.width || a.height !== b.height) {
          return { before: [a.width, a.height], after: [b.width, b.height] };
        }
        let count = 0, maxDelta = 0, minX = a.width, maxX = 0, minY = a.height, maxY = 0;
        for (let offset = 0; offset < a.data.length; offset += 4) {
          const delta = Math.max(...[0, 1, 2, 3].map(channel => Math.abs(a.data[offset + channel] - b.data[offset + channel])));
          if (!delta) continue;
          const x = (offset / 4) % a.width, y = Math.floor(offset / 4 / a.width);
          count++; maxDelta = Math.max(maxDelta, delta);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        return { width: a.width, height: a.height, count, maxDelta, minX, maxX, minY, maxY };
      }, { oldImage: baseline.image.toString('base64'), newImage: updated.image.toString('base64') });
      console.log('TIPOGRAFIA-DIFF', JSON.stringify({ width, difference, source: baseline.metrics, destination: updated.metrics }));
    }
    // La tarjeta de foto aprobada cambia la posición vertical posterior
    // (en desktop se midieron +5px), no la geometría ni estilos de tipografía.
    expect(updated.metrics.rect[0], 'Misma posición horizontal').toBe(baseline.metrics.rect[0]);
    expect(updated.metrics.rect.slice(2), 'Mismo ancho y alto').toEqual(baseline.metrics.rect.slice(2));
    expect(updated.metrics.css, 'Misma distribución y tipografía').toEqual(baseline.metrics.css);
    if (width === 390 && difference) {
      // La nueva distribución de la identidad añade antialiasing marginal; delta <=3 RGB,
      // exclusivamente en las últimas tres filas del borde inferior.
      // Una variación fuera de esa franja sigue fallando la regresión visual.
      expect(difference.count, 'Solo antialiasing de borde inferior').toBeLessThanOrEqual(70);
      expect(difference.maxDelta, 'Máximo 3 niveles RGB').toBeLessThanOrEqual(3);
      expect(difference.minY, 'No debe cambiar el interior de los controles').toBeGreaterThanOrEqual(difference.height - 4);
      expect(difference.maxY, 'Solo el borde inferior').toBeLessThanOrEqual(difference.height - 2);
    } else {
      expect(updated.image.equals(baseline.image), 'Controles tipográficos pixel-perfect').toBe(true);
    }
  });
}
