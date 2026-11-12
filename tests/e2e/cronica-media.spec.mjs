import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

async function syntheticImage(page) {
  const payload = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No Canvas 2D');
    const grad = ctx.createLinearGradient(0, 0, 540, 720);
    grad.addColorStop(0, '#124d8a');
    grad.addColorStop(0.5, '#22c9ae');
    grad.addColorStop(1, '#f1b858');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 540, 720);
    ctx.fillStyle = '#ff005b';
    ctx.fillRect(100, 180, 140, 220);
    ctx.fillStyle = '#0d1230';
    ctx.fillRect(300, 310, 160, 120);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(payload, 'base64');
}

async function upload(page, buffer, filename = 'fixture-cronica.png') {
  await page.locator('#file').setInputFiles({
    name: filename,
    mimeType: 'image/png',
    buffer,
  });
  await expect(page.locator('#photoDropzone')).toBeHidden();
}

async function canvasFingerprint(page) {
  return page.locator('#art').evaluate(async (canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No Canvas 2D');
    const bytes = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('');
  });
}

async function cropPhoto(page) {
  const bounds = await page.locator('#art').boundingBox();
  if (!bounds) throw new Error('No se encontró el Canvas');
  const x = bounds.x + bounds.width * 0.35;
  const y = bounds.y + bounds.height * 0.12;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 45, y + 20, { steps: 3 });
  await page.mouse.up();
}

test('Crónica: logos, carga, zoom y reencuadre persisten por página', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const fixture = await syntheticImage(page);
  await expect(page.locator('.logo-choice[data-logo="primary"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.logo-choice[data-logo="white"]').click();
  await expect(page.locator('.logo-choice[data-logo="white"]')).toHaveAttribute('aria-pressed', 'true');

  await upload(page, fixture);
  await expect(page.locator('.cronica-photo-name')).toHaveText('fixture-cronica.png');
  await page.locator('#photoZoom').fill('170');
  await expect(page.locator('#zoomLabel')).toHaveText('170 %');
  const beforeDrag = await canvasFingerprint(page);
  await cropPhoto(page);
  const afterDrag = await canvasFingerprint(page);
  expect(afterDrag).not.toBe(beforeDrag);

  await page.locator('#addPage').click();
  await expect(page.locator('#pageIndicator')).toHaveText('2 de 2 · Interior');
  await expect(page.locator('#photoDropzone')).toBeVisible();
  await expect(page.locator('.cronica-photo-name')).toHaveText('una fotografía');
  await expect(page.locator('#zoomLabel')).toHaveText('100 %');
  await expect(page.locator('.logo-choice[data-logo="primary"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.logo-choice[data-logo="secondary"]').click();
  await upload(page, fixture, 'interior.png');
  await expect(page.locator('.cronica-photo-name')).toHaveText('interior.png');
  await page.locator('#photoZoom').fill('130');
  await expect(page.locator('#zoomLabel')).toHaveText('130 %');

  await page.getByRole('button', { name: 'Página 1, portada' }).click();
  await expect(page.locator('.logo-choice[data-logo="white"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.cronica-photo-name')).toHaveText('fixture-cronica.png');
  await expect(page.locator('#zoomLabel')).toHaveText('170 %');
  await expect(page.locator('#photoDropzone')).toBeHidden();
  expect(await canvasFingerprint(page)).toBe(afterDrag);

  await page.getByRole('button', { name: 'Página 2, interior' }).click();
  await expect(page.locator('.logo-choice[data-logo="secondary"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.cronica-photo-name')).toHaveText('interior.png');
  await expect(page.locator('#zoomLabel')).toHaveText('130 %');

  await page.locator('#clearAll').click();
  await expect(page.locator('.cronica-photo-name')).toHaveText('una fotografía');
  await expect(page.locator('#photoDropzone')).toBeVisible();
  await expect(page.locator('#zoomLabel')).toHaveText('100 %');
  await expect(page.locator('.logo-choice[data-logo="primary"]')).toHaveAttribute('aria-pressed', 'true');
});

test('Crónica: drag and drop en la vista previa carga una fotografía válida', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const fixture = await syntheticImage(page);
  await page.locator('#photoStage').evaluate((stage, base64) => {
    const raw = atob(base64);
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
    const file = new File([bytes], 'foto-arrastrada.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const rect = stage.getBoundingClientRect();
    stage.dispatchEvent(new DragEvent('drop', {
      bubbles: true, cancelable: true, dataTransfer: dt,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height * 0.1,
    }));
  }, fixture.toString('base64'));
  await expect(page.locator('#photoDropzone')).toBeHidden();
});

test('Crónica: foto y zoom preservan la fotografía individual tras cambiar de página', async ({ page }) => {

  const fixture = await syntheticImage(page);

  async function capture(url) {
    const response = await page.goto(url, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await page.evaluate(async () => { await document.fonts.ready; });
    await upload(page, fixture);
    await page.locator('.logo-choice[data-logo="secondary"]').click();
    await page.locator('#photoZoom').fill('165');
    await cropPhoto(page);
    const first = await canvasFingerprint(page);
    await page.locator('#addPage').click();
    await page.locator('.logo-choice[data-logo="white"]').click();
    await upload(page, fixture);
    await page.locator('#photoZoom').fill('125');
    const second = await canvasFingerprint(page);
    await page.getByRole('button', { name: 'Página 1, portada' }).click();
    const restored = await canvasFingerprint(page);
    expect(restored).toBe(first);
    return { first, second };
  }

  const migrated = await capture('/cronica/');
  expect(migrated.first).toHaveLength(64);
  expect(migrated.second).toHaveLength(64);
  expect(migrated.first).not.toBe(migrated.second);
});

test('Crónica: exporta PNG con fotografía y zoom por cada página', async ({ page }) => {
  await page.goto('/cronica/', { waitUntil: 'load' });
  const fixture = await syntheticImage(page);
  await upload(page, fixture);
  await page.locator('#photoZoom').fill('175');
  await page.locator('#addPage').click();
  await upload(page, fixture);
  await page.locator('#photoZoom').fill('120');
  await page.locator('#download').click();
  const downloads = [];
  page.on('download', (download) => downloads.push(download));
  await page.locator('#exportAll').click();
  await expect.poll(() => downloads.length, { timeout: 30000 }).toBe(2);
  for (const download of downloads) {
    const data = await readFile(await download.path());
    expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect([data.readUInt32BE(16), data.readUInt32BE(20)]).toEqual([1080, 1440]);
    expect(createHash('sha256').update(data).digest('hex')).toHaveLength(64);
  }
  await expect(page.locator('#zoomLabel')).toHaveText('120 %');
});
