const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 5173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }

  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const relative = path.relative(root, file);
  const contentType = types[path.extname(file).toLowerCase()];
  if (relative.startsWith('..') || path.isAbsolute(relative) || !contentType || relative.split(path.sep).some(part => part.startsWith('.'))) {
    res.writeHead(404);
    return res.end('Not found');
  }

  try {
    const content = await fs.readFile(file);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.on('error', error => {
  console.error(`Não foi possível iniciar o servidor: ${error.message}`);
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Site disponível em http://127.0.0.1:${port}`);
  console.log('Pressione Ctrl+C para encerrar.');
});
