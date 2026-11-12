import { expect, test } from '@playwright/test';

test('Crónica Andy: snapshot funcional con variantes, edición visual y carrusel', async ({ page }) => {
  await page.goto('/cronica-latest/index.html?onboarding=off', { waitUntil: 'load' });
  await expect(page.locator('#art')).toBeVisible();
  await expect(page.locator('.editor-panel .cronica-variant-option[data-page-variant="blank"]').first()).toBeVisible();
  await page.locator('.editor-panel .cronica-variant-option[data-page-variant="blank"]').first().click();
  await expect(page.locator('.editor-panel .cronica-variant-option[data-page-variant="blank"]').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#status')).toContainText('Sin diseño');
  await page.locator('.editor-panel .cronica-variant-option[data-page-variant="cover"]').first().click();
  await expect(page.locator('.editor-panel .cronica-variant-option[data-page-variant="cover"]').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.cronica-rich-headline').first()).toBeVisible();
  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toContainText('2 de 2');
  await expect(page.locator('#art')).toBeVisible();
});
