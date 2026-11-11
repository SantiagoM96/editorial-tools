import { expect, test } from '@playwright/test';

test('BAE: acordeones, pestañas y edición sobre preview comparten estado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/bae/', { waitUntil: 'load' });
  await expect(page.getByRole('tab', { name: 'Vista previa' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#art')).toBeVisible();
  await page.getByRole('tab', { name: 'Formato' }).click();
  const textPanel = page.getByRole('button', { name: 'Textos', exact: true });
  await textPanel.click();
  await expect(page.locator('#headline')).toBeHidden();
  await textPanel.click();
  await page.locator('#headline').fill('Texto BAE original');
  await page.getByRole('button', { name: 'Mostrar texto en mayúsculas' }).click();
  await expect(page.locator('#baeUppercase')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tab', { name: 'Vista previa' }).click();
  await expect(page.locator('#baeHeadlineMobile')).toHaveValue('Texto BAE original');
  await page.locator('#baeHeadlineMobile').fill('Texto BAE sincronizado');
  await expect(page.locator('#headline')).toHaveValue('Texto BAE sincronizado');
  await page.locator('#baeSizeMobile').fill('85');
  await expect(page.locator('#size')).toHaveValue('85');
  await page.locator('#baeQuoteEnabledMobile').check();
  await expect(page.locator('#enableQuote')).toBeChecked();
  await page.locator('#baeQuoteMobile').fill('Cita desde mobile');
  await expect(page.locator('#quote')).toHaveValue('Cita desde mobile');
  const download = page.waitForEvent('download');
  await page.locator('#download').click();
  await download;
  await expect(page.locator('#art')).toBeVisible();
});

test('BAE: plegar un panel de escritorio no descarta su texto', async ({ page }) => {
  await page.goto('/bae/', { waitUntil: 'load' });
  await page.locator('#headline').fill('Texto persistente');
  const toggle = page.getByRole('button', { name: 'Textos', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(page.locator('#headline')).toHaveValue('Texto persistente');
});
