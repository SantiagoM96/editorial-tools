import { expect, test } from '@playwright/test';

test('Crónica: pestañas y edición contextual mobile conservan estado por página', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cronica/', { waitUntil: 'load' });
  await expect(page.getByRole('tab', { name: 'Vista previa' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#art')).toBeVisible();
  await page.locator('#headlineMobile').fill('Texto editado desde la vista previa');
  await expect(page.locator('#headline')).toHaveValue('Texto editado desde la vista previa');
  await page.locator('#sizeMobile').fill('72');
  await expect(page.locator('#size')).toHaveValue('72');
  await page.getByRole('tab', { name: 'Formato' }).click();
  await expect(page.locator('#headline')).toBeVisible();
  await expect(page.locator('#headline')).toHaveValue('Texto editado desde la vista previa');
  await page.locator('#addPage').click();
  await page.locator('#headline').fill('Texto de página dos');
  await page.getByRole('tab', { name: 'Vista previa' }).click();
  await expect(page.locator('#headlineMobile')).toHaveValue('Texto de página dos');
  await page.getByRole('tab', { name: 'Formato' }).click();
  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await page.getByRole('tab', { name: 'Vista previa' }).click();
  await expect(page.locator('#headlineMobile')).toHaveValue('Texto editado desde la vista previa');
  await expect(page.locator('#photoZoom')).toHaveAttribute('min', '100');
  await expect(page.locator('#photoZoom')).toHaveAttribute('max', '300');
  const download = page.locator('#download');
  await download.click();
  await expect(page.locator('#exportDialog')).toBeVisible();
  await page.locator('#exportClose').click();
});

test('Crónica: pestañas se desactivan en escritorio y no bloquean controles', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  await expect(page.locator('#headline')).toBeVisible();
  await expect(page.locator('#art')).toBeVisible();
  await expect(page.locator('.cronica-mobile-tabs')).toBeHidden();
});
