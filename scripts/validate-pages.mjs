import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';

const base = '/editorial-tools/';
const root = resolve(process.cwd(), 'dist-pages');
const entries = [
  'index.html', 'og-image.png', 'cronica/index.html', 'cronica/js/app.js',
  'cronica/cronica-header-logo.svg', 'bae/index.html', 'bae/js/editor.js',
  'bae/js/importer.js', 'bae/halftone-2.svg', 'bae/halftone-editable.svg',
  'diarioshow/index.html', 'diarioshow/js/editor.js', 'diarioshow/js/importer.js',
  '.nojekyll',
];
for (const path of entries) {
  const info = await stat(resolve(root, path));
  if (!info.isFile()) throw Error('Falta archivo: ' + path);
}
let assetCount = 0;
for (const page of ['index.html', 'cronica/index.html', 'bae/index.html', 'diarioshow/index.html']) {
  const html = await readFile(resolve(root, page), 'utf8');
  if (html.includes('santiagom96.github.io/mlz/')) throw Error('Ruta heredada: ' + page);
  if (page === 'index.html' && !html.includes('src="/editorial-tools/assets/')) {
    throw Error('La aplicación React no apunta al base path /editorial-tools/.');
  }
  for (const [, ref] of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    if (!ref || /^(?:mailto:|data:|#)/.test(ref)) continue;
    const url = new URL(ref, 'https://editorial.local' + base + page);
    if (url.origin !== 'https://editorial.local') continue;
    if (!url.pathname.startsWith(base)) throw Error('Ruta fuera del sitio: ' + page + ' → ' + ref);
    const destination = resolve(root, url.pathname.slice(base.length));
    if (destination !== root && !destination.startsWith(root + sep)) {
      throw Error('Ruta fuera del artefacto: ' + ref);
    }
    const info = await stat(destination);
    if (info.isDirectory()) await stat(resolve(destination, 'index.html'));
    assetCount++;
  }
}
console.log('OK: Pages Vite, 4 páginas y ' + assetCount + ' rutas locales válidas bajo ' + base);
