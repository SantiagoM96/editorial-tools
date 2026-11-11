import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const source = resolve(root, 'dist');
const output = resolve(root, 'dist-pages');
const environment = process.env.VITE_EDITORIAL_ENV || 'production';
const base = process.env.EDITORIAL_BASE || '/editorial-tools/';
const sha = process.env.VITE_EDITORIAL_SHA || 'local';

if (!['development', 'production'].includes(environment)) {
  throw new Error('Entorno desconocido: ' + environment);
}
if (base !== (environment === 'development' ? '/editorial-tools/dev/' : '/editorial-tools/')) {
  throw new Error('Base incompatible con el entorno ' + environment + ': ' + base);
}
if (!existsSync(source)) throw new Error('Falta el build de Vite en dist/.');

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(source, output, { recursive: true });
writeFileSync(resolve(output, '.nojekyll'), '');

const pages = ['index.html', 'cronica/index.html', 'bae/index.html', 'diarioshow/index.html'];
for (const file of pages) {
  const path = resolve(output, file);
  let html = readFileSync(path, 'utf8');
  if (!html.includes('</head>') || !html.includes('</body>')) {
    throw new Error('Documento HTML incompleto: ' + file);
  }
  const metadata = '<meta name="editorial-environment" content="' + environment + '">' +
    '<meta name="editorial-commit" content="' + sha + '">';
  if (environment === 'development') {
    // El aviso se agrega al DOM del sitio, nunca al Canvas ni a las exportaciones.
    const badgeStyle = '<style id="editorial-dev-badge-style">' +
      '#editorial-dev-badge{position:fixed;right:12px;bottom:12px;z-index:2147483647;' +
      'padding:7px 11px;border-radius:7px;background:#1d2530;color:#fff;' +
      'font:600 11px/1.3 system-ui,sans-serif;letter-spacing:.06em;' +
      'box-shadow:0 2px 10px #0004;pointer-events:none}' +
      '#editorial-dev-badge small{display:block;font-size:9px;opacity:.75}' +
      '</style>';
    const badge = '<div id="editorial-dev-badge" data-editorial-env="development" ' +
      'aria-label="Entorno de desarrollo">ENTORNO DE DESARROLLO' +
      '<small>Commit ' + sha.slice(0, 8) + '</small></div>';
    html = html.replaceAll('https://santiagom96.github.io/editorial-tools/',
      'https://santiagom96.github.io/editorial-tools/dev/');
    html = html.replace('</head>', metadata + '<meta name="robots" content="noindex, nofollow">' + badgeStyle + '</head>');
    html = html.replace('</body>', badge + '</body>');
  } else {
    // Producción nunca debe identificarse como un dashboard de desarrollo,
    // tampoco en el título, metadatos sociales o etiquetas accesibles.
    html = html.replaceAll('Dashboard de desarrollo', 'Dashboard editorial')
      .replaceAll('dashboard de desarrollo', 'dashboard editorial')
      .replace('<title>Editorial Tools · Vista previa</title>',
        '<title>Herramientas editoriales</title>');
    html = html.replace('</head>', metadata + '</head>');
  }
  writeFileSync(path, html);
}
writeFileSync(resolve(output, 'editorial-deployment.json'), JSON.stringify({
  environment, base, sha,
}, null, 2) + '\n');
console.log('Build GitHub Pages preparado: ' + environment + ' · ' + base + ' · ' + sha.slice(0, 8));
