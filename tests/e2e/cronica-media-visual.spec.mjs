import { expect, test } from '@playwright/test';

test.skip(!process.env.CI, 'Se necesita el checkout fijado del origen');

/**
 * La tarjeta de fotos es un cambio visual APROBADO frente a la base histórica.
 * Por eso NO debe exigirse identidad pixel-perfect para ese control.
 * Los controles no modificados siguen comparándose pixel a pixel contra la base.
 */
for (const width of [1440, 390]) {
  test(`Crónica: logo y zoom preservados; tarjeta nueva de fotografía a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });

    async function capture(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
      });
      const nativeInput = await page.locator('#file').evaluate((input) => ({
        type: input.type,
        accept: input.accept,
        multiple: input.multiple,
      }));
      const snapshots = await Promise.all([
        page.locator('.logo-control-field').screenshot({ animations: 'disabled' }),
        page.locator('.control-field:has(#file) > .hint').screenshot({ animations: 'disabled' }),
        page.locator('.preview-zoom').screenshot({ animations: 'disabled' }),
      ]);
      const photoCard = await page.locator('.cronica-photo-surface').count()
        ? await page.locator('.cronica-photo-surface').evaluate((surface) => {
          const style = getComputedStyle(surface);
          return {
            borderStyle: style.borderTopStyle,
            minHeight: parseFloat(style.minHeight),
            text: surface.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          };
        })
        : null;
      return { nativeInput, snapshots, photoCard };
    }

    const baseline = await capture('http://127.0.0.1:4174/cronica-dev/');
    const migrated = await capture('http://127.0.0.1:4173/cronica/');

    expect(migrated.nativeInput).toEqual(baseline.nativeInput);
    expect(migrated.photoCard).not.toBeNull();
    expect(migrated.photoCard?.borderStyle).toBe('dashed');
    expect(migrated.photoCard?.minHeight).toBe(width === 390 ? 52 : 56);
    expect(migrated.photoCard?.text).toContain('Seleccioná una fotografía');

    expect(migrated.snapshots).toHaveLength(baseline.snapshots.length);
    for (let index = 0; index < baseline.snapshots.length; index++) {
      expect(
        migrated.snapshots[index]?.equals(baseline.snapshots[index]),
        `Control no modificado ${index} pixel-perfect a ${width}px`,
      ).toBe(true);
    }
  });
}
