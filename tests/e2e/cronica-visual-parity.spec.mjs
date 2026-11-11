import { test, expect } from '@playwright/test';

// El marco completo cambió deliberadamente por los acordeones React.
// Se comparan los controles internos, su geometría y apariencia; Canvas/PNG
// mantiene pruebas independientes de igualdad SHA-256.
test.skip(!process.env.CI, 'La comparación requiere el checkout original en reference/public');

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`Crónica: botones internos equivalentes tras añadir acordeones (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    async function capture(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      if (viewport.width === 390 && url.includes('4173')) await page.getByRole('tab', { name: 'Formato' }).click();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      });
      await expect(page.locator('#pageIndicator')).toHaveText('1 de 1 · Portada');
      return page.evaluate(() => {
        const style = (selector) => {
          const node = document.querySelector(selector);
          if (!node) throw Error('Falta control ' + selector);
          const s = getComputedStyle(node), b = node.getBoundingClientRect();
          return {
            width: b.width, height: b.height, backgroundColor: s.backgroundColor,
            borderColor: s.borderColor, borderRadius: s.borderRadius,
            fontSize: s.fontSize, color: s.color, padding: s.padding,
          };
        };
        return {
          pageButton: style('.carousel-pages button'),
          coverButton: style('[data-page-variant="cover"]'),
          interiorButton: style('[data-page-variant="internal"]'),
          activePage: document.querySelector('.carousel-pages button')?.getAttribute('aria-current'),
          activeVariant: document.querySelector('[data-page-variant="cover"]')?.getAttribute('aria-pressed'),
        };
      });
    }
    const original = await capture('http://127.0.0.1:4174/cronica-dev/');
    const migrated = await capture('http://127.0.0.1:4173/cronica/');
    expect(migrated).toEqual(original);
    for (const label of ['Páginas', 'Diseño de placas']) {
      const toggle = page.getByRole('button', { name: label, exact: true });
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(toggle).toHaveAttribute('aria-controls', /.+/);
    }
  });
}
