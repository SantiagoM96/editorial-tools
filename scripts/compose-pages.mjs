import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [prodArg, devArg, outArg] = process.argv.slice(2);
if (!prodArg || !devArg || !outArg) {
  throw new Error('Uso: node scripts/compose-pages.mjs <prod/dist-pages> <dev/dist-pages> <salida>');
}
const prod = resolve(prodArg);
const dev = resolve(devArg);
const out = resolve(outArg);
if (new Set([prod, dev, out]).size !== 3) throw new Error('Los tres directorios deben ser distintos.');
if (out.startsWith(prod + '/') || out.startsWith(dev + '/')) throw new Error('La salida no puede estar dentro de un build.');

function inspect(dir, environment, base) {
  if (!existsSync(resolve(dir, 'index.html'))) throw new Error('Build inexistente: ' + dir);
  const meta = JSON.parse(readFileSync(resolve(dir, 'editorial-deployment.json'), 'utf8'));
  if (meta.environment !== environment || meta.base !== base) {
    throw new Error('Artefacto incorrecto para ' + environment + ': ' + dir);
  }
  for (const page of ['index.html', 'cronica/index.html', 'bae/index.html', 'diarioshow/index.html']) {
    if (!existsSync(resolve(dir, page))) throw new Error('Página faltante: ' + dir + '/' + page);
  }
  return meta;
}

const prodMeta = inspect(prod, 'production', '/editorial-tools/');
const devMeta = inspect(dev, 'development', '/editorial-tools/dev/');
if (existsSync(resolve(prod, 'dev'))) throw new Error('PROD ya contiene una carpeta reservada para DEV.');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(prod, out, { recursive: true });
cpSync(dev, resolve(out, 'dev'), { recursive: true });
writeFileSync(resolve(out, '.nojekyll'), '');
writeFileSync(resolve(out, 'editorial-release.json'), JSON.stringify({
  production: prodMeta,
  development: devMeta,
}, null, 2) + '\n');
console.log('Artefacto único generado: PROD ' + prodMeta.sha.slice(0, 8) +
  ' / DEV ' + devMeta.sha.slice(0, 8));
