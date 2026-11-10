import { expect, test } from '@playwright/test';

async function photoFixture(page) {
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    const gradient = ctx.createLinearGradient(0, 0, 480, 720);
    gradient.addColorStop(0, '#f32b49');
    gradient.addColorStop(1, '#26a5c9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 480, 720);
    ctx.fillStyle = '#aaff11';
    ctx.fillRect(90, 210, 130, 170);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(encoded, 'base64');
}

async function fingerprint(page) {
  return page.locator('#art').evaluate(async canvas => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Sin contexto Canvas');
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const digest = await crypto.subtle.digest('SHA-256', image);
    return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
  });
}

test('Crónica: reencuadre por teclado y ayuda accesible sin alterar la exportación', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const canvas = page.locator('#art');
  await expect(canvas).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#status')).toHaveAttribute('role', 'status');
  await expect(page.locator('#file')).toHaveAttribute('aria-describedby', 'cronica-photo-help');
  await page.locator('#file').setInputFiles({
    name: 'foto-teclado.png',
    mimeType: 'image/png',
    buffer: await photoFixture(page),
  });
  await expect(page.locator('#photoDropzone')).toBeHidden();
  await expect(canvas).toHaveAttribute('tabindex', '0');
  await page.locator('#photoZoom').fill('200');
  const before = await fingerprint(page);
  await canvas.focus();
  await expect(canvas).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const after = await fingerprint(page);
  expect(after).not.toBe(before);
  await page.keyboard.press('Shift+ArrowDown');
  const shifted = await fingerprint(page);
  expect(shifted).not.toBe(after);
  await page.locator('#clearAll').click();
  await expect(canvas).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#photoDropzone')).toBeVisible();
});

test('Crónica: foto pendiente en página eliminada no aparece en otra página', async ({ page }) => {
  // Simula decodificación lenta de una imagen; los logos SVG no se retrasan.
  await page.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (!descriptor?.get || !descriptor.set) return;
    const originalSet = descriptor.set;
    let delayed = false;
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      get: descriptor.get,
      set(value) {
        if (!delayed && typeof value === 'string' && value.startsWith('blob:')) {
          delayed = true;
          setTimeout(() => originalSet.call(this, value), 400);
        } else {
          originalSet.call(this, value);
        }
      },
    });
  });
  await page.goto('/cronica/', { waitUntil: 'load' });
  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Interior');
  const fixture = await photoFixture(page);
  await page.locator('#file').setInputFiles({
    name: 'foto-pendiente.png', mimeType: 'image/png', buffer: fixture,
  });
  // Se crea una página más, se vuelve a la que está cargando y se elimina.
  await page.locator('#addPage').click();
  await page.getByRole('button', { name: 'Página 2, interior' }).click();
  await page.locator('#removePage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Interior');
  await expect(page.locator('#photoDropzone')).toBeVisible();
  await page.waitForTimeout(520);
  await expect(page.locator('#photoDropzone')).toBeVisible();
  await expect(page.locator('#zoomLabel')).toHaveText('100 %');
  await expect(page.locator('#status')).not.toContainText('No se pudo abrir');
});

test('Crónica: el diálogo de exportación permite Escape y restituye el foco', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  await page.locator('#addPage').click();
  await page.locator('#download').click();
  const dialog = page.getByRole('dialog', { name: 'Descargar imágenes' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#exportCurrent')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#download')).toBeFocused();
});
