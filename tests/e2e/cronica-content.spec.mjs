import { expect, test } from '@playwright/test';

test('Crónica: React conserva título, volanta y tamaño por página', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const headline = page.locator('#headline');
  const strap = page.locator('#strapText');
  const size = page.locator('#size');
  await headline.fill('Título principal personalizado');
  await strap.fill('noticia con acentos: á é');
  await expect(strap).toHaveValue('NOTICIA CON ACENTOS: Á É');
  await size.fill('82');
  await expect(page.locator('#sizeLabel')).toHaveText('82');

  await page.locator('#showStrap').uncheck();
  await expect(page.locator('#strapField')).toBeHidden();
  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Interior');
  await expect(size).toHaveValue('52');
  await expect(strap).toHaveValue('');
  await expect(page.locator('#strapField')).toBeHidden();
  await headline.fill('Segunda página independiente');
  await size.fill('61');
  await page.locator('#showStrap').check();
  await strap.fill('otra volanta');

  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await expect(headline).toHaveValue('Título principal personalizado');
  await expect(strap).toHaveValue('NOTICIA CON ACENTOS: Á É');
  await expect(page.locator('#strapField')).toBeHidden();
  await expect(size).toHaveValue('82');

  await page.getByRole('button', { name: 'Página 2, interior' }).click();
  await expect(headline).toHaveValue('Segunda página independiente');
  await expect(strap).toHaveValue('OTRA VOLANTA');
  await expect(page.locator('#strapField')).toBeVisible();
  await expect(page.locator('#sizeLabel')).toHaveText('61');
  await page.locator('#clearAll').click();
  await expect(size).toHaveValue('52');
  await expect(strap).toHaveValue('');
  await expect(page.locator('#strapField')).toBeHidden();
});

test('Crónica: edición React mantiene formato, cursor y exportación de carrusel', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const headline = page.locator('#headline');
  await headline.fill('Fútbol en la ciudad');
  await headline.evaluate((field) => field.setSelectionRange(0, 6));
  await page.locator('#formatItalic').click();
  await expect(headline).toHaveValue('_Fútbol_ en la ciudad');
  const selection = await headline.evaluate((field) => [field.selectionStart, field.selectionEnd]);
  expect(selection).toEqual([1, 7]);

  await page.locator('#addPage').click();
  await headline.fill('Una segunda placa');
  await page.locator('#addPage').click();
  await headline.fill('Una tercera placa');
  await page.locator('#download').click();
  const downloads = [];
  page.on('download', (download) => downloads.push(download));
  await page.locator('#exportAll').click();
  await expect.poll(() => downloads.length, { timeout: 30000 }).toBe(3);
  await expect(page.locator('#pageIndicator')).toHaveText('3 de 3 · Interior');
  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await expect(headline).toHaveValue('_Fútbol_ en la ciudad');
});

test('Crónica: el Canvas reacciona a titulares y volanta sin alterar las dimensiones del PNG', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; });
  const digest = () => page.locator('#art').evaluate(async canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, 1080, 1440).data;
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
  });
  const original = await digest();
  await page.locator('#headline').fill('Una noticia destacada sobre el campeonato');
  await page.locator('#strapText').fill('volanta nueva');
  await page.locator('#size').fill('77');
  await expect(page.locator('#strapText')).toHaveValue('VOLANTA NUEVA');
  const edited = await digest();
  expect(edited).toHaveLength(64);
  expect(edited).not.toEqual(original);
  await page.locator('#showStrap').uncheck();
  expect(await digest()).not.toEqual(edited);
  await page.locator('#showStrap').check();
  expect(await digest()).toEqual(edited);
});
