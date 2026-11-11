import { test, expect } from '@playwright/test';

test.skip(!process.env.CI || process.env.EDITORIAL_DEPLOY_SMOKE === '1',
  'Requiere el commit fijado de mlz en reference/public');

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
    // Se limita la paridad pixel-perfect a los productos editoriales: las
    // etiquetas/introducciones de DEV y PROD cambian intencionalmente por ambiente.
    const baseline = await page.locator('.grid').screenshot({ animations: 'disabled' });
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    const actual = await page.locator('.grid').screenshot({ animations: 'disabled' });
    expect(actual.equals(baseline), 'Tarjetas idénticas al diseño original').toBe(true);
  });
}
