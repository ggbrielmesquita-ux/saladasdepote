const fs = require('node:fs');
const path = require('node:path');
const { prepareImages, heroSizes } = require('./prepare-images.cjs');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const absolute = relative => new URL(relative, config.siteUrl).href;
const writeChanged = (file, content) => {
  const target = path.join(root, file);
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) fs.writeFileSync(target, content);
};

function validateConfig() {
  const url = new URL(config.siteUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      /^(localhost|127\.|0\.|example\.)/i.test(url.hostname)) {
    throw new Error('Configure uma URL pública HTTPS válida, sem caminho, parâmetros ou fragmento.');
  }
  const routes = new Set();
  for (const page of config.pages) {
    if (!page.path.startsWith('/') || page.path.includes('?') || page.path.includes('#') || routes.has(page.path)) throw new Error('Rota SEO inválida ou repetida.');
    routes.add(page.path);
    const relative = path.relative(root, path.resolve(root, page.file));
    if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(path.join(root, page.file))) throw new Error(`Página inexistente: ${page.file}`);
    if (!page.title || !page.description) throw new Error(`Título e descrição obrigatórios: ${page.file}`);
  }
}

function productPrice(html) {
  const block = html.match(/<div class="price-big"[^>]*>([\s\S]*?)<\/div>/)?.[1];
  const price = block?.replace(/<[^>]*>/g, '').replace(/\s/g, '').match(/^R\$(\d+),(\d{2})$/);
  if (!price) throw new Error('Preço visível não encontrado; não será inventado um preço para os dados estruturados.');
  return `${price[1]}.${price[2]}`;
}

function productImage() {
  const manifestPath = path.join(root, 'assets/image-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const variants = manifest.images?.['mockupatt.png']?.variants;
    if (variants?.length) return variants.at(-1).src;
  }
  return 'mockupatt.png';
}

function structuredData(page, html) {
  const url = absolute(page.path);
  const graph = [
    { '@type': 'WebSite', '@id': absolute('#website'), url: config.siteUrl, name: config.siteName, inLanguage: config.language },
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description,
      inLanguage: config.language, isPartOf: { '@id': absolute('#website') }, mainEntity: { '@id': `${url}#product` } },
    { '@type': 'Product', '@id': `${url}#product`, name: config.siteName, description: page.description,
      url, image: [absolute(productImage())],
      offers: { '@type': 'Offer', url: `${url}#pricing`, priceCurrency: 'BRL', price: productPrice(html) } },
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}

function metadata(page, html) {
  const tag = (property, value) => `  <meta property="${property}" content="${escapeHtml(value)}">`;
  const named = (name, value) => `  <meta name="${name}" content="${escapeHtml(value)}">`;
  const json = JSON.stringify(structuredData(page, html), null, 2).replaceAll('<', '\\u003c');
  const hero = JSON.parse(fs.readFileSync(path.join(root, 'assets/image-manifest.json'), 'utf8')).images['poster-saladas-criativas-molhos.png'];
  const heroSrcset = hero.variants.map(item => `${item.src} ${item.width}w`).join(', ');
  return [
    '  <!-- SEO:START — gerado por npm run seo -->',
    `  <title>${escapeHtml(page.title)}</title>`,
    named('description', page.description),
    named('robots', 'index, follow, max-image-preview:large'),
    named('referrer', 'strict-origin-when-cross-origin'),
    `  <link rel="canonical" href="${escapeHtml(absolute(page.path))}">`,
    '  <link rel="icon" type="image/png" sizes="96x96" href="assets/favicon-96.png">',
    '  <link rel="icon" type="image/x-icon" sizes="32x32 48x48" href="favicon.ico">',
    '  <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">',
    named('theme-color', '#153D1B'),
    `  <link rel="preload" as="image" href="assets/images/poster-saladas-criativas-molhos-840.webp" imagesrcset="${heroSrcset}" imagesizes="${heroSizes}" fetchpriority="high">`,
    tag('og:type', 'website'), tag('og:site_name', config.siteName), tag('og:locale', config.locale),
    tag('og:title', page.title), tag('og:description', page.description), tag('og:url', absolute(page.path)),
    tag('og:image', absolute(page.socialImage)), tag('og:image:width', '1200'), tag('og:image:height', '630'),
    tag('og:image:type', 'image/jpeg'), tag('og:image:alt', page.socialImageAlt),
    named('twitter:card', 'summary_large_image'), named('twitter:title', page.title),
    named('twitter:description', page.description), named('twitter:image', absolute(page.socialImage)), named('twitter:image:alt', page.socialImageAlt),
    '  <script type="application/ld+json" id="site-structured-data">', json, '  </script>',
    '  <!-- SEO:END -->',
  ].join('\n');
}

