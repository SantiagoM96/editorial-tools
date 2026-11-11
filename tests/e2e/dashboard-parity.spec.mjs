import { test, expect } from '@playwright/test';

test.skip(!process.env.CI || process.env.EDITORIAL_DEPLOY_SMOKE === '1',
  'Requiere el commit fijado de mlz en reference/public');

async function captureProductGeometry(page) {
  return page.locator('.grid').evaluate(grid => {
    const gridRect = grid.getBoundingClientRect();
    return [...grid.querySelectorAll('.product')].map(card => {
      const cardRect = card.getBoundingClientRect();
      const imageRect = card.querySelector('img').getBoundingClientRect();
      const style = getComputedStyle(card);
      const round = value => Math.round(value * 100) / 100;
      return {
        x: round(cardRect.x - gridRect.x),
        y: round(cardRect.y - gridRect.y),
        width: round(cardRect.width),
        height: round(cardRect.height),
        background: style.backgroundColor,
        border: style.border,
        radius: style.borderRadius,
        padding: style.padding,
        logoWidth: round(imageRect.width),
        logoHeight: round(imageRect.height),
      };
    });
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test('Dashboard: tarjetas sin regresiones visuales ' + viewport.width + 'px', async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:4174/dev/', { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    // Los avisos/copy del entorno modifican la altura de la introducción y la
    // coordenada absoluta de las tarjetas, especialmente en mobile.
    // Se compara el diseño del producto, no su posición debajo de textos cambiados.
    const baselineGeometry = await captureProductGeometry(page);
    const baselineImage = viewport.width === 1440
      ? await page.locator('.grid').screenshot({ animations: 'disabled' })
      : null;

    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    const actualGeometry = await captureProductGeometry(page);
    expect(actualGeometry, 'Geometría, colores, bordes y logos de tarjetas').toEqual(baselineGeometry);
    if (baselineImage) {
      const actual = await page.locator('.grid').screenshot({ animations: 'disabled' });
      expect(actual.equals(baselineImage), 'Tarjetas pixel-perfect en desktop').toBe(true);
    }
  });
}
