import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const source = resolve(root, 'dist');
const output = resolve(root, 'dist-pages');

rmSync(output, { recursive: true, force: true });
cpSync(source, output, { recursive: true });
writeFileSync(resolve(output, '.nojekyll'), '');
console.log('GitHub Pages: build de Vite copiado a dist-pages/.');
