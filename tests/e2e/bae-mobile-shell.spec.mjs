import { expect, test } from '@playwright/test';

test('BAE: Formato y Vista previa comparten un único titular y mayúsculas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/bae/?onboarding=off', { waitUntil: 'load' });
  await expect(page.getByRole('tab', { name: 'Vista previa' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#art')).toBeVisible();
  await page.getByRole('tab', { name: 'Formato' }).click();
  const texts = page.locator('aside.editor-panel .modern-text-card');
  const toggle = texts.locator('.modern-toggle');
  await toggle.click();
  await expect(texts.locator('.modern-body')).toBeHidden();
  await toggle.click();
  const editor = texts.locator('.cronica-rich-headline').first();
  await expect(editor).toBeVisible();
  await editor.fill('Texto BAE original');
  await expect(page.locator('#headline')).toHaveValue('Texto BAE original');
  await texts.locator('#formatUppercase').click();
  await expect(texts.locator('#formatUppercase')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tab', { name: 'Vista previa' }).click();
  const mobile = page.locator('.modern-preview-text-editor .cronica-rich-headline').first();
  await expect(mobile).toContainText('Texto BAE original');
  await mobile.fill('Texto BAE sincronizado');
  await expect(page.locator('#headline')).toHaveValue('Texto BAE sincronizado');
  const download = page.waitForEvent('download');
  await page.locator('#download').click();
  await download;
  await expect(page.locator('#art')).toBeVisible();
});

test('BAE: un acordeón de escritorio conserva el titular enriquecido', async ({ page }) => {
  await page.goto('/bae/?onboarding=off', { waitUntil: 'load' });
  const texts = page.locator('aside.editor-panel .modern-text-card');
  const editor = texts.locator('.cronica-rich-headline').first();
  await editor.fill('Texto persistente');
  await expect(page.locator('#headline')).toHaveValue('Texto persistente');
  await texts.locator('.modern-toggle').click();
  await expect(texts.locator('.modern-body')).toBeHidden();
  await texts.locator('.modern-toggle').click();
  await expect(editor).toContainText('Texto persistente');
});

test('BAE: iPhone sin zoom y edición contextual del texto', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/bae/?onboarding=off', { waitUntil: 'load' });
  const editor = page.locator('.modern-preview-text-editor .cronica-rich-headline').first();
  await expect(editor).toBeVisible();
  const size = await editor.evaluate(el => getComputedStyle(el).fontSize);
  expect(Number.parseFloat(size)).toBeGreaterThanOrEqual(16);
  await editor.fill('Texto de prueba desde vista previa');
  await expect(page.locator('#headline')).toHaveValue('Texto de prueba desde vista previa');
  const hit = page.locator('.modern-text-hit');
  await expect(hit).toHaveCount(1);
  const box = await hit.boundingBox();
  expect(box).not.toBeNull();
  await editor.evaluate(el => el.blur());
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - 35, { steps: 4 });
  await page.mouse.up();
  await expect(editor).not.toBeFocused();
});

test('BAE: cada diapositiva conserva su estado y puede seleccionarse', async ({ page }) => {
  await page.goto('/bae/?onboarding=off', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => window.EditorialSlides?.count())).toBe(1);
  await page.locator('.editor-slide-add-tile').click();
  await expect.poll(() => page.evaluate(() => window.EditorialSlides.count())).toBe(2);
  await page.evaluate(() => window.EditorialSlides.select(0));
  await expect.poll(() => page.evaluate(() => window.EditorialSlides.active())).toBe(0);
  await page.evaluate(() => window.EditorialSlides.select(1));
  await expect.poll(() => page.evaluate(() => window.EditorialSlides.active())).toBe(1);
});

test('BAE: tutorial de 10 pasos aparece automáticamente en primera visita y puede reabrirse', async ({ page }) => {
  await page.goto('/bae/', { waitUntil: 'load' });
  await expect(page.locator('#art')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Organizá las diapositivas' })).toBeVisible();
  await expect(page.locator('#dsTourProgress')).toHaveText('1 de 10');
  await page.getByRole('button', { name: 'Omitir' }).click();
  await expect(page.locator('#dsOnboardingLayer')).toBeHidden();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('bae-dev-tour-desktop-v1'))).toBe('complete');
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('#dsOnboardingLayer')).toHaveCount(0);
  await page.locator('#dsOnboardingTrigger').click();
  await expect(page.getByRole('dialog', { name: 'Organizá las diapositivas' })).toBeVisible();
});

test('BAE: la exportación puede probarse con onboarding desactivado sin eliminar la guía', async ({ page }) => {
  await page.goto('/bae/?onboarding=off', { waitUntil: 'load' });
  await expect(page.locator('#dsOnboardingLayer')).toHaveCount(0);
  await expect(page.locator('#art')).toBeVisible();
  const promise = page.waitForEvent('download');
  await page.locator('#download').click();
  const download = await promise;
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});

test('BAE: el tutorial inicial se cierra al empezar a editar y deja exportar', async ({ page }) => {
  await page.goto('/bae/', { waitUntil: 'load' });
  await expect(page.getByRole('dialog', { name: 'Organizá las diapositivas' })).toBeVisible();
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 640;
    canvas.getContext('2d').fillRect(0, 0, 480, 640);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#file').setInputFiles({
    name: 'foto-editorial.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64'),
  });
  await expect(page.locator('#dsOnboardingLayer')).toBeHidden();
  await expect.poll(() => page.locator('#photoDropzone').evaluate(el => el.hidden)).toBe(true);
  const download = page.waitForEvent('download');
  await page.locator('#download').click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/i);
});
