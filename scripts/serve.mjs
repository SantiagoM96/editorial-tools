import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  let target;
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    target = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    let info = await stat(target);
    if (info.isDirectory()) { target = resolve(target, 'index.html'); info = await stat(target); }
    if (!info.isFile()) { res.writeHead(404).end(); return; }
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log('Editorial Tools en http://localhost:' + port + '/'));
