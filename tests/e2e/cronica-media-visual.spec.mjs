import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

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
      return Promise.all([
        page.locator('.logo-control-field').screenshot({ animations: 'disabled' }),
        page.locator('.control-field:has(> #file)').screenshot({ animations: 'disabled' }),
        page.locator('.preview-zoom').screenshot({ animations: 'disabled' }),
      ]);
    }
    const old = await capture('http://127.0.0.1:4174/cronica-dev/');
    const current = await capture('http://127.0.0.1:4173/cronica/');
    for (let index = 0; index < old.length; index++) {
      const baseline = old[index], migrated = current[index];
      if (!baseline || !migrated) throw Error('Captura faltante');
      if (!migrated.equals(baseline)) {
        const dir = 'tests/artifacts/media-regression';
        await mkdir(dir, { recursive: true });
        await writeFile(`${dir}/baseline-${width}-${index}.png`, baseline);
        await writeFile(`${dir}/migrated-${width}-${index}.png`, migrated);
        const difference = await page.evaluate(async ({ before, after }) => {
          async function pixels(value) {
            const img = new Image();
            img.src = 'data:image/png;base64,' + value;
            await img.decode();
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const context = canvas.getContext('2d');
            if (!context) throw Error('Canvas decoding unavailable');
            context.drawImage(img, 0, 0);
            return { width: img.width, height: img.height,
              data: context.getImageData(0, 0, img.width, img.height).data };
          }
          const a = await pixels(before), b = await pixels(after);
          if (a.width !== b.width || a.height !== b.height) return { differentDimensions: [a.width,a.height,b.width,b.height] };
          let changed=0,maxDelta=0,minX=99999,minY=99999,maxX=-1,maxY=-1;
          for(let i=0;i<a.data.length;i+=4){
            let delta=0;
            for(let c=0;c<4;c++)delta=Math.max(delta,Math.abs(a.data[i+c]-b.data[i+c]));
            if(!delta)continue;
            changed++;maxDelta=Math.max(maxDelta,delta);
            const x=(i/4)%a.width,y=Math.floor((i/4)/a.width);
            minX=Math.min(minX,x);maxX=Math.max(maxX,x);
            minY=Math.min(minY,y);maxY=Math.max(maxY,y);
          }
          return { size:[a.width,a.height],changed,maxDelta,bounds:[minX,minY,maxX,maxY] };
        }, { before: baseline.toString('base64'),after: migrated.toString('base64') });
        console.log('Media control visual difference', { width, index, ...difference });
      }
      expect(migrated.equals(baseline), `Control ${index} visualmente idéntico a ${width}px`).toBe(true);
    }
  });
}
