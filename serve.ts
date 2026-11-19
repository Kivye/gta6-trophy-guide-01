import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDirectory = fileURLToPath(new URL('./app/', import.meta.url));
const position = process.argv.indexOf('--port');
const port = position < 0 ? 8080 : Number(process.argv[position + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Choose a port from 1 to 65535.');
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const candidate = resolve(publicDirectory, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!candidate.startsWith(resolve(publicDirectory) + sep)) {
      response.writeHead(403).end('This path is outside the guide.'); return;
    }
    if (!(await stat(candidate)).isFile()) throw new Error('No file');
    const bytes = await readFile(candidate);
    response.writeHead(200, {'Content-Type': contentTypes[extname(candidate)] ?? 'application/octet-stream', 'Content-Length': bytes.length, 'Cache-Control':'no-store'});
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}).end('The requested guide file was not found.');
  }
}).listen(port, '127.0.0.1', () => console.log(`Ledger preview: http://127.0.0.1:${port}`));
