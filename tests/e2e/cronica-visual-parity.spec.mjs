import { test, expect } from '@playwright/test';

/** La navegación de páginas es ahora un componente independiente sobre la vista previa,
 * de modo que las medidas del antiguo botón 32px no son un baseline válido. */
for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`Crónica: controles y miniaturas accesibles a ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/cronica/', { waitUntil: 'load' });
    await expect(page.locator('#pageIndicator')).toHaveText('1 de 1 · Portada');
    await expect(page.locator('#cronica-pages-root .carousel-page-thumb').first()).toBeVisible();
    const pageCard = page.locator('#cronica-pages-root .carousel-page-thumb').first();
    await expect(pageCard).toHaveAttribute('aria-current', 'page');
    const bounds = await pageCard.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.width).toBeGreaterThanOrEqual(50);
    expect(bounds.height).toBeGreaterThanOrEqual(75);
    if (viewport.width === 390) await page.getByRole('tab', { name: 'Formato' }).click();
    const variants = page.locator('.cronica-variant-options');
    const cover = variants.locator('[data-page-variant="cover"]');
    const internal = variants.locator('[data-page-variant="internal"]');
    const blank = variants.locator('[data-page-variant="blank"]');
    await expect(cover).toBeVisible();
    await expect(internal).toBeVisible();
    await expect(blank).toBeVisible();
    await expect(cover).toHaveAttribute('aria-pressed', 'true');
    await blank.click();
    await expect(blank).toHaveAttribute('aria-pressed', 'true');
    await internal.click();
    await expect(internal).toHaveAttribute('aria-pressed', 'true');
    await cover.click();
    await expect(cover).toHaveAttribute('aria-pressed', 'true');
  });
}
