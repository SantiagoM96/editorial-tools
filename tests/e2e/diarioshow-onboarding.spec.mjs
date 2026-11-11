import { expect, test } from '@playwright/test';

test('Diario Show: recorrido de 7 pasos, persistencia y reinicio accesible', async ({ page }) => {
  await page.goto('/diarioshow/?onboarding=force', { waitUntil: 'load' });
  const dialog = page.getByRole('dialog', { name: 'Elegí el diseño de tu placa' });
  await expect(dialog).toBeVisible();
  const next = page.getByRole('button', { name: 'Siguiente' });
  for (let step = 1; step <= 7; step++) {
    await expect(page.locator('.ds-tour-progress')).toHaveText(step + ' de 7');
    if (step < 7) await next.click();
  }
  await expect(page.getByRole('button', { name: 'Finalizar' })).toBeVisible();
  await page.getByRole('button', { name: 'Finalizar' }).click();
  await expect(page.locator('#dsOnboardingLayer')).toBeHidden();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('diarioshow-tour-desktop-v1'))).toBe('complete');
  await page.goto('/diarioshow/', { waitUntil: 'load' });
  await expect(page.locator('#dsOnboardingLayer')).toHaveCount(0);
  await page.getByRole('button', { name: 'Volver a ver la guía de Diario Show' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Volver a ver la guía de Diario Show' })).toBeFocused();
});

test('Diario Show: el onboarding no bloquea dispositivos móviles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/diarioshow/?onboarding=force', { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Vista previa' }).click();
  await expect(page.locator('#art')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#dsOnboardingTrigger')).toBeHidden();
});