function generate() {
  validateConfig();
  prepareImages();
  for (const page of config.pages) {
    let html = fs.readFileSync(path.join(root, page.file), 'utf8');
    const block = metadata(page, html);
    if (/<!-- SEO:START/.test(html)) {
      html = html.replace(/  <!-- SEO:START[\s\S]*?<!-- SEO:END -->/, block);
    } else {
      html = html.replace(/\s*<title>[\s\S]*?<\/title>/, '')
        .replace(/\s*<meta name="description"[^>]*>/, '')
        .replace(/\s*<link rel="icon"[^>]*>/g, '')
        .replace(/(<meta name="viewport"[^>]*>)/, `$1\n${block}`);
    }
    writeChanged(page.file, html);
  }

  const entries = config.pages.map(page => {
    const lastModified = fs.statSync(path.join(root, page.file)).mtime.toISOString();
    return `  <url>\n    <loc>${escapeHtml(absolute(page.path))}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`;
  });
  writeChanged('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
  writeChanged('robots.txt', `User-agent: *\nAllow: /\nDisallow: /saladasdepote/\nDisallow: /dist/\n\nSitemap: ${absolute('sitemap.xml')}\n`);
  console.log(`SEO gerado para ${config.pages.length} página(s): ${config.siteUrl}`);
}

function localReferences(html) {
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
    references.push(...match[1].split(',').map(item => item.trim().split(/\s+/)[0]));
  }
  return [...new Set(references.filter(ref => !/^(https?:|mailto:|tel:|#|data:)/i.test(ref)))];
}

function validate(directory = root) {
  validateConfig();
  const errors = [];
  for (const page of config.pages) {
    const html = fs.readFileSync(path.join(directory, page.file), 'utf8');
    const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    if (canonical.length !== 1 || canonical[0][1] !== absolute(page.path)) errors.push('URL canônica ausente, repetida ou incorreta.');
    if ((html.match(/<h1\b/g) || []).length !== 1 || (html.match(/<main\b/g) || []).length !== 1) errors.push('A página deve ter um main e um h1.');
    if (!html.includes('name="robots" content="index, follow, max-image-preview:large"')) errors.push('Diretiva de indexação incorreta.');
    if ((html.match(/<title>/g) || []).length !== 1 || !html.includes(escapeHtml(page.title))) errors.push('Título inválido.');
    const data = JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1] || '{}');
    const product = data['@graph']?.find(item => item['@type'] === 'Product');
    if (!product || product.offers?.price !== productPrice(html) || product.offers?.priceCurrency !== 'BRL') errors.push('Dados do produto não correspondem ao preço visível.');
    if (product && ('review' in product || 'aggregateRating' in product)) errors.push('Não cadastrar avaliações sem dados confirmados.');
    for (const reference of localReferences(html)) {
      const target = path.resolve(directory, reference.split('?')[0]);
      const relative = path.relative(directory, target);
      if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(target)) errors.push(`Recurso local ausente: ${reference}`);
    }
    for (const image of html.matchAll(/<img\b[^>]*>/g)) {
      if (!/\bwidth="\d+"/.test(image[0]) || !/\bheight="\d+"/.test(image[0]) || !/\balt="/.test(image[0])) errors.push('Imagem sem dimensões/alt.');
    }
    if ((html.match(/fbq\('init','1809981600129982'\)/g) || []).length !== 1 ||
        (html.match(/fbq\('track','InitiateCheckout'\)/g) || []).length !== 2) errors.push('Rastreamento deve permanecer único e com os dois eventos de checkout.');
  }
  const sitemap = fs.readFileSync(path.join(directory, 'sitemap.xml'), 'utf8');
  const robots = fs.readFileSync(path.join(directory, 'robots.txt'), 'utf8');
  if (config.pages.some(page => !sitemap.includes(`<loc>${escapeHtml(absolute(page.path))}</loc>`))) errors.push('Sitemap incompleto.');
  if (!robots.includes(`Sitemap: ${absolute('sitemap.xml')}`) || /^Disallow:\s*\/\s*$/m.test(robots)) errors.push('Robots bloqueia a página ou não declara o sitemap.');
  if (errors.length) throw new Error([...new Set(errors)].join('\n'));
  console.log(`Verificação SEO aprovada: ${config.pages.length} página(s), recursos, schema, sitemap e rastreamento.`);
}

module.exports = { root, config, generate, validate, localReferences };
if (require.main === module) {
  try { if (process.argv.includes('--check')) validate(); else { generate(); validate(); } }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
