const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { localReferences } = require('./seo.cjs');

const production = process.argv.includes('--production');
const project = path.resolve(__dirname, '..');
const root = production ? path.join(project, 'dist') : project;
const port = Number(process.env.PORT || (production ? 4173 : 5173));
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};

async function start() {
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  const publicFiles = new Set(['index.html', '404.html', 'robots.txt', 'sitemap.xml',
    'favicon.svg', 'favicon.ico', 'assets/favicon-192.png', 'assets/social-preview.jpg',
    ...localReferences(html)]);
  const server = http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    let url, pathname;
    try {
      url = new URL(req.url, 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400);
      return res.end('Bad request');
    }
    if (pathname === '/index.html') {
      res.writeHead(301, { Location: '/' + url.search });
      return res.end();
    }
    let file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative = path.relative(root, file);
    let status = 200;
    if (relative.startsWith('..') || path.isAbsolute(relative) ||
        !publicFiles.has(relative.split(path.sep).join('/')) || pathname === '/404.html') {
      file = path.join(root, '404.html');
      status = 404;
    }
    try {
      const stat = await fs.stat(file);
      const type = types[path.extname(file).toLowerCase()];
      const gzip = production && /^(text\/|application\/xml)/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
      const etag = `"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}${gzip ? '-gzip' : ''}"`;
      const headers = {
        'Content-Type': type, 'X-Content-Type-Options': 'nosniff',
        'Cache-Control': production && status === 200 ? (/image\//.test(type) ? 'public, max-age=86400' : 'public, max-age=0, must-revalidate') : 'no-store',
        'Last-Modified': stat.mtime.toUTCString(), ETag: etag, Vary: 'Accept-Encoding',
      };
      if (!production || status !== 200) headers['X-Robots-Tag'] = 'noindex, follow';
      if (production && status === 200 && req.headers['if-none-match'] === etag) {
        res.writeHead(304, headers);
        return res.end();
      }
      let content = await fs.readFile(file);
      if (gzip) { content = gzipSync(content); headers['Content-Encoding'] = 'gzip'; }
      headers['Content-Length'] = content.length;
      res.writeHead(status, headers);
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, follow' });
      res.end(req.method === 'HEAD' ? undefined : 'Not found');
    }
  });
  server.on('error', error => { console.error(`Não foi possível iniciar o servidor: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Site disponível em http://127.0.0.1:${port}${production ? ' (build de produção)' : ' (desenvolvimento)'}\nPressione Ctrl+C para encerrar.`);
  });
}
start().catch(error => { console.error(`Não foi possível abrir o site: ${error.message}. Execute npm run build antes de npm run preview.`); process.exitCode = 1; });
