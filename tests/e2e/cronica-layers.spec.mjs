import { expect, test } from '@playwright/test';

test('Crónica: capas Canvas reproducen el mismo PNG en portada e interior tras cambios editoriales', async ({ page }) => {
  test.skip(!process.env.CI, 'Necesita la referencia original en el checkout fijado de CI.');

  async function getHashes(url) {
    const response = await page.goto(url, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await page.evaluate(async () => { await document.fonts.ready; });
    const image = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 540; canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible');
      const gradient = ctx.createLinearGradient(0, 0, 540, 720);
      gradient.addColorStop(0, '#cf137d');
      gradient.addColorStop(1, '#199ab0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 540, 720);
      ctx.fillStyle = '#ffe500';
      ctx.fillRect(110, 240, 170, 160);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    const upload = async () => {
      await page.locator('#file').setInputFiles({
        name: 'foto-compuesta.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64'),
      });
      await expect(page.locator('#photoDropzone')).toBeHidden();
    };
    const hash = async () => page.locator('#art').evaluate(async canvas => {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Contexto no disponible');
      const bytes = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
    });

    await upload();
    await page.locator('#headline').fill('PORTADA *IMPORTANTE* _EN CURSIVA_ y ~tachado~ con detalles');
    await page.locator('#strapText').fill('volanta con palabras');
    await page.locator('#size').fill('84');
    await page.locator('#photoZoom').fill('165');
    await page.locator('.logo-choice[data-logo="white"]').click();
    await page.locator('#formatUppercase').click();
    const cover = await hash();

    await page.locator('#addPage').click();
    await page.locator('#headline').fill('Una segunda placa, *muy larga y detallada*, explica los cambios y los protagonistas.');
    await page.locator('#size').fill('83');
    await page.locator('#showStrap').check();
    await page.locator('#strapText').fill('otra noticia');
    await upload();
    await page.locator('#photoZoom').fill('135');
    await page.locator('.logo-choice[data-logo="secondary"]').click();
    const internal = await hash();

    await page.getByRole('button', { name: 'Página 1, portada' }).click();
    expect(await hash()).toBe(cover);
    return { cover, internal };
  }

  const original = await getHashes('http://127.0.0.1:4174/cronica-dev/');
  const migrated = await getHashes('http://127.0.0.1:4173/cronica/');
  expect(migrated).toEqual(original);
});
