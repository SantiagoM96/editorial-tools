import { test, expect } from '@playwright/test';

test.skip(!process.env.CI, 'Compara contra la versión exacta de MLZ fijada en reference-latest.');

const variants = [
  { name: 'Crónica de Andy', source: 'cronica-dev', target: 'cronica-latest' },
  { name: 'BAE Negocios', source: 'bae-dev', target: 'bae' },
  { name: 'Diario Show', source: 'diarioshow-dev', target: 'diarioshow' },
];
const ref = '6d00bb597ff2173dcb8af69a770f2ff059048f32';

async function layout(page, url) {
  const response = await page.goto(url + '?onboarding=off', { waitUntil: 'load' });
  expect(response?.status(), url).toBe(200);
  await page.evaluate(async () => { await document.fonts.ready; });
  // La altura de las pestañas móviles se ajusta tras transiciones y rAF.
  await page.waitForTimeout(650);
  await expect(page.locator('#art')).toBeVisible();
  return page.evaluate(() => {
    const selectors = ['header .site-container', 'main', 'aside.editor-panel', '.preview', '.editor-slide-nav', '#art'];
    const measure = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      const round = n => Math.round(n * 10) / 10;
      return {
        x: round(box.x), y: round(box.y), width: round(box.width), height: round(box.height),
        fontSize: css.fontSize, padding: css.padding, gap: css.gap,
        backgroundColor: css.backgroundColor, borderRadius: css.borderRadius,
      };
    };
    return Object.fromEntries(selectors.map(selector => [selector, measure(selector)]));
  });
}

for (const product of variants) {
  for (const width of [1440, 390]) {
    test(`${product.name}: misma geometría visual en MLZ y Editorial Tools a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const source = await layout(page, 'http://127.0.0.1:4175/' + product.source + '/');
      const target = await layout(page, 'http://127.0.0.1:4173/' + product.target + '/');
      expect(target).toEqual(source);
      await expect(page.locator('meta[name="editorial-source-commit"]')).toHaveAttribute('content', ref);
    });
  }
}

test('Los tres onboarding tienen su ilustración Shift compartida disponible', async ({ request }) => {
  const response = await request.get('/shared/shift-click-demo.svg');
  expect(response.ok()).toBeTruthy();
  const image = await response.text();
  expect(image).toContain('<svg');
});
