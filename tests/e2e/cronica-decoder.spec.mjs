import { expect, test } from '@playwright/test';

test('Crónica: decodificación inválida no reemplaza la fotografía y permite reintentar', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  await page.locator('#file').setInputFiles({
    name: 'foto-rota.png',
    mimeType: 'image/png',
    buffer: Buffer.from('No es una imagen PNG'),
  });
  await expect(page.locator('#status')).toHaveText('No se pudo abrir esta fotografía');
  await expect(page.locator('#photoDropzone')).toBeVisible();

  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    ctx.fillStyle = '#125b7f';
    ctx.fillRect(0, 0, 480, 640);
    ctx.fillStyle = '#eb4a36';
    ctx.fillRect(100, 200, 100, 250);
    return canvas.toDataURL('image/png').slice('data:image/png;base64,'.length);
  });
  await page.locator('#file').setInputFiles({
    name: 'foto-valida.png',
    mimeType: 'image/png',
    buffer: Buffer.from(photo, 'base64'),
  });
  await expect(page.locator('#photoDropzone')).toBeHidden();
  await page.locator('#photoZoom').fill('175');
  await expect(page.locator('#zoomLabel')).toHaveText('175 %');
});
