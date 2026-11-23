import { test, expect } from '@playwright/test';

const editors = [
  ['/cronica/', 'Crónica', 'Generador de posteos Crónica'],
  ['/cronica-latest/', 'Crónica', 'Generador de posteos Crónica'],
  ['/bae/', 'BAE Negocios', 'Generador de placas para Instagram'],
  ['/diarioshow/', 'Diario Show', 'Generador de placas para Instagram'],
];

for (const width of [390, 1440]) {
  test(`Cada editor muestra su logo y su subtítulo a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const [route, brand, subtitle] of editors) {
      await page.goto(route + '?onboarding=off');
      const header = page.locator('header');
      const logo = header.getByRole('img', { name: brand, exact: true });
      const title = header.getByText(subtitle, { exact: true });
      const back = header.locator('.dashboard-back-link');

      await expect(header.locator('img')).toHaveCount(1);
      await expect(logo).toBeVisible();
      await expect(title).toBeVisible();
      await expect(back).toHaveAttribute('href', '../');
      await expect(back).toBeInViewport();
      expect((await title.boundingBox()).y).toBeGreaterThanOrEqual(
        await logo.evaluate(image => image.getBoundingClientRect().bottom),
      );
    }
  });
}
