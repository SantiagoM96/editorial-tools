import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const environment = process.env.VITE_EDITORIAL_ENV || 'production';
const base = process.env.EDITORIAL_BASE || '/editorial-tools/';
const root = resolve(process.cwd(), process.env.PAGES_ROOT || 'dist-pages');
const expectedBase = environment === 'development' ? '/editorial-tools/dev/' : '/editorial-tools/';
if (base !== expectedBase) throw new Error('Base de Pages incorrecta: ' + base);

const metadata = JSON.parse(await readFile(resolve(root, 'editorial-deployment.json'), 'utf8'));
if (metadata.environment !== environment || metadata.base !== base) {
  throw new Error('Metadatos de despliegue incompatibles: ' + root);
}
if (process.env.VITE_EDITORIAL_SHA && metadata.sha !== process.env.VITE_EDITORIAL_SHA) {
  throw new Error('El SHA del artefacto no coincide con el checkout.');
}

const entries = [
  'index.html', 'og-image.png', 'cronica/index.html',
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
  if (!html.includes('<meta name="editorial-environment" content="' + environment + '">') ||
      !html.includes('<meta name="editorial-commit" content="' + metadata.sha + '">')) {
    throw Error('Faltan metadatos de entorno o versión: ' + page);
  }
  if (environment === 'development' && (!html.includes('id="editorial-dev-badge"') ||
    !html.includes('<meta name="robots" content="noindex, nofollow">'))) {
    throw Error('Falta marca DEV: ' + page);
  }
  if (environment === 'production') {
    if (html.includes('id="editorial-dev-badge"') ||
        /dashboard de desarrollo/i.test(html)) {
      throw Error('Identificación de DEV filtrada a PROD: ' + page);
    }
    if (page === 'index.html' && !html.includes('<title>Herramientas editoriales</title>')) {
      throw Error('Título de producción incorrecto: ' + page);
    }
  }
  if (environment === 'development' && ['bae/index.html', 'diarioshow/index.html'].includes(page)) {
    const refs = [...html.matchAll(/\b(?:href|src)=["'](\.\/(?:js|css)\/[^"']+)["']/gi)]
      .map(match => match[1]);
    if (!refs.length) throw Error('Faltan referencias CSS/JS en ' + page);
    for (const ref of refs) {
      const url = new URL(ref, 'https://editorial.local/' + page);
      if (url.searchParams.get('editorial_dev_sha') !== metadata.sha.slice(0, 12)) {
        throw Error('Archivo CSS/JS sin invalidación de caché DEV: ' + page + ' → ' + ref);
      }
    }
  }
  if (page === 'index.html' && !html.includes('src="' + base + 'assets/')) {
    throw Error('La aplicación React no apunta al base path ' + base);
  }
  for (const [, ref] of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    if (!ref || /^(?:mailto:|tel:|data:|blob:|#)/.test(ref)) continue;
    const url = new URL(ref, 'https://editorial.local' + base + page);
    if (url.origin !== 'https://editorial.local') continue;
    if (!url.pathname.startsWith(base)) throw Error('Ruta fuera del ambiente: ' + page + ' → ' + ref);
    const destination = resolve(root, url.pathname.slice(base.length));
    if (destination !== root && !destination.startsWith(root + sep)) {
      throw Error('Ruta fuera del artefacto: ' + ref);
    }
    const info = await stat(destination);
    if (info.isDirectory()) await stat(resolve(destination, 'index.html'));
    assetCount++;
  }
}
console.log('OK: ' + environment + ', 4 páginas y ' + assetCount + ' recursos locales bajo ' + base);
