import { expect, test } from '@playwright/test';

test('Crónica: paneles plegables conservan estado editorial y navegación', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cronica/', { waitUntil: 'load' });
  const labels = ['Páginas', 'Diseño de placas', 'Diseño de la placa', 'Textos'];
  for (const label of labels) {
    const control = page.getByRole('button', { name: label, exact: true });
    await expect(control).toHaveAttribute('aria-expanded', 'true');
  }

  const heading = page.locator('#headline');
  await heading.fill('Este texto debe sobrevivir al plegado');
  const textToggle = page.getByRole('button', { name: 'Textos', exact: true });
  await textToggle.click();
  await expect(textToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(heading).toBeHidden();
  await textToggle.click();
  await expect(heading).toHaveValue('Este texto debe sobrevivir al plegado');

  const pagesToggle = page.getByRole('button', { name: 'Páginas', exact: true });
  await pagesToggle.click();
  await expect(page.locator('#addPage')).toBeHidden();
  await pagesToggle.click();
  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Interior');
  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await expect(heading).toHaveValue('Este texto debe sobrevivir al plegado');
});
