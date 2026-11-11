import { expect, test } from '@playwright/test';

test('Diario Show: siete pasos, cierre, persistencia y reinicio accesibles', async ({ page }) => {
  await page.goto('/diarioshow/?onboarding=force', { waitUntil: 'load' });
  await expect(page.getByRole('dialog', { name: 'Elegí el diseño de tu placa' })).toBeVisible();
  for (let step = 1; step <= 7; step++) {
    await expect(page.locator('#dsTourProgress')).toHaveText(step + ' de 7');
    if (step < 7) await page.locator('.ds-tour-next').click();
  }
  await expect(page.getByRole('button', { name: 'Finalizar' })).toBeVisible();
  await page.locator('.ds-tour-next').click();
  await expect(page.locator('#dsOnboardingLayer')).toBeHidden();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ds-editor-tour-desktop-v2'))).toBe('complete');
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
