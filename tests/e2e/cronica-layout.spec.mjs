import { expect, test } from '@playwright/test';

test('Crónica: el modelo de documento restablece portada e interior sin contaminación', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  await page.locator('#headline').fill('Un título editorial con *destacado*');
  await page.locator('#size').fill('92');
  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Interior');
  await page.locator('#headline').fill('Información ampliada _en cursiva_');
  await page.locator('#showStrap').check();
  await page.locator('#strapText').fill('interior');
  await page.locator('#clearAll').click();
  await expect(page.locator('#size')).toHaveValue('52');
  await expect(page.locator('#strapText')).toHaveValue('');
  await expect(page.locator('#showStrap')).not.toBeChecked();

  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await expect(page.locator('#headline')).toHaveValue('Un título editorial con *destacado*');
  await expect(page.locator('#size')).toHaveValue('92');
  await page.locator('#clearAll').click();
  await expect(page.locator('#headline')).toHaveValue('Escribí un título claro y directo. *Destacá el dato principal* y dejá los detalles para las siguientes placas.');
  await expect(page.locator('#size')).toHaveValue('64');
});

test('Crónica: la composición extraída mantiene paridad píxel por píxel con texto largo y marcado', async ({ page }) => {
  test.skip(!process.env.CI, 'Compara la implementación anterior fijada en el workflow de CI.');

  async function capture(url) {
    const response = await page.goto(url, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await page.evaluate(async () => { await document.fonts.ready; });
    const headline = page.locator('#headline');
    await headline.fill('ARGENTINA: *una noticia que necesita muchas palabras y varios renglones* para explicar el contexto. _Continúa_ con otro detalle y ~un tachado~.');
    await page.locator('#size').fill('94');
    await page.locator('#strapText').fill('NOVEDADES DEL DÍA');
    await page.locator('#formatUppercase').click();

    const fingerprint = () => page.locator('#art').evaluate(async (canvas) => {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D no disponible');
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    });

    const cover = await fingerprint();
    await page.locator('#addPage').click();
    await headline.fill('En la segunda placa: palabraextraordinariamentelargaqueexigedescomposición *con énfasis* y otros detalles');
    await page.locator('#size').fill('91');
    await page.locator('#showStrap').check();
    await page.locator('#strapText').fill('LA VOLANTA DE LA SEGUNDA');
    const internal = await fingerprint();
    await page.getByRole('button', { name: 'Página 1, portada' }).click();
    expect(await fingerprint()).toBe(cover);
    return { cover, internal };
  }

  const expected = await capture('http://127.0.0.1:4174/cronica-dev/');
  const migrated = await capture('http://127.0.0.1:4173/cronica/');
  expect(migrated).toEqual(expected);
});
