import { expect, test } from '@playwright/test';

test.skip(!process.env.CI, 'La comparación visual necesita el checkout del original');

/**
 * Decodifica las capturas PNG con Canvas del navegador; no agrega dependencias.
 * La tolerancia solo permite diferencias de antialiasing en los primeros 3px
 * de los campos de texto y jamás se aplica al lienzo de exportación.
 */
async function comparePixels(page, before, after) {
  return page.evaluate(async ({ baseline, migrated }) => {
    const decode = async (base64) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + base64;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Canvas de comparación no disponible');
      context.drawImage(image, 0, 0);
      return { width: canvas.width, height: canvas.height, bytes: context.getImageData(0, 0, canvas.width, canvas.height).data };
    };
    const old = await decode(baseline);
    const current = await decode(migrated);
    if (old.width !== current.width || old.height !== current.height) {
      return { changed: Infinity, maxDelta: Infinity, maxX: Infinity, dimensions: [old.width, old.height, current.width, current.height] };
    }
    let changed = 0;
    let maxDelta = 0;
    let maxX = -1;
    let maxY = -1;
    for (let i = 0; i < old.bytes.length; i += 4) {
      let delta = 0;
      for (let channel = 0; channel < 4; channel++) {
        delta = Math.max(delta, Math.abs(old.bytes[i + channel] - current.bytes[i + channel]));
      }
      if (delta === 0) continue;
      changed++;
      maxDelta = Math.max(maxDelta, delta);
      maxX = Math.max(maxX, (i / 4) % old.width);
      maxY = Math.max(maxY, Math.floor((i / 4) / old.width));
    }
    return { changed, maxDelta, maxX, maxY, dimensions: [old.width, old.height] };
  }, { baseline: before.toString('base64'), migrated: after.toString('base64') });
}

for (const width of [1440, 390]) {
  test(`Crónica: campos de contenido visualmente equivalentes a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });

    async function capture(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      await page.evaluate(async () => { await document.fonts.ready; });
      const strap = page.locator('#strapField');
      const rect = await strap.boundingBox();
      if (!rect) throw new Error('No se encontró el campo de volanta');
      const style = await page.locator('#strapText').evaluate((node) => {
        const css = getComputedStyle(node);
        return {
          borderColor: css.borderColor,
          borderWidth: css.borderWidth,
          borderRadius: css.borderRadius,
          backgroundColor: css.backgroundColor,
          color: css.color,
        };
      });
      const photoGap = await page.evaluate(() => {
        const field = document.getElementById('file')?.closest('.control-field');
        const switchField = document.getElementById('showStrap')?.closest('.control-field');
        if (!field || !switchField) throw new Error('Falta foto o selector de volanta');
        return Number((switchField.getBoundingClientRect().top - field.getBoundingClientRect().bottom).toFixed(3));
      });

      return {
        screenshots: await Promise.all([
          page.locator('.switch-row').screenshot({ animations: 'disabled' }),
          strap.screenshot({ animations: 'disabled' }),
          page.locator('.control-field:has(> #headline)').screenshot({ animations: 'disabled' }),
          page.locator('.size-field').screenshot({ animations: 'disabled' }),
        ]),
        strapStyle: style,
        strapSize: [rect.width, rect.height],
        photoGap,
      };
    }

    const old = await capture('http://127.0.0.1:4174/cronica-dev/');
    const updated = await capture('http://127.0.0.1:4173/cronica/');
    expect(updated.strapStyle, 'El CSS de borde/fondo/texto debe ser idéntico').toEqual(old.strapStyle);
    expect(updated.strapSize, 'El campo debe mantener las dimensiones').toEqual(old.strapSize);
    expect(updated.photoGap, 'El espaciado fotografía/contenidos debe ser idéntico').toBe(old.photoGap);
    expect(updated.screenshots.length).toBe(old.screenshots.length);

    for (let i = 0; i < old.screenshots.length; i++) {
      const original = old.screenshots[i];
      const react = updated.screenshots[i];
      if (!original || !react) throw new Error('Falta una captura de control');
      const diff = await comparePixels(page, original, react);
      if (diff.changed > 0) console.log('Diferencia visual medida', { width, control: i, ...diff });
      if (i === 1 || i === 2) {
        // Solo el input y textarea pueden presentar redondeo subpixel del
        // borde izquierdo en Chromium: hasta 20 píxeles, +/-1 RGB, x<=2.
        // No se permite ninguna diferencia en el texto, relleno o resto.
        expect(diff.changed, `Control ${i}: máximo 20 píxeles de borde`).toBeLessThanOrEqual(20);
        expect(diff.maxDelta, `Control ${i}: máximo un nivel RGB`).toBeLessThanOrEqual(1);
        expect(diff.maxX, `Control ${i}: solo borde izquierdo de 3px`).toBeLessThanOrEqual(2);
      } else {
        expect(diff.changed, `Control ${i} pixel-perfect`).toBe(0);
      }
    }
  });
}
