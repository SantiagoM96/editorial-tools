import { cpSync, copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist-pages');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

copyFileSync(resolve(root, 'index.html'), resolve(output, 'index.html'));
copyFileSync(resolve(root, 'og-image.png'), resolve(output, 'og-image.png'));
for (const name of ['cronica', 'bae', 'diarioshow']) {
  cpSync(resolve(root, name), resolve(output, name), { recursive: true });
}
writeFileSync(resolve(output, '.nojekyll'), '');
console.log('GitHub Pages: sitio estático preparado en dist-pages/');
