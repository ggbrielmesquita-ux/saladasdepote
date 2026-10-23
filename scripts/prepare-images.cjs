// Aplica os derivados existentes, mantendo a composição e os arquivos originais.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const heroSizes = '(min-width: 1152px) 526px, (min-width: 960px) 46vw, (min-width: 576px) 544px, 100vw';
const heroProductSizes = '(min-width: 434px) 384px, calc(100vw - 50px)';

function prepareImages() {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/image-manifest.json'), 'utf8'));
  const file = path.join(root, 'index.html');
  const original = fs.readFileSync(file, 'utf8');
  const html = original.replace(/<img\b[^>]*>/g, image => {
    const source = image.match(/data-image-source="([^"]+)"/)?.[1] || image.match(/\bsrc="([^"]+)"/)?.[1];
    if (!source || /^https?:/.test(source)) return image;
    const entry = manifest.images[source];
    const recipe = /alt="Salada /.test(image) && !/demo-media/.test(image);
    let dimensions, variants, sizes;
    if (entry) {
      dimensions = [entry.width, entry.height];
      variants = entry.variants;
      if (/hero-banner/.test(image)) sizes = heroSizes;
      else if (/hero-product/.test(image)) sizes = heroProductSizes;
      else if (/demo-media/.test(image)) {
        variants = variants.filter(item => item.width >= 420);
        sizes = '(min-width: 480px) 462px, calc(100vw - 42px)';
      } else if (recipe) {
        variants = variants.filter(item => item.width <= 420);
        sizes = '(min-width: 960px) 264px, (min-width: 768px) calc((100vw - 160px) / 3), (min-width: 576px) calc((100vw - 112px) / 2), calc((100vw - 88px) / 2)';
      } else if (/auth-photo/.test(image)) sizes = '140px';
      else if (/offer-product/.test(image)) sizes = '280px';
      else if (/solution-image/.test(image)) sizes = '(min-width: 960px) 400px, (min-width: 768px) 42vw, calc(100vw - 82px)';
      else sizes = '(min-width: 768px) 288px, (min-width: 456px) 414px, calc(100vw - 42px)';
    } else if (/^prova-social-\d\.webp$/.test(source)) {
      dimensions = [397, source === 'prova-social-5.webp' ? 526 : 532];
    } else if (source === 'smoothies-detox-20-receitas.webp') dimensions = [1080, 1350];
    else if (source === 'aguas-saborizadas-15-receitas.webp') dimensions = [819, 1024];
    if (!dimensions) return image;
    image = image.replace(/\s(?:width|height|decoding|srcset|sizes)="[^"]*"/g, '');
    if (variants?.length) {
      const fallback = variants.find(item => item.width >= (recipe ? 384 : /hero-banner/.test(image) ? 840 : 560)) || variants.at(-1);
      image = image.replace(/\bsrc="[^"]+"/, `src="${fallback.src}"`);
      if (!image.includes('data-image-source=')) image = image.replace(/<img\b/, `<img data-image-source="${source}"`);
      if (variants.length > 1) image = image.replace(/>$/, ` srcset="${variants.map(item => `${item.src} ${item.width}w`).join(', ')}" sizes="${sizes}">`);
    }
    if (/offer-product/.test(image)) image = image.replace('alt="Produto"', 'alt="Saladas Criativas + Molhos: coletânea de receitas"');
    return image.replace(/>$/, ` width="${dimensions[0]}" height="${dimensions[1]}" decoding="async">`);
  });
  if (html !== original) fs.writeFileSync(file, html);
}

module.exports = { prepareImages, heroSizes, heroProductSizes };
if (require.main === module) prepareImages();
