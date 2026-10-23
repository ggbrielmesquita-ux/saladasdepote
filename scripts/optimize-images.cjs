/*
 * Derivados de imagem para a landing page, sem alterar os originais.
 * Requer Sharp instalado separadamente. Use SEO_SHARP_MODULE para informar
 * o caminho do módulo quando ele não estiver disponível no projeto.
 * Execução: node scripts/optimize-images.cjs
 */
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

let sharp;
try {
  sharp = require(process.env.SEO_SHARP_MODULE || 'sharp');
} catch {
  console.error('Sharp não encontrado. Instale-o separadamente ou defina SEO_SHARP_MODULE com o caminho do módulo.');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const imageDirectory = path.join(assets, 'images');
const background = '#FFF9EC';
const qualitySteps = [90, 85, 80, 75, 70];
const sources = [
  ['poster-saladas-criativas-molhos.png', [560, 840, 1122]],
  ['marina.png', [160, 320]],
  ['mockupatt.png', [320, 560, 840]],
  ['kit-completo-saladas-no-pote.png', [320, 560, 840]],
  ['salada-refrescante-molho-citrico.png', [192, 384]],
  ['salada-caprese.png', [192, 384]],
  ['salada-big-mac-molho-especial.png', [192, 384]],
  ['salada-mediterranea-molho-agridoce.png', [192, 384]],
  ['salada-toscana-molho-siciliano.png', [192, 384]],
  ['salada-rustica-mostarda-e-mel.png', [192, 384]],
  ['carrossel3.png', [192, 420, 840, 1080]],
  ['carrosel1.webp', [420, 840, 1080]],
  ['carrossel5.webp', [420, 840, 1080]],
  ['imagem-produto.webp', [420, 819]],
  ['shotmatinal.png', [268]],
  ['oque-vc-vai-encontrar.webp', [360, 720]],
];

// Ordem, parâmetros e conteúdo do manifesto são estáveis entre execuções.
sharp.cache(false);
sharp.concurrency(1);

function relativeUrl(filename) {
  return path.relative(root, filename).split(path.sep).join('/');
}

async function writeIfChanged(filename, data) {
  const existing = await fs.readFile(filename).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (!existing || !existing.equals(data)) await fs.writeFile(filename, data);
}

function orientedDimensions(metadata) {
  const rotated = [5, 6, 7, 8].includes(metadata.orientation);
  return {
    width: rotated ? metadata.height : metadata.width,
    height: rotated ? metadata.width : metadata.height,
  };
}

async function createVariant(sourcePath, basename, width, originalBytes) {
  let result;
  let quality;
  for (quality of qualitySteps) {
    // Sharp aplica o perfil de entrada e produz sRGB; metadados são removidos
    // por padrão. Não usar keepMetadata/withMetadata. O canal alfa é mantido.
    result = await sharp(sourcePath, { failOn: 'error' })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 100, effort: 6, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    if (result.data.length < originalBytes) break;
  }
  const filename = path.join(imageDirectory, `${basename}-${result.info.width}.webp`);
  await writeIfChanged(filename, result.data);
  return {
    src: relativeUrl(filename),
    width: result.info.width,
    height: result.info.height,
    bytes: result.data.length,
    quality,
  };
}

async function iconPng(size) {
  return sharp(path.join(root, 'mockupatt.png'), { failOn: 'error' })
    .rotate()
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 249, b: 236, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toBuffer();
}

function createIco(entries) {
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  entries.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size === 256 ? 0 : size;
    header[entry + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...entries.map(({ png }) => png)]);
}

async function main() {
  await fs.mkdir(imageDirectory, { recursive: true });
  const iconsOnly = process.argv.includes('--icons-only');
  const manifest = iconsOnly ? JSON.parse(await fs.readFile(path.join(assets, 'image-manifest.json'), 'utf8')) : {
    version: 1,
    encoding: { format: 'webp', quality: 90, alphaQuality: 100, effort: 6, withoutEnlargement: true },
    images: {},
    icons: [],
  };
  let originalBytes = 0;
  let variantBytes = 0;
  let largestVariantsBytes = 0;
  let variantCount = 0;
  for (const [filename, requestedWidths] of iconsOnly ? [] : sources) {
    const sourcePath = path.join(root, filename);
    const metadata = await sharp(sourcePath, { failOn: 'error' }).metadata();
    const dimensions = orientedDimensions(metadata);
    const sourceBytes = (await fs.stat(sourcePath)).size;
    const widths = [...new Set(requestedWidths.map((width) => Math.min(width, dimensions.width)))].sort((a, b) => a - b);
    const variants = [];
    for (const width of widths) {
      variants.push(await createVariant(sourcePath, path.parse(filename).name, width, sourceBytes));
    }
    manifest.images[filename] = { ...dimensions, originalBytes: sourceBytes, variants };
    originalBytes += sourceBytes;
    variantBytes += variants.reduce((total, variant) => total + variant.bytes, 0);
    largestVariantsBytes += variants.at(-1).bytes;
    variantCount += variants.length;
    console.log(`${filename}: ${variants.map((variant) => `${variant.width}px / ${Math.round(variant.bytes / 1024)} KiB / q${variant.quality}`).join(', ')}`);
  }

  manifest.icons = [];
  for (const [filename, size] of [
    ['favicon-96.png', 96],
    ['favicon-192.png', 192],
    ['apple-touch-icon.png', 180],
  ]) {
    const png = await iconPng(size);
    const destination = path.join(assets, filename);
    await writeIfChanged(destination, png);
    manifest.icons.push({ src: relativeUrl(destination), width: size, height: size, bytes: png.length });
  }
  const icoEntries = [];
  for (const size of [32, 48]) icoEntries.push({ size, png: await iconPng(size) });
  const ico = createIco(icoEntries);
  await writeIfChanged(path.join(root, 'favicon.ico'), ico);
  manifest.icons.push({ src: 'favicon.ico', sizes: [32, 48], bytes: ico.length });

  const svgPng = await fs.readFile(path.join(assets, 'favicon-192.png'));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><image width="192" height="192" href="data:image/png;base64,${svgPng.toString('base64')}"/></svg>\n`;
  await writeIfChanged(path.join(root, 'favicon.svg'), Buffer.from(svg));
  if (iconsOnly) {
    await writeIfChanged(path.join(assets, 'image-manifest.json'), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
    console.log('Favicons gerados a partir de mockupatt.png.');
    return;
  }

  const social = await sharp(path.join(root, 'mockupatt.png'), { failOn: 'error' })
    .rotate()
    .resize(1200, 630, { fit: 'contain', withoutEnlargement: true, background })
    .flatten({ background })
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer({ resolveWithObject: true });
  const socialPath = path.join(assets, 'social-preview.jpg');
  await writeIfChanged(socialPath, social.data);
  manifest.socialPreview = { src: relativeUrl(socialPath), width: social.info.width, height: social.info.height, bytes: social.data.length };
  manifest.stats = {
    originalCount: sources.length,
    variantCount,
    originalBytes,
    allVariantsBytes: variantBytes,
    largestVariantsBytes,
    largestVariantsSavingsPercent: Number(((1 - largestVariantsBytes / originalBytes) * 100).toFixed(2)),
  };
  await writeIfChanged(path.join(assets, 'image-manifest.json'), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  console.log(JSON.stringify(manifest.stats, null, 2));
}

main().catch((error) => {
  console.error(`Não foi possível gerar as imagens: ${error.message}`);
  process.exitCode = 1;
});
