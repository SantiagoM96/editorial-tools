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
        // Capturas exactas de los elementos visuales propios; el botón interno
        // del input type=file es nativo del navegador y se valida por layout,
        // estilos y comportamiento, no por los píxeles de su chrome interno.
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
    expect(migrated.snapshots.length).toBe(baseline.snapshots.length);
    for (let index = 0; index < baseline.snapshots.length; index++) {
      expect(
        migrated.snapshots[index]?.equals(baseline.snapshots[index]),
        `Control visual ${index} pixel-perfect a ${width}px`,
      ).toBe(true);
    }
  });
}
