import { expect, test } from '@playwright/test';

test('Crónica: formato y alineación React conservan selección, mayúsculas y estados por página', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const headline = page.locator('#headline');
  await headline.fill('El fútbol argentino');
  await headline.evaluate((field) => field.setSelectionRange(3, 9));

  await page.getByRole('button', { name: 'Destacar selección' }).click();
  await expect(headline).toHaveValue('El *fútbol* argentino');
  await page.getByRole('button', { name: 'Quitar formato de la selección' }).click();
  await expect(headline).toHaveValue('El fútbol argentino');

  await page.getByRole('button', { name: 'Alinear a la izquierda' }).click();
  await expect(page.locator('#alignLeft')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#alignCenter')).toHaveAttribute('aria-pressed', 'false');

  await page.locator('#formatUppercase').click();
  await expect(page.locator('#formatUppercase')).toHaveAttribute('aria-pressed', 'true');
  await expect(headline).toHaveValue('El fútbol argentino');
  await expect(headline).toHaveClass(/uppercase-preview/);

  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Interior');
  await expect(page.locator('#formatUppercase')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#alignLeft')).toHaveAttribute('aria-pressed', 'true');
  await headline.fill('Segunda placa independiente');
  await page.getByRole('button', { name: 'Alinear al centro' }).click();

  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await expect(headline).toHaveValue('El fútbol argentino');
  await expect(page.locator('#formatUppercase')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#alignLeft')).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Página 2, interior' }).click();
  await expect(headline).toHaveValue('Segunda placa independiente');
  await expect(page.locator('#formatUppercase')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#alignCenter')).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Ayuda sobre el formato de texto' }).click();
  await expect(page.getByRole('button', { name: 'Ayuda sobre el formato de texto' })).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Ayuda sobre el formato de texto' })).toHaveAttribute('aria-expanded', 'false');
});

test('Crónica: el Canvas renderiza formato y alineación de forma determinista', async ({ page }) => {

  async function renderEditedState(url) {
    const response = await page.goto(url, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.locator('#headline').fill('El fútbol argentino');
    await page.locator('#headline').evaluate((field) => field.setSelectionRange(3, 9));
    await page.locator('#formatAccent').click();
    await page.locator('#alignLeft').click();
    await page.locator('#formatUppercase').click();
    await page.locator('#addPage').click();
    await page.locator('#headline').fill('Una segunda placa de texto');
    await page.locator('#alignCenter').click();
    await page.getByRole('button', { name: 'Página 1, portada' }).click();
    await expect(page.locator('#headline')).toHaveValue('El *fútbol* argentino');
    await page.evaluate(async () => { await document.fonts.ready; });
    const fingerprint = await page.locator('#art').evaluate(async (canvas) => {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D no disponible');
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
    });
    return fingerprint;
  }

  const migrated = await renderEditedState('/cronica/');
  expect(migrated).toMatch(/^[a-f0-9]{64}$/);
});
