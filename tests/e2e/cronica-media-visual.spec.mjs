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
      const isMobilePreview = width === 390 && url.includes('4173');
      const zoomOrientation = await page.locator('#photoZoom').evaluate((input) => ({
        min: input.min, max: input.max, value: input.value, writingMode: getComputedStyle(input).writingMode,
      }));
      const zoomSnapshot = await page.locator('.preview-zoom').screenshot({ animations: 'disabled' });
      if (isMobilePreview) await page.getByRole('tab', { name: 'Formato' }).click();
      const hintSnapshot = await page.locator('.control-field:has(#file) > .hint').screenshot({ animations: 'disabled' });
      const snapshots = [hintSnapshot, zoomSnapshot];
      // La tarjeta exterior es distinta, pero sus cuatro opciones preservan
      // dimensión, estados y apariencia interna de sus miniaturas.
      const logo = await page.locator('.logo-choice').evaluateAll((buttons) => buttons.map((button) => {
        const surface = button.querySelector('.logo-choice-preview');
        const s = getComputedStyle(surface), b = surface.getBoundingClientRect();
        return {
          pressed: button.getAttribute('aria-pressed'), title: button.title,
          borderColor: s.borderTopColor, borderWidth: s.borderTopWidth,
          borderRadius: s.borderTopLeftRadius, width: b.width, height: b.height,
        };
      }));
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
      return { nativeInput, snapshots, photoCard, logo, zoomOrientation };
    }

    const baseline = await capture('http://127.0.0.1:4174/cronica-dev/');
    const migrated = await capture('http://127.0.0.1:4173/cronica/');

    expect(migrated.nativeInput).toEqual(baseline.nativeInput);
    expect(migrated.logo).toEqual(baseline.logo);
    expect(migrated.photoCard).not.toBeNull();
    expect(migrated.photoCard?.borderStyle).toBe('dashed');
    expect(migrated.photoCard?.minHeight).toBe(width === 390 ? 52 : 56);
    expect(migrated.photoCard?.text).toContain('Seleccioná una fotografía');

    expect(migrated.snapshots).toHaveLength(baseline.snapshots.length);
    expect(migrated.zoomOrientation.min).toBe(baseline.zoomOrientation.min);
    expect(migrated.zoomOrientation.max).toBe(baseline.zoomOrientation.max);
    expect(migrated.zoomOrientation.value).toBe(baseline.zoomOrientation.value);
    if (width === 390) expect(migrated.zoomOrientation.writingMode).toBe('vertical-lr');
    for (let index = 0; index < baseline.snapshots.length; index++) {
      if (width === 390 && index === 1) continue; // Zoom vertical: cambio intencional.
      if (width === 390 && index === 0) continue; // Foto en acordeón propio: control reubicado; contrato y medidas se comprueban arriba.
      expect(
        migrated.snapshots[index]?.equals(baseline.snapshots[index]),
        `Control sin rediseño ${index} pixel-perfect a ${width}px`,
      ).toBe(true);
    }
  });
}
