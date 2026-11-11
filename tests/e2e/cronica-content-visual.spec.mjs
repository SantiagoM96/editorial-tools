import { expect, test } from '@playwright/test';

test.skip(!process.env.CI, 'La comparación visual necesita el checkout del original');

/**
 * Decodifica las capturas PNG con Canvas del navegador; no agrega dependencias.
 * La tolerancia solo admite cambios de antialiasing en los bordes verticales
 * de inputs y textarea, limitados por cantidad e intensidad. Nunca aplica al PNG.
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
    let changedOutsideSideEdges = 0;
    for (let i = 0; i < old.bytes.length; i += 4) {
      let delta = 0;
      for (let channel = 0; channel < 4; channel++) {
        delta = Math.max(delta, Math.abs(old.bytes[i + channel] - current.bytes[i + channel]));
      }
      if (delta === 0) continue;
      changed++;
      maxDelta = Math.max(maxDelta, delta);
      const px = (i / 4) % old.width;
      const py = Math.floor((i / 4) / old.width);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
      if (px > 7 && px < old.width - 8) changedOutsideSideEdges++;
    }
    return { changed, maxDelta, maxX, maxY, changedOutsideSideEdges, dimensions: [old.width, old.height] };
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
    // Cambio deliberado: Diseño y Textos son ahora paneles independientes,
    // separados por encabezados plegables. El espacio ya no equivale al legado.
    expect(updated.photoGap, 'Paneles separados con encabezados visibles').toBeGreaterThan(old.photoGap);
    expect(updated.photoGap, 'La separación entre controles no debe crecer sin límite').toBeLessThan(180);
    expect(updated.screenshots.length).toBe(old.screenshots.length);

    for (let i = 0; i < old.screenshots.length; i++) {
      const original = old.screenshots[i];
      const react = updated.screenshots[i];
      if (!original || !react) throw new Error('Falta una captura de control');
      const diff = await comparePixels(page, original, react);
      if (diff.changed > 0) console.log('Diferencia visual medida', { width, control: i, ...diff });
      if (i === 1) {
        // Volanta: solo antialias de borde izquierdo, 17 px +/-1 RGB.
        expect(diff.changed, 'Volanta: máximo 20 px de borde').toBeLessThanOrEqual(20);
        expect(diff.maxDelta, 'Volanta: máximo 1 RGB').toBeLessThanOrEqual(1);
        expect(diff.maxX, 'Volanta: solo 3px izquierdos').toBeLessThanOrEqual(2);
      } else if (i === 2) {
        // Textarea: diferencias medidas en esquinas/bordes redondeados.
        // CI #42753020486: 28 px +/-2 a 1440; 35 px +/-1 a 390.
        expect(diff.changed, 'Textarea: máximo 40 px de antialias').toBeLessThanOrEqual(40);
        expect(diff.maxDelta, 'Textarea: máximo 2 RGB').toBeLessThanOrEqual(2);
        expect(diff.changedOutsideSideEdges, 'Textarea: cero cambios fuera de los 8px de bordes').toBe(0);
      } else {
        expect(diff.changed, `Control ${i} pixel-perfect`).toBe(0);
      }
    }
  });
}
