import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(root, 'public');
const pages = ['index.html', 'cronica/index.html', 'bae/index.html', 'diarioshow/index.html'];
const expected = [
  'src/main.tsx',
  'public/cronica/js/app.js',
  'public/bae/js/editor.js',
  'public/bae/js/importer.js',
  'public/diarioshow/js/editor.js',
  'public/diarioshow/js/importer.js',
  'public/bae/halftone-2.svg',
  'public/bae/halftone-editable.svg',
];
const errors = [];
let checkedLinks = 0;
let checkedScripts = 0;

async function exists(path) {
  try { return await stat(path); }
  catch { return null; }
}

for (const path of expected) {
  if (!(await exists(resolve(root, path)))) errors.push('Falta archivo: ' + path);
}
for (const page of pages) {
  const isDashboard = page === 'index.html';
  const webRoot = isDashboard ? root : publicRoot;
  const file = resolve(webRoot, page);
  const html = await readFile(file, 'utf8');
  if (html.includes('santiagom96.github.io/mlz/')) errors.push('Ruta heredada: ' + page);
  for (const [, ref] of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    if (!ref || ref.startsWith('#')) continue;
    let url;
    try { url = new URL(ref, 'https://editorial.local/' + page); }
    catch { errors.push('URL inválida: ' + page + ' → ' + ref); continue; }
    if (url.origin !== 'https://editorial.local') continue;
    const destination = resolve(webRoot, '.' + decodeURIComponent(url.pathname));
    if (destination !== webRoot && !destination.startsWith(webRoot + sep)) {
      errors.push('Ruta fuera del sitio: ' + page + ' → ' + ref);
      continue;
    }
    const info = await exists(destination);
    if (!info) errors.push('Enlace roto: ' + page + ' → ' + ref);
    else if (info.isDirectory() && !(await exists(resolve(destination, 'index.html')))) {
      errors.push('Directorio sin index: ' + page + ' → ' + ref);
    }
    checkedLinks++;
  }
}
async function validateLegacyJs(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name);
    if (entry.isDirectory()) await validateLegacyJs(file);
    else if (entry.isFile() && extname(file) === '.js') {
      try { new Script(await readFile(file, 'utf8'), { filename: file }); checkedScripts++; }
      catch (error) { errors.push('JavaScript inválido: ' + file + ': ' + error.message); }
    }
  }
}
for (const slug of ['cronica', 'bae', 'diarioshow']) {
  await validateLegacyJs(resolve(publicRoot, slug));
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: ' + pages.length + ' páginas, ' + checkedLinks + ' rutas y ' + checkedScripts + ' scripts heredados JS.');
}
