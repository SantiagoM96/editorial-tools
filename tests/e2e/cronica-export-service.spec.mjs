import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Crónica: exportar carrusel desde la página intermedia restaura texto, selección y archivos ordenados', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const headline = page.locator('#headline');
  await headline.fill('Portada que conserva su título');
  await page.locator('#addPage').click();
  await headline.fill('Página intermedia seleccionada');
  await page.locator('#addPage').click();
  await headline.fill('Tercera página del carrusel');
  await page.getByRole('button', { name: 'Página 2, interior' }).click();
  await expect(headline).toHaveValue('Página intermedia seleccionada');

  const downloads = [];
  page.on('download', download => downloads.push(download));
  await page.locator('#download').click();
  await expect(page.locator('#exportAllDetail')).toHaveText('3 archivos PNG por separado');
  await page.locator('#exportAll').click();
  await expect.poll(() => downloads.length, { timeout: 30000 }).toBe(3);
  const names = downloads.map(download => download.suggestedFilename());
  expect(names).toEqual([
    expect.stringMatching(/^Cronica-pagina-01_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.png$/),
    expect.stringMatching(/^Cronica-pagina-02_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.png$/),
    expect.stringMatching(/^Cronica-pagina-03_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.png$/),
  ]);
  expect(new Set(names).size).toBe(3);
  for (const download of downloads) {
    const bytes = await readFile(await download.path());
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1080, 1440]);
  }
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 3 · Interior');
  await expect(headline).toHaveValue('Página intermedia seleccionada');
  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await expect(headline).toHaveValue('Portada que conserva su título');
  await page.getByRole('button', { name: 'Página 3, interior' }).click();
  await expect(headline).toHaveValue('Tercera página del carrusel');
});

test('Crónica: fallar al codificar PNG restaura la página y no deja controles bloqueados', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const headline = page.locator('#headline');
  await page.locator('#addPage').click();
  await headline.fill('Página actual que debe sobrevivir al fallo');
  await page.locator('#addPage').click();
  await headline.fill('Otra página que no debe descargar');
  await page.getByRole('button', { name: 'Página 2, interior' }).click();
  await page.locator('#art').evaluate(canvas => {
    canvas.toBlob = callback => { callback(null); };
  });
  const downloads = [];
  page.on('download', download => downloads.push(download));
  await page.locator('#download').click();
  await page.locator('#exportAll').click();
  await expect(page.locator('#exportFeedback')).toContainText('No se pudo generar el PNG.');
  expect(downloads).toHaveLength(0);
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 3 · Interior');
  await expect(headline).toHaveValue('Página actual que debe sobrevivir al fallo');
  await expect(page.locator('#exportAll')).toBeEnabled();
  await expect(page.locator('#exportClose')).toBeEnabled();
  await page.locator('#exportClose').click();
  await expect(page.locator('#exportDialog')).toBeHidden();
});

test('Crónica: exportar dos veces una sola placa genera nombres distintos y no abre modal', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const first = page.waitForEvent('download');
  await page.locator('#download').click();
  const downloadOne = await first;
  const second = page.waitForEvent('download');
  await page.locator('#download').click();
  const downloadTwo = await second;
  expect(downloadOne.suggestedFilename()).toMatch(/^Cronica-pagina-01_.*\.png$/);
  expect(downloadTwo.suggestedFilename()).toMatch(/^Cronica-pagina-01_.*\.png$/);
  expect(downloadOne.suggestedFilename()).not.toBe(downloadTwo.suggestedFilename());
  await expect(page.locator('#exportDialog')).toBeHidden();
  await expect(page.locator('#pageIndicator')).toHaveText('1 de 1 · Portada');
});
