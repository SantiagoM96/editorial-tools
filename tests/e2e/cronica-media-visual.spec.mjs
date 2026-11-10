import { expect, test } from '@playwright/test';

test.skip(!process.env.CI, 'Se necesita el checkout fijado del origen');

for (const width of [1440, 390]) {
  test(`Crónica: logos, fotografía y zoom sin regresión de interfaz a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });

    async function capture(url) {
      const response = await page.goto(url, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
      });
      const nativeFileInput = await page.locator('#file').evaluate((input) => {
        const field = input.closest('.control-field');
        if (!field) throw Error('Falta contenedor de fotografía');
        const f = field.getBoundingClientRect();
        const r = input.getBoundingClientRect();
        const css = getComputedStyle(input);
        const decimal = (n) => Number(n.toFixed(3));
        return {
          type: input.type,
          accept: input.accept,
          fieldSize: [decimal(f.width), decimal(f.height)],
          offset: [decimal(r.x - f.x), decimal(r.y - f.y)],
          size: [decimal(r.width), decimal(r.height)],
          style: {
            appearance: css.appearance,
            color: css.color,
            background: css.backgroundColor,
            border: css.border,
            padding: css.padding,
            margin: css.margin,
            font: css.font,
            display: css.display,
          },
        };
      });
      return {
        // La diferencia medida del input nativo en CI #42754803280 es de
        // 7 píxeles (1440) o 6 (390), con +/-1 RGB y solo en su borde izquierdo.
        nativeScreenshot: await page.locator('.control-field:has(> #file)').screenshot({ animations: 'disabled' }),
        // El resto de la interfaz exige igualdad visual exacta.
        snapshots: await Promise.all([
          page.locator('.logo-control-field').screenshot({ animations: 'disabled' }),
          page.locator('.control-field:has(> #file) > label').screenshot({ animations: 'disabled' }),
          page.locator('.control-field:has(> #file) > .hint').screenshot({ animations: 'disabled' }),
          page.locator('.preview-zoom').screenshot({ animations: 'disabled' }),
        ]),
        nativeFileInput,
      };
    }

    const baseline = await capture('http://127.0.0.1:4174/cronica-dev/');
    const migrated = await capture('http://127.0.0.1:4173/cronica/');

    expect(migrated.nativeFileInput, 'Input nativo: dimensiones, ubicación y estilos iguales').toEqual(baseline.nativeFileInput);
    const nativeDiff = await page.evaluate(async ({ original, updated }) => {
      const decode = async (encoded) => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + encoded;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) throw Error('Canvas de comparación no disponible');
        context.drawImage(image, 0, 0);
        return { width: canvas.width, height: canvas.height,
          data: context.getImageData(0, 0, canvas.width, canvas.height).data };
      };
      const a = await decode(original), b = await decode(updated);
      if (a.width !== b.width || a.height !== b.height) throw Error('Dimensiones de fotografía distintas');
      let changed = 0, maxDelta = 0, maxX = -1, minY = Infinity, maxY = -1;
      for (let i = 0; i < a.data.length; i += 4) {
        let delta = 0;
        for (let channel = 0; channel < 4; channel++) {
          delta = Math.max(delta, Math.abs(a.data[i + channel] - b.data[i + channel]));
        }
        if (!delta) continue;
        changed++;
        maxDelta = Math.max(maxDelta, delta);
        maxX = Math.max(maxX, (i / 4) % a.width);
        const y = Math.floor((i / 4) / a.width);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      return { changed, maxDelta, maxX, minY, maxY };
    }, {
      original: baseline.nativeScreenshot.toString('base64'),
      updated: migrated.nativeScreenshot.toString('base64'),
    });
    // La tolerancia se limita a la diferencia efectivamente medida:
    // <=10 píxeles, <=1 nivel RGB, columna <=10, filas 60-75.
    // Cambios de texto, campo, posición o cualquier otra región hacen fallar CI.
    expect(nativeDiff.changed).toBeLessThanOrEqual(10);
    expect(nativeDiff.maxDelta).toBeLessThanOrEqual(1);
    expect(nativeDiff.maxX).toBeLessThanOrEqual(10);
    if (nativeDiff.changed > 0) {
      expect(nativeDiff.minY).toBeGreaterThanOrEqual(60);
      expect(nativeDiff.maxY).toBeLessThanOrEqual(75);
    }
    expect(migrated.snapshots.length).toBe(baseline.snapshots.length);
    for (let index = 0; index < baseline.snapshots.length; index++) {
      expect(
        migrated.snapshots[index]?.equals(baseline.snapshots[index]),
        `Control visual ${index} pixel-perfect a ${width}px`,
      ).toBe(true);
    }
  });
}
