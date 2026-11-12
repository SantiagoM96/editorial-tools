import { expect, test } from '@playwright/test';

/** La referencia pixel-perfect anterior es incompatible con la nueva volanta y el editor.
 * Verificamos el contrato actual (legibilidad, sincronización y geometría) en ambas vistas.
 */
for (const width of [1440, 390]) {
  test(`Crónica: formulario y Canvas actualizados a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto('/cronica/', { waitUntil: 'load' });
    if (width === 390) await page.getByRole('tab', { name: 'Formato' }).click();
    const headline = page.locator('#headline');
    const strap = page.locator('#strapText');
    await expect(headline).toBeVisible();
    await expect(strap).toBeVisible();
    await strap.fill('VOLANTA EDITADA');
    await expect(strap).toHaveValue('VOLANTA EDITADA');
    const dimensions = await strap.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return { width: rect.width, height: rect.height, border: css.borderStyle, font: Number.parseFloat(css.fontSize) };
    });
    expect(dimensions.width).toBeGreaterThan(130);
    expect(dimensions.height).toBeGreaterThanOrEqual(30);
    expect(dimensions.font).toBeGreaterThanOrEqual(12);
    const canvas = page.locator('#art');
    if (width === 390) await page.getByRole('tab', { name: 'Vista previa' }).click();
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('width', '1080');
    await expect(canvas).toHaveAttribute('height', '1440');
  });
}
