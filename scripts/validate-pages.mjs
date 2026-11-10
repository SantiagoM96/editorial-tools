import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';

const root = resolve(process.cwd(), 'dist-pages');
const entries = [
  'index.html',
  'og-image.png',
  'cronica/index.html',
  'cronica/js/app.js',
  'cronica/cronica-header-logo.svg',
  'bae/index.html',
  'bae/js/editor.js',
  'bae/js/importer.js',
  'bae/halftone-2.svg',
  'bae/halftone-editable.svg',
  'diarioshow/index.html',
  'diarioshow/js/editor.js',
  'diarioshow/js/importer.js',
  '.nojekyll',
];

for (const name of entries) {
  const info = await stat(resolve(root, name));
  if (!info.isFile()) throw Error('No es archivo: ' + name);
}

for (const name of ['index.html', 'cronica/index.html', 'bae/index.html', 'diarioshow/index.html']) {
  const html = await readFile(resolve(root, name), 'utf8');
  if (html.includes('santiagom96.github.io/mlz/')) throw Error('URL antigua en ' + name);
  for (const [, href] of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    if (/^(?:https?:|data:|mailto:|#)/i.test(href)) continue;
    const pathname = decodeURIComponent(href.split(/[?#]/, 1)[0]);
    if (!pathname) continue;
    const full = resolve(dirname(resolve(root, name)), pathname);
    if (full !== root && !full.startsWith(root + sep)) throw Error('Ruta fuera del artefacto: ' + href);
    const file = await stat(full);
    if (file.isDirectory()) await stat(resolve(full, 'index.html'));
  }
}
console.log('OK: artefacto Pages autocontenido, 4 páginas, rutas y assets.');
