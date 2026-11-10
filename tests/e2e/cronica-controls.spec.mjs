import { expect, test } from '@playwright/test';

test('Crónica: conserva textos, variantes y selección al editar varias páginas', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  await expect(page.locator('#pageIndicator')).toHaveText('1 de 1 · Portada');
  await expect(page.getByRole('button', { name: 'Página 1, portada' })).toHaveAttribute('aria-current', 'page');
  await page.locator('#headline').fill('Título de portada persistente');
  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Interior');
  await expect(page.getByRole('button', { name: 'Página 2, interior' })).toHaveAttribute('aria-current', 'page');
  await page.locator('#headline').fill('Texto exclusivo de la segunda placa');

  await page.locator('[data-page-variant="cover"]').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Portada');
  await expect(page.locator('[data-page-variant="cover"]')).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await expect(page.locator('#headline')).toHaveValue('Título de portada persistente');
  await expect(page.locator('#pageIndicator')).toHaveText('1 de 2 · Portada');
  await expect(page.locator('#removePage')).toBeDisabled();

  await page.getByRole('button', { name: 'Página 2, portada' }).click();
  await expect(page.locator('#headline')).toHaveValue('Texto exclusivo de la segunda placa');
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Portada');
  await page.locator('#removePage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('1 de 1 · Portada');
  await expect(page.locator('#headline')).toHaveValue('Título de portada persistente');
});

test('Crónica: estado del carrusel sigue sincronizado al descargar todas las páginas', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  await page.locator('#addPage').click();
  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('3 de 3 · Interior');
  await page.locator('#download').click();
  const downloads = [];
  page.on('download', (download) => downloads.push(download));
  await page.locator('#exportAll').click();
  await expect.poll(() => downloads.length, { timeout: 30000 }).toBe(3);
  await expect(page.locator('#pageIndicator')).toHaveText('3 de 3 · Interior');
  await expect(page.getByRole('button', { name: 'Página 3, interior' })).toHaveAttribute('aria-current', 'page');
});
