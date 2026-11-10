import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'cronica/index.html', 'bae/index.html', 'diarioshow/index.html'];
const expected = ['cronica/js/app.js', 'bae/js/editor.js', 'bae/js/importer.js', 'diarioshow/js/editor.js', 'diarioshow/js/importer.js', 'bae/halftone-2.svg', 'bae/halftone-editable.svg'];
const issues = [];
let checkedLinks = 0;
let checkedScripts = 0;

async function exists(relativePath) {
  try { return await stat(resolve(root, relativePath)); }
  catch { return null; }
}

for (const file of [...pages, ...expected]) {
  if (!(await exists(file))) issues.push('Falta archivo: ' + file);
}
for (const page of pages) {
  const html = await readFile(resolve(root, page), 'utf8');
  if (html.includes('santiagom96.github.io/mlz/')) issues.push('Ruta heredada de mlz: ' + page);
  for (const [, reference] of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    if (!reference || reference.startsWith('#')) continue;
    let url;
    try { url = new URL(reference, 'https://editorial.local/' + page); }
    catch { issues.push('URL inválida en ' + page + ': ' + reference); continue; }
    if (url.origin !== 'https://editorial.local') continue;
    const destination = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (destination !== root && !destination.startsWith(root + sep)) {
      issues.push('Ruta fuera del repositorio: ' + reference);
      continue;
    }
    const info = await exists(destination);
    if (!info) issues.push('Enlace roto ' + page + ' -> ' + reference);
    else if (info.isDirectory() && !(await exists(resolve(destination, 'index.html')))) issues.push('Directorio sin index: ' + reference);
    checkedLinks++;
  }
}

async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name);
    if (entry.isDirectory()) await inspect(file);
    else if (entry.isFile() && extname(file) === '.js') {
      try { new Script(await readFile(file, 'utf8'), { filename: file }); checkedScripts++; }
      catch (error) { issues.push('JavaScript inválido en ' + file.slice(root.length + 1) + ': ' + error.message); }
    }
  }
}
for (const dir of ['cronica', 'bae', 'diarioshow']) await inspect(resolve(root, dir));

if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: ' + pages.length + ' páginas, ' + checkedLinks + ' enlaces locales y ' + checkedScripts + ' scripts JS.');
}
