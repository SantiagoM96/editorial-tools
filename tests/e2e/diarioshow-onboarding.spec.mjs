import { expect, test } from '@playwright/test';

test('Diario Show: recorrido actualizado, cierre, persistencia y reinicio accesibles', async ({ page }) => {
  await page.goto('/diarioshow/?onboarding=force', { waitUntil: 'load' });
  await expect(page.getByRole('dialog', { name: 'Organizá las diapositivas' })).toBeVisible();
  const expectedTitles = [
    'Organizá las diapositivas',
    'Elegí el diseño de tu placa',
    'Definí la distribución fotográfica',
    'Importá y personalizá tu placa',
    'Editá los textos',
    'Abrí o cerrá todos los módulos',
    'Configurá el logo y la firma',
    'Editá el texto desde la vista previa',
    '¿Poco espacio?',
  ];
  for (let step = 1; step <= expectedTitles.length; step++) {
    await expect(page.locator('#dsTourTitle')).toHaveText(expectedTitles[step - 1]);
    await expect(page.locator('#dsTourProgress')).toHaveText(step + ' de ' + expectedTitles.length);
    if (step < expectedTitles.length) await page.locator('.ds-tour-next').click();
  }
  await expect(page.getByRole('button', { name: 'Finalizar' })).toBeVisible();
  await page.locator('.ds-tour-next').click();
  await expect(page.locator('#dsOnboardingLayer')).toBeHidden();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ds-dev-tour-desktop-v3'))).toBe('complete');
  await page.goto('/diarioshow/', { waitUntil: 'load' });
  await expect(page.locator('#dsOnboardingLayer')).toHaveCount(0);
  await page.locator('#dsOnboardingTrigger').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#dsOnboardingTrigger')).toBeFocused();
});

test('Diario Show: la guía no bloquea la edición móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/diarioshow/?onboarding=force', { waitUntil: 'load' });
  await expect(page.locator('#art')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#dsOnboardingTrigger')).toBeHidden();
});

test('Diario Show: importación e identidad son independientes y la firma cambia el PNG', async ({ page }) => {
  await page.goto('/diarioshow/?onboarding=off');
  const importGroup = page.locator('#dsMobileControlsPanel .ds-import-group');
  const identity = page.locator('#dsMobileControlsPanel .ds-plate-design-group');
  await expect(importGroup.getByRole('button', { name: /Importar noticia/ })).toBeVisible();
  await expect(identity.getByRole('button', { name: /Diseño de placas/ })).toBeVisible();
  await expect(importGroup.locator('#articleUrl')).toBeVisible();
  await expect(identity.locator('[data-footer-style="center"]')).toHaveAttribute('aria-pressed', 'true');
  const before = await page.locator('#art').evaluate(canvas => canvas.toDataURL());
  await identity.locator('[data-footer-style="carousel"]').click();
  await expect(identity.locator('[data-footer-style="carousel"]')).toHaveAttribute('aria-pressed', 'true');
  const after = await page.locator('#art').evaluate(canvas => canvas.toDataURL());
  expect(after).not.toBe(before);
  await identity.locator('[data-footer-style="center"]').click();
  await expect(page.locator('#art').evaluate(canvas => canvas.toDataURL())).resolves.toBe(before);
});

test('Diario Show: tooltips mantienen ancho legible cerca del borde derecho', async ({ page }) => {
  await page.setViewportSize({ width: 1040, height: 780 });
  await page.goto('/diarioshow/?onboarding=off');
  const trigger = page.locator('#dsMobileControlsPanel .ds-photo-picker-help').first();
  await trigger.locator('.help-button').hover();
  const rect = await trigger.locator('.help-tooltip').boundingBox();
  expect(rect).not.toBeNull();
  expect(rect.width).toBeGreaterThanOrEqual(160);
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(1040);
});
