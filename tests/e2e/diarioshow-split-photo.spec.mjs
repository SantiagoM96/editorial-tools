import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Diario Show: fotos compartidas tienen zoom independiente y exportan PNG', async ({ page }) => {
  await page.goto('/diarioshow/?onboarding=off', { waitUntil: 'load' });
  await page.locator('#dsMobileControlsPanel [data-photo-layout="split"]').click();
  await expect(page.locator('#splitPhotoFields')).toBeVisible();
  await expect(page.locator('#splitPhotoZones')).toBeVisible();
  await expect(page.locator('#photoStage')).toHaveClass(/split-mode/);

  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 640;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#aa3388'; ctx.fillRect(0,0,480,640);
    ctx.fillStyle = '#ffddaa'; ctx.fillRect(50,50,140,240);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  for (const [id,name] of [['fileLeft','izquierda.png'],['fileRight','derecha.png']]) {
    await page.locator('#' + id).setInputFiles({ name, mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') });
  }
  await expect(page.locator('#photoStage')).toHaveClass(/split-mode/);
  // En fotos cargadas el Canvas recibe los eventos de reencuadre; el overlay
  // deliberadamente no intercepta clicks ni drag.
  const canvasBox = await page.locator('#art').boundingBox();
  if (!canvasBox) throw new Error('Canvas no disponible');
  await page.locator('#art').click({ position: { x: canvasBox.width * .74, y: canvasBox.height * .18 } });
  await page.locator('#photoZoom').fill('150');
  await expect(page.locator('#zoomLabel')).toContainText('150');
  await page.locator('#art').click({ position: { x: canvasBox.width * .26, y: canvasBox.height * .18 } });
  await expect(page.locator('#zoomLabel')).toContainText('100');
  const download = page.waitForEvent('download', { timeout: 30000 });
  await page.locator('#download').click();
  const png = await readFile(await (await download).path());
  expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(1080);
  expect(png.readUInt32BE(20)).toBe(1440);
  await page.locator('#dsMobileControlsPanel [data-variant="quote"]').click();
  await expect(page.locator('#splitPhotoFields')).toBeHidden();
});
